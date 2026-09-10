import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Repository, UpdateResult } from 'typeorm';
import { Cycle } from '../../entities/cycle.entity';
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

    const cycle = this.cycleRepository.create({
      ...createCycleDto,
      user,
    });

    const saved = await this.cycleRepository.save(cycle);
    // The owner was attached only to set the foreign key; their row carries the password hash.
    delete saved.user;

    return saved;
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
