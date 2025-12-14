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
 * CalendarSync entity for tracking Google Calendar synchronization
 * Maps a local Calendar to a Google Calendar and tracks sync state
 */
@Entity('CALENDAR_SYNCS')
@Index('IDX_CALENDAR_SYNC_USER', ['userId'])
@Index('IDX_CALENDAR_SYNC_STATUS', ['syncStatus'])
export class CalendarSync extends AuditedEntity {
    /** User ID who owns this sync configuration */
    @Column('varchar', { name: 'USER_ID', length: 36 })
    userId!: string;

    /** Google Calendar ID (external) */
    @Column('varchar', { name: 'GOOGLE_CALENDAR_ID', length: 255, nullable: true })
    googleCalendarId?: string;

    /** Name of the Google Calendar */
    @Column('varchar', { name: 'GOOGLE_CALENDAR_NAME', length: 255, nullable: true })
    googleCalendarName?: string;

    /** Whether sync is enabled for this calendar */
    @Column('boolean', { name: 'SYNC_ENABLED', default: true })
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

    /** JSON mapping of local event IDs to Google event IDs */
    @Column('json', { name: 'EVENT_MAPPINGS', nullable: true })
    eventMappings?: Record<string, string>;

    /** Calendar this sync configuration belongs to */
    @ManyToOne(() => Calendar, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;
}
