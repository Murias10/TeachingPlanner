import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Calendar } from '@/entities/calendar.entity';

export enum SyncStatus {
    IDLE = 'IDLE',
    SYNCING = 'SYNCING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

/**
 * CalendarSync entity for tracking academic calendar synchronization
 * Controls which academic calendars are enabled for syncing to Google Calendar
 * Events from enabled calendars are distributed to classroom Google Calendars based on location
 */
@Entity('CALENDAR_SYNCS')
@Index('IDX_CALENDAR_SYNC_USER', ['userId'])
@Index('IDX_CALENDAR_SYNC_CALENDAR', ['userId', 'calendarId'], { unique: true })
@Index('IDX_CALENDAR_SYNC_STATUS', ['syncStatus'])
export class CalendarSync extends AuditedEntity {
    /** User ID who owns this sync configuration */
    @Column('varchar', { name: 'USER_ID', length: 36 })
    userId!: string;

    /** Whether sync is enabled for this calendar */
    @Column('boolean', { name: 'SYNC_ENABLED', default: false })
    syncEnabled!: boolean;

    /** Last successful sync timestamp */
    @Column('timestamp', { name: 'LAST_SYNC_AT', nullable: true })
    lastSyncAt?: Date;

    /** Current sync status */
    @Column('enum', {
        name: 'SYNC_STATUS',
        enum: SyncStatus,
        default: SyncStatus.IDLE
    })
    syncStatus!: SyncStatus;

    /** Error message from last failed sync */
    @Column('text', { name: 'ERROR_MESSAGE', nullable: true })
    errorMessage?: string;

    /** Total calendars to process in current sync */
    @Column('int', { name: 'TOTAL_CALENDARS', nullable: true })
    totalCalendars?: number;

    /** Calendars processed so far in current sync */
    @Column('int', { name: 'PROCESSED_CALENDARS', nullable: true })
    processedCalendars?: number;

    /** Current operation description */
    @Column('varchar', { name: 'CURRENT_OPERATION', length: 255, nullable: true })
    currentOperation?: string;

    /** Academic calendar this sync configuration belongs to */
    @ManyToOne(() => Calendar, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;

    /** Calendar ID for easier queries */
    @Column('varchar', { name: 'ID_CALENDAR', length: 36 })
    calendarId!: string;
}
