import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('USERS')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column('varchar', { length: 255, name: 'NAME' })
  name!: string;

  @Column('varchar', { length: 255, name: 'FIRST_SURNAME' })
  firstSurname!: string;

  @Column('varchar', { length: 255, name: 'SECOND_SURNAME' })
  secondSurname!: string;

  @Column('varchar', { length: 255, name: 'ROLE' })
  role!: string;

  @Column('varchar', { length: 255, name: 'EMAIL', unique: true })
  email!: string;

  @Column('varchar', { length: 255, name: 'PASSWORD' })
  password!: string;
}
