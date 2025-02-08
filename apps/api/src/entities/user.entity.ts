import { UUID } from 'crypto';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Cycle } from './cycle.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid?: UUID;

  @Column({ type: 'varchar', length: 30 })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 40 })
  email: string;

  @Column({ type: 'int' })
  age: number;

  @OneToMany(() => Cycle, (cycle) => cycle.user, { cascade: true })
  cycle?: Cycle[];
}
