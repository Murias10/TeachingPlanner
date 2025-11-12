import {
    Entity,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Day } from '@/entities/day.entity';
import { Group } from '@/entities/group.entity';
import { Classroom } from '@/entities/classroom.entity';

/**
 * PuntualEvent entity representing a single, one-time event in the calendar
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 * A puntual event occurs on a specific day and time (not recurring)
 */
@Entity('PUNTUAL_EVENTS')
export class PuntualEvent extends AuditedEntity {
    /** Day on which this event occurs */
    @ManyToOne(() => Day, (day) => day.puntualEvents, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_DAY' })
    day!: Day;

    /** Start time of the event */
    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    /** End time of the event */
    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    /** Indicates if this event has been cancelled */
    @Column('boolean', { name: 'CANCELLED' })
    cancelled!: boolean;

    /** Additional comments or notes about this event */
    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    /** Groups participating in this event */
    @ManyToMany(() => Group, (group) => group.puntualEvents)
    @JoinTable({
        name: 'PUNTUAL_EVENTS_GROUPS',
        joinColumn: { name: 'ID_PUNTUAL_EVENT', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_GROUP', referencedColumnName: 'id' },
    })
    groups!: Group[];

    /** Classrooms where this event will be held */
    @ManyToMany(() => Classroom, (classroom) => classroom.puntualEvents)
    @JoinTable({
        name: 'PUNTUAL_EVENTS_CLASSROOMS',
        joinColumn: { name: 'ID_CLASSROOM', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_PUNTUAL_EVENT', referencedColumnName: 'id' },
    })
    classrooms!: Classroom[];

}
