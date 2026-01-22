import { UUID } from 'crypto';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Measurement } from './measurement.entity';
import { User } from './user.entity';

@Entity({ name: 'cycle' })
export class Cycle {
  @PrimaryGeneratedColumn('uuid')
  uuid?: UUID;

  @Column({ type: 'int' })
  cycleNumber: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'int' })
  bleedingLength: number;

  @Column({ type: 'int' })
  cycleLength: number;

  @Column({ type: 'int' })
  firstHigherTemp: number;

  @ManyToOne(() => User, (user) => user.cycle, { onDelete: 'CASCADE' })
  user?: User;

  @OneToMany(() => Measurement, (measurement) => measurement.cycle, {
    cascade: ['insert', 'update', 'remove'],
  })
  measurements?: Measurement[];
}
