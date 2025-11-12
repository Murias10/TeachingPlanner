import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm'
import { AuditedEntity } from '@/entities/audited.entity'
import { Calendar } from '@/entities/calendar.entity'
import { Degree } from '@/entities/degree.entity'

/**
 * Course states enumeration
 */
export enum CourseState {
  /** Course planned but not yet started */
  PLANIFICADO = 'PLANIFICADO',
  /** Course currently in progress */
  ACTIVO = 'ACTIVO',
  /** Course completed */
  FINALIZADO = 'FINALIZADO'
}

/**
 * Course entity representing an academic course within a degree program
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('COURSES')
@Unique('UQ_COURSE_UNIQUE', ['degree', 'startYear', 'endYear'])
export class Course extends AuditedEntity {
  /** Start year of the course */
  @Column('smallint', { name: 'START_YEAR' })
  startYear!: number

  /** End year of the course */
  @Column('smallint', { name: 'END_YEAR' })
  endYear!: number

  /** Current state of the course */
  @Column({
    type: 'enum',
    enum: CourseState,
    default: CourseState.PLANIFICADO,
    name: 'STATE'
  })
  state!: CourseState

  /** Degree this course belongs to */
  @ManyToOne(() => Degree, degree => degree.courses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ID_DEGREE' })
  degree!: Degree

  /** Calendars for this course */
  @OneToMany(() => Calendar, calendar => calendar.course)
  calendars!: Calendar[]
}