import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Calendar } from '@/entities/calendar.entity';

/**
 * EventRequest entity representing a request from a PROFESSOR to create/edit/cancel/replace an event
 * Extends AuditedEntity for automatic audit tracking (createdAt, createdBy, updatedAt, updatedBy)
 */
@Entity('EVENT_REQUESTS')
export class EventRequest extends AuditedEntity {
    /**
     * Email of the professor who requested the event
     */
    @Column('varchar', { name: 'PROFESSOR_ID', length: 255 })
    professorId!: string;

    /**
     * Reference to the calendar where the event should be created
     */
    @Column('varchar', { name: 'CALENDAR_ID', length: 36 })
    calendarId!: string;

    /**
     * Type of event being requested: PUNTUAL (one-time) or PERIODIC (recurring)
     */
    @Column('enum', {
        name: 'EVENT_TYPE',
        enum: ['PUNTUAL', 'PERIODIC'],
    })
    eventType!: 'PUNTUAL' | 'PERIODIC';

    /**
     * Kind of request: CREATE a new event, EDIT an existing one, CANCEL it, or REPLACE it
     * Default: CREATE (backwards compatible with existing requests)
     */
    @Column('enum', {
        name: 'REQUEST_TYPE',
        enum: ['CREATE', 'EDIT', 'CANCEL', 'REPLACE'],
        default: 'CREATE',
    })
    requestType!: 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE';

    /**
     * ID of the existing event that is being edited / cancelled / replaced.
     * NULL for CREATE requests.
     */
    @Column('varchar', { name: 'ORIGINAL_EVENT_ID', length: 36, nullable: true })
    originalEventId!: string | null;

    /**
     * Complete event data in JSON format
     * Contains all information needed to create the event:
     * - For PUNTUAL: dayId, startTime, endTime, classroomIds, groupIds, comment, cancelled
     * - For PERIODIC: startTime, endTime, weekDay, eventCharacter, classroomIds, groupIds, plannedHours
     */
    @Column('json', { name: 'EVENT_DATA' })
    eventData!: Record<string, any>;

    /**
     * Status of the request: PENDING, APPROVED, or REJECTED
     * Default is PENDING
     */
    @Column('enum', {
        name: 'STATUS',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    })
    status!: 'PENDING' | 'APPROVED' | 'REJECTED';

    /**
     * Email of the ADMIN who reviewed the request (approve/reject)
     * NULL if still pending
     */
    @Column('varchar', { name: 'REVIEWED_BY', length: 255, nullable: true })
    reviewedBy!: string | null;

    /**
     * Timestamp when the request was reviewed
     * NULL if still pending
     */
    @Column('timestamp', { name: 'REVIEWED_AT', nullable: true })
    reviewedAt!: Date | null;

    /**
     * Comments from the ADMIN (e.g., reason for rejection or additional notes)
     */
    @Column('text', { name: 'COMMENTS', nullable: true })
    comments!: string | null;

    /**
     * Relationship to Calendar (optional, for convenience)
     * Can be loaded with leftJoinAndSelect if needed
     */
    @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'CALENDAR_ID' })
    calendar?: Calendar;
}
