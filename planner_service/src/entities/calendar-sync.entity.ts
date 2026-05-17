import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Calendar } from '@/entities/calendar.entity';

export enum SyncStatus {
    IDLE = 'IDLE',
    SYNCING = 'SYNCING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    DELETING = 'DELETING',
    PENDING_RETRY = 'PENDING_RETRY'
}

@Entity('CALENDAR_SYNCS')
@Index('IDX_CALENDAR_SYNC_USER', ['userId'])
@Index('IDX_CALENDAR_SYNC_CALENDAR', ['userId', 'calendarId'], { unique: true })
@Index('IDX_CALENDAR_SYNC_STATUS', ['syncStatus'])
export class CalendarSync extends AuditedEntity {
    @Column('varchar', { name: 'USER_ID', length: 36 })
    userId!: string;

    @Column('timestamp', { name: 'LAST_SYNC_AT', nullable: true })
    lastSyncAt?: Date;

    @Column('enum', { name: 'SYNC_STATUS', enum: SyncStatus, default: SyncStatus.IDLE })
    syncStatus!: SyncStatus;

    @Column('text', { name: 'ERROR_MESSAGE', nullable: true })
    errorMessage?: string;

    @Column('int', { name: 'TOTAL_CALENDARS', nullable: true })
    totalCalendars?: number;

    @Column('int', { name: 'PROCESSED_CALENDARS', nullable: true })
    processedCalendars?: number;

    @Column('varchar', { name: 'CURRENT_OPERATION', length: 255, nullable: true })
    currentOperation?: string;

    @Column('int', { name: 'RETRY_COUNT', default: 0 })
    retryCount!: number;

    @Column('timestamp', { name: 'NEXT_RETRY_AT', nullable: true })
    nextRetryAt?: Date;

    // JSON-serialised string[] of classroom IDs pending calendar creation
    @Column('text', { name: 'PENDING_CLASSROOM_IDS', nullable: true })
    pendingClassroomIds?: string;

    @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;

    @Column('varchar', { name: 'ID_CALENDAR' })
    calendarId!: string;
}