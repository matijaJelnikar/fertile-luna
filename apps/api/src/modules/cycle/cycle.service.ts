import { CycleDto, UpdateCycleDto } from '@basal-temp-log-workspace/model';
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

  async findOneById(cycleUuid: UUID, userUuid: UUID): Promise<Cycle | null> {
    const cycle = await this.cycleRepository.findOne({
      where: { uuid: cycleUuid, user: { uuid: userUuid } },
      relations: ['user'],
    });

    if (!cycle) {
      throw new NotFoundException(
        'Cycle not found or does not belong to the user'
      );
    }

    return cycle;
  }

  async create(createCycleDto: CycleDto, userUuid: UUID): Promise<Cycle> {
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

    return this.cycleRepository.save(cycle);
  }

  async update(
    cycleUuid: UUID,
    updateCycleDto: UpdateCycleDto,
    userUuid: UUID
  ): Promise<UpdateResult> {
    const cycle = await this.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new NotFoundException(
        'Cycle not found or does not belong to the user'
      );
    }

    return this.cycleRepository.update(cycleUuid, updateCycleDto);
  }

  async removeCycle(
    cycleUuid: UUID,
    userUuid: UUID
  ): Promise<{ affected?: number }> {
    const cycle = await this.findOneById(cycleUuid, userUuid);
    if (!cycle) {
      throw new NotFoundException(
        'Cycle not found or does not belong to the user'
      );
    }

    return this.cycleRepository.delete(cycleUuid);
  }
}
