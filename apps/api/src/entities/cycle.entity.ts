import { UUID } from 'crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Measurement } from './measurement.entity';
import { User } from './user.entity';

/**
 * Records only what is observed. Length, end and temperature shift are conclusions derived from the
 * next cycle's start and from the rule evaluation, deliberately not columns.
 */
@Entity({ name: 'cycle' })
export class Cycle {
  @PrimaryGeneratedColumn('uuid')
  uuid?: UUID;

  @Column({ type: 'int', nullable: true })
  cycleNumber?: number;

  @Index()
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'int' })
  bleedingLength: number;

  /** Never null in practice: the service sets the owner from the JWT on every create. */
  @Index()
  @ManyToOne(() => User, (user) => user.cycle, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user?: User;

  @OneToMany(() => Measurement, (measurement) => measurement.cycle, {
    cascade: ['insert', 'update', 'remove'],
  })
  measurements?: Measurement[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
