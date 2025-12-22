import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Classroom } from '@/entities/classroom.entity';

/**
 * GoogleClassroomCalendar entity
 * Represents a Google Calendar created for a specific classroom
 * One Google Calendar per classroom, created automatically when user connects Google account
 */
@Entity('GOOGLE_CLASSROOM_CALENDARS')
@Index('IDX_GOOGLE_CLASSROOM_CALENDAR_USER', ['userId'])
@Index('IDX_GOOGLE_CLASSROOM_CALENDAR_CLASSROOM', ['userId', 'classroomId'], { unique: true })
export class GoogleClassroomCalendar extends AuditedEntity {
    /** User ID who owns this Google Calendar */
    @Column('varchar', { name: 'USER_ID', length: 36 })
    userId!: string;

    /** Google Calendar ID (external) */
    @Column('varchar', { name: 'GOOGLE_CALENDAR_ID', length: 255 })
    googleCalendarId!: string;

    /** Name of the Google Calendar (classroom code) */
    @Column('varchar', { name: 'GOOGLE_CALENDAR_NAME', length: 255 })
    googleCalendarName!: string;

    /** Classroom this Google Calendar represents */
    @ManyToOne(() => Classroom, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CLASSROOM' })
    classroom!: Classroom;

    /** Classroom ID for easier queries */
    @Column('varchar', { name: 'ID_CLASSROOM', length: 36 })
    classroomId!: string;
}
