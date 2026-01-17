import { Entity, Column, OneToMany } from 'typeorm'
import { AuditedEntity } from '@/entities/audited.entity'
import { Course } from '@/entities/course.entity'

/**
 * Degree entity representing an academic degree program
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('DEGREES')
export class Degree extends AuditedEntity {
    /** Full name of the degree program */
    @Column('varchar', { length: 100, name: 'NAME', unique: true })
    name!: string

    /** Acronym or abbreviation of the degree */
    @Column('varchar', { length: 20, name: 'ACRONYM', unique: true })
    acronym!: string

    /** Courses that belong to this degree */
    @OneToMany(() => Course, (course) => course.degree)
    courses!: Course[]
}
