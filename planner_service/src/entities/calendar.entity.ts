import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Course } from '@/entities/course.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { Group } from '@/entities/group.entity';
import { Subject } from '@/entities/subject.entity';

/**
 * Calendar entity representing an academic calendar for a specific course and semester
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('CALENDARS')
@Unique('UQ_CALENDAR_UNIQUE', ['course', 'semester'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
export class Calendar extends AuditedEntity {
    /** Start date of the calendar */
    @Column('timestamp', { name: 'START' })
    start!: Date;

    /** End date of the calendar */
    @Column('timestamp', { name: 'END' })
    end!: Date;

    /** Semester number (1 or 2) */
    @Column('smallint', { name: 'SEMESTER' })
    semester!: number;

    /**
     * Characters currently in use in this calendar
     * Stores all event characters assigned to periodic events or days
     * Example: "NPI" means Normal, Par, and Impar are in use
     * Maximum length: 200 characters to support ~90 different event types
     */
    @Column('varchar', { length: 200, name: 'CHARACTERS_IN_USE', default: '' })
    charactersInUse!: string;

    /** Days contained in this calendar */
    @OneToMany(() => Day, (day) => day.calendar)
    days!: Day[];

    /** Periodic events in this calendar */
    @OneToMany(() => PeriodicEvent, (periodicEvent) => periodicEvent.calendar)
    periodicEvents!: PeriodicEvent[]

    /** Groups that belong to this calendar */
    @OneToMany(() => Group, (group) => group.calendar)
    groups!: Group[];

    /** Subjects that belong to this calendar */
    @OneToMany(() => Subject, (subject) => subject.calendar)
    subjects!: Subject[];

    /** Course this calendar belongs to */
    @ManyToOne(() => Course, (course) => course.calendars, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_COURSE' })
    course!: Course;
}
