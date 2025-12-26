import {
    Entity,
    Column,
    ManyToMany,
    JoinColumn,
    ManyToOne,
    Unique,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { Subject } from '@/entities/subject.entity';

/**
 * Group entity representing a group within a subject
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 * A group is a specific section/class of a subject with a unique number, type, and language
 */
@Entity('GROUPS')
@Unique('UQ_GROUP_UNIQUE', ['subject', 'number', 'type', 'language'])
export class Group extends AuditedEntity {
    /** Number/identifier of the group within the subject */
    @Column('bigint', { name: 'NUMBER' })
    number!: number;

    /** Type of the group (e.g., theoretical, practical, laboratory) */
    @Column('varchar', { length: 50, name: 'TYPE' })
    type!: string;

    /** Language of instruction for this group (e.g., 'EN', 'ES') */
    @Column('varchar', { length: 2, name: 'LANGUAGE' })
    language!: string;

    /** Subject this group belongs to */
    @ManyToOne(() => Subject, (subject) => subject.groups, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_SUBJECT' })
    subject!: Subject;

    /** Puntual events associated with this group */
    @ManyToMany(() => PuntualEvent, (puntualEvent) => puntualEvent.groups, {
        cascade: true,
    })
    puntualEvents!: PuntualEvent[];

    /** Periodic events associated with this group */
    @ManyToMany(() => PeriodicEvent, (periodicEvent) => periodicEvent.groups, {
        cascade: true,
    })
    periodicEvents!: Event[];
}
