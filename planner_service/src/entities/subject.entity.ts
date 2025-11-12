import {
    Entity,
    Unique,
    Column,
    Check,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { Degree } from '@/entities/degree.entity'
import { Group } from '@/entities/group.entity';

/**
 * Subject entity representing an academic subject/course
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('SUBJECTS')
@Unique('UQ_SUBJECT_NAME_DEGREE', ['name', 'degree'])
@Unique('UQ_SUBJECT_ACRONYM_DEGREE', ['acronym', 'degree'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
@Check('CHK_YEAR', '"YEAR" IN (1, 2, 3, 4)')
export class Subject extends AuditedEntity {
    /** Acronym for the subject */
    @Column('varchar', { length: 20, name: 'ACRONYM' })
    acronym!: string

    /** Semester in which the subject is taught (1 or 2) */
    @Column('int', { name: 'SEMESTER' })
    semester!: number;

    /** Year of study in which the subject is taught (1-4) */
    @Column('int', { name: 'YEAR' })
    year!: number;

    /** Full name of the subject */
    @Column('varchar', { length: 100, name: 'NAME' })
    name!: string;

    /** SIES code identifier for the subject */
    @Column('varchar', { length: 20, name: 'SIES_CODE' })
    siesCode!: string;

    /** Groups that belong to this subject */
    @OneToMany(() => Group, (group) => group.subject)
    groups!: Group[];

    /** Degree this subject belongs to */
    @ManyToOne(() => Degree, degree => degree.subjects, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_DEGREE' })
    degree!: Degree
}