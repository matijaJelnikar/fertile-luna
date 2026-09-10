import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  DisturbanceReason,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '@basal-temp-log-workspace/model';
import { UUID } from 'crypto';
import { Cycle } from './cycle.entity';

/** One day's observations. At most one per day: a duplicate silently shifts every later day. */
@Entity()
@Unique('UQ_measurement_cycle_date', ['cycle', 'date'])
@Index(['cycle', 'date'])
export class Measurement {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float', nullable: true })
  temperature?: number;

  /** Value kept; the mark tells the engine how to read it (`#R-DIST-02`). */
  @Column({ type: 'boolean', default: false })
  disturbed: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  disturbanceReasons?: DisturbanceReason[];

  @Column({ type: 'enum', enum: BleedingOption, nullable: true })
  bleeding?: BleedingOption;

  @Column({ type: 'enum', enum: PainOption, nullable: true })
  pain?: PainOption;

  @Column({ type: 'enum', enum: MucusFeelingOption, nullable: true })
  mucusFeeling?: MucusFeelingOption;

  @Column({ type: 'enum', enum: MucusAppearanceOption, nullable: true })
  mucusAppearance?: MucusAppearanceOption;

  @Column({ type: 'enum', enum: CervixPositionOption, nullable: true })
  cervixPosition?: CervixPositionOption;

  @Column({ type: 'enum', enum: CervixFeelingOption, nullable: true })
  cervixFeeling?: CervixFeelingOption;

  @Column({ type: 'enum', enum: IntercourseOption, nullable: true })
  intercourse?: IntercourseOption;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  /** Never null in practice: an entry is only ever created inside a cycle the caller owns. */
  @ManyToOne(() => Cycle, (cycle) => cycle.measurements, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  cycle?: Cycle;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
