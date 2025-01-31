import { UUID } from 'crypto';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Measurement } from './measurement.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id?: UUID;

  @Column({ type: 'varchar', length: 30 })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 40 })
  email: string;

  @Column({ type: 'int' })
  age: number;

  @OneToMany(() => Measurement, (measurement) => measurement.user)
  measurements?: Measurement[];
}
