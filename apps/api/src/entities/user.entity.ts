import { UUID } from 'crypto';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cycle } from './cycle.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid?: UUID;

  @Column({ type: 'varchar', length: 50 })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'boolean' })
  profileIncomplete?: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  username?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: number;

  @Column({ type: 'float', nullable: true })
  weight?: number;

  @OneToMany(() => Cycle, (cycle) => cycle.user, { cascade: true })
  cycle?: Cycle[];
}
