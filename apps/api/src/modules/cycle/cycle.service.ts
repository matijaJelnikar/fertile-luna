import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Repository, UpdateResult } from 'typeorm';
import { DateUtils } from 'typeorm/util/DateUtils';
import { Cycle } from '../../entities/cycle.entity';
import { Measurement } from '../../entities/measurement.entity';
import { User } from '../../entities/user.entity';
import { CreateCycleRequestDto } from './dto/create-cycle.dto';
import { UpdateCycleRequestDto } from './dto/update-cycle.dto';

@Injectable()
export class CycleService {
  constructor(
    @InjectRepository(Cycle)
    private readonly cycleRepository: Repository<Cycle>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  async findAllByUser(userUuid: UUID): Promise<Cycle[]> {
    return this.cycleRepository.find({
      where: { user: { uuid: userUuid } },
      order: { cycleNumber: 'DESC' },
      relations: ['measurements'],
    });
  }

  async findOneById(cycleUuid: UUID, userUuid: UUID): Promise<Cycle> {
    // Filtering on `user` joins the relation for the where clause without selecting it, so the
    // owner (and their password hash) never rides along into the response.
    const cycle = await this.cycleRepository.findOne({
      where: { uuid: cycleUuid, user: { uuid: userUuid } },
    });

    if (!cycle) {
      throw new NotFoundException(
        'Cycle not found or does not belong to the user'
      );
    }

    return cycle;
  }

  /**
   * Creates a cycle and, in the same transaction, moves the days already recorded from its start on
   * out of the cycle that was open until then. A cycle ends the day before the next one begins
   * (`R-CYCLE-01`), so leaving them behind would file a day in a cycle that no longer contains it.
   */
  async create(
    createCycleDto: CreateCycleRequestDto,
    userUuid: UUID
  ): Promise<Cycle> {
    const user = await this.userRepository.findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // The calendar day exactly as the `date` column will store it. A `Date` parameter is a
    // timestamp, and compared with a `date` column it would shift by the database's timezone.
    const startDay = DateUtils.mixedDateToDateString(createCycleDto.startDate);

    return this.cycleRepository.manager.transaction(async (manager) => {
      const previous = await manager
        .createQueryBuilder(Cycle, 'cycle')
        .where('"cycle"."userUuid" = :userUuid', { userUuid })
        .andWhere('"cycle"."startDate" < :startDay', { startDay })
        .orderBy('"cycle"."startDate"', 'DESC')
        .getOne();

      const saved = await manager.save(
        manager.create(Cycle, { ...createCycleDto, user })
      );

      if (previous) {
        // The new cycle has no entries yet, so the (cycle, date) uniqueness cannot collide.
        await manager
          .createQueryBuilder()
          .update(Measurement)
          .set({ cycle: { uuid: saved.uuid } })
          .where('"cycleUuid" = :previous AND "date" >= :startDay', {
            previous: previous.uuid,
            startDay,
          })
          .execute();
      }

      // The owner was attached only to set the foreign key; their row carries the password hash.
      delete saved.user;

      return saved;
    });
  }

  async update(
    cycleUuid: UUID,
    updateCycleDto: UpdateCycleRequestDto,
    userUuid: UUID
  ): Promise<UpdateResult> {
    await this.findOneById(cycleUuid, userUuid);

    return this.cycleRepository.update(cycleUuid, updateCycleDto);
  }

  async removeCycle(
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<{ affected?: number }> {
    await this.findOneById(cycleUuid, userUuid);

    return this.cycleRepository.delete(cycleUuid);
  }
}
