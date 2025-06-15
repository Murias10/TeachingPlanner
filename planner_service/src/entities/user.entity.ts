import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Log } from '@/entities/log.entity';

@Entity('USER')
export class User {
  @PrimaryColumn('varchar', { length: 255, name: 'ID' })
  id!: string;

  @Column('varchar', { length: 255, name: 'NAME' })
  name!: string;

  @Column('varchar', { length: 255, name: 'FIRST_SURNAME' })
  firstSurname!: string;

  @Column('varchar', { length: 255, name: 'SECOND_SURNAME' })
  secondSurname!: string;

  @Column('varchar', { length: 255, name: 'ROLE' })
  role!: string;

  @Column('varchar', { length: 255, name: 'PASSWORD' })
  password!: string;

  @OneToMany(() => Log, (log) => log.user)
  logs!: Log[];
}
