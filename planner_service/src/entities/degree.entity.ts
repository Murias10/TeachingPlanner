import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Course } from '@/entities/course.entity'

@Entity('DEGREES')
export class Degree {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string

    @Column('varchar', { length: 100, name: 'NAME', unique: true })
    name!: string

    @Column('varchar', { length: 20, name: 'ACRONYM', unique: true })
    acronym!: string

    @OneToMany(() => Course, (course) => course.degree)
    courses!: Course[]
}
