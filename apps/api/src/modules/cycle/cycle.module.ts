import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cycle } from '../../entities/cycle.entity';
import { User } from '../../entities/user.entity';
import { CycleController } from './cycle.controller';
import { CycleService } from './cycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cycle, User])],
  controllers: [CycleController],
  providers: [CycleService],
  exports: [CycleService],
})
export class CycleModule {}
