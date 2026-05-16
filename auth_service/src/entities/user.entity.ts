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

  @Column('varchar', { length: 255, name: 'UNIOVI_USER', nullable: true })
  unioviUser?: string;

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

  @Column('varchar', { length: 255, name: 'ACTIVATION_TOKEN', nullable: true })
  activationToken?: string;

  @Column('datetime', { name: 'TOKEN_EXPIRY', nullable: true })
  tokenExpiry?: Date;

  @Column('boolean', { name: 'IS_ACTIVE', default: false })
  isActive!: boolean;

  @Column('datetime', { name: 'RESET_TOKEN_EXPIRY', nullable: true })
  resetTokenExpiry?: Date;

  // Google OAuth fields
  @Column('text', { name: 'GOOGLE_ACCESS_TOKEN', nullable: true })
  googleAccessToken?: string;

  @Column('text', { name: 'GOOGLE_REFRESH_TOKEN', nullable: true })
  googleRefreshToken?: string;

  @Column('varchar', { length: 255, name: 'GOOGLE_ID', nullable: true })
  googleId?: string;

  @Column('varchar', { length: 255, name: 'GOOGLE_EMAIL', nullable: true })
  googleEmail?: string;

  @Column('datetime', { name: 'GOOGLE_TOKEN_EXPIRY', nullable: true })
  googleTokenExpiry?: Date;

  @Column('boolean', { name: 'GOOGLE_CALENDAR_SYNC_ENABLED', default: false })
  googleCalendarSyncEnabled!: boolean;

  @Column('boolean', { name: 'GOOGLE_DISCONNECTING', default: false })
  googleDisconnecting!: boolean;
}
