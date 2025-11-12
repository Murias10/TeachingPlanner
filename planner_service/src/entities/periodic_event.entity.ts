import {
    Entity,
    Column,
    ManyToMany,
    JoinTable,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Group } from '@/entities/group.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Calendar } from '@/entities/calendar.entity';

/**
 * PeriodicEvent entity representing a recurring event in the calendar
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 * A periodic event occurs on a specific day of the week for all lective weeks of a given year
 */
@Entity('PERIODIC_EVENTS')
export class PeriodicEvent extends AuditedEntity {
    /** Start time of the event */
    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    /** End time of the event */
    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    /** Year in which this periodic event occurs */
    @Column('int', { name: 'YEAR' })
    year!: number;

    /** Day of the week on which this event occurs (e.g., 'Monday', 'Tuesday') */
    @Column('varchar', { length: 10, name: 'WEEK_DAY' })
    weekDay!: string;

    /** Character or type of the event (e.g., 'Lecture', 'Practice', 'Laboratory') */
    @Column('varchar', { length: 50, name: 'EVENT_CHARACTER' })
    eventCharacter!: string;

    /** Number of hours planned for this event */
    @Column('int', { name: 'PLANIFIED_HOURS' })
    planifiedHours!: number;

    /** Calendar this periodic event belongs to */
    @ManyToOne(() => Calendar, calendar => calendar.periodicEvents, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;

    /** Groups participating in this periodic event */
    @ManyToMany(() => Group, (group) => group.periodicEvents)
    @JoinTable({
        name: 'PERIODIC_EVENTS_GROUPS',
        joinColumn: { name: 'ID_PERIODIC_EVENT', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_GROUP', referencedColumnName: 'id' },
    })
    groups!: Group[];

    /** Classrooms where this periodic event will be held */
    @ManyToMany(() => Classroom, (classroom) => classroom.periodicEvents)
    @JoinTable({
        name: 'PERIODIC_EVENTS__CLASSROOMS',
        joinColumn: { name: 'ID_CLASSROOM', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_PERIODIC_EVENT', referencedColumnName: 'id' },
    })
    classrooms!: Classroom[];

}
