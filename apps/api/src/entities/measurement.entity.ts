import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import {
  BleedingOption,
  CervixFeelingOption,
  CervixPositionOption,
  IntercourseOption,
  MucusAppearanceOption,
  MucusFeelingOption,
  PainOption,
} from '@basal-temp-log-workspace/model';
import { UUID } from 'crypto';
import { Cycle } from './cycle.entity';

@Entity()
export class Measurement {
  @PrimaryGeneratedColumn()
  uuid: UUID;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float' })
  temperature: number;

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

  @ManyToOne(() => Cycle, (cycle) => cycle.measurements)
  cycle?: Cycle;
}
