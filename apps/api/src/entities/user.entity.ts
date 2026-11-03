import { UUID } from 'crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cycle } from './cycle.entity';
import { CycleGoal } from '@basal-temp-log-workspace/model';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid?: UUID;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  email: string;

  /** Bcrypt hash. Never returned in a response — see `AuthService.getMe`. */
  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'boolean' })
  profileIncomplete?: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  username?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'float', nullable: true })
  weight?: number;

  /**
   * When hormonal contraception was stopped, if it was. The first cycle beginning on or after this
   * date is evaluated under its own rule (`R-LIFE-02`), so it is recorded once rather than per cycle.
   */
  @Column({ type: 'date', nullable: true })
  contraceptionStoppedOn?: Date | null;

  /** Whether the user charts to avoid or to achieve a pregnancy; only colours the app. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  goal?: CycleGoal | null;

  @OneToMany(() => Cycle, (cycle) => cycle.user, { cascade: true })
  cycle?: Cycle[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
