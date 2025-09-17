import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm'
import { Calendar } from '@/entities/calendar.entity'
import { Degree } from '@/entities/degree.entity'

// Enum con los estados posibles para un curso
export enum CourseState {
  PLANIFICADO = 'PLANIFICADO',     // Curso planificado pero aún no iniciado
  ACTIVO = 'ACTIVO',               // Curso actualmente en desarrollo
  FINALIZADO = 'FINALIZADO'        // Curso completado exitosamente
}

@Entity('COURSES')
@Unique('UQ_COURSE_UNIQUE', ['degree', 'startYear', 'endYear'])
export class Course {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string

  @Column('smallint', { name: 'START_YEAR' })
  startYear!: number

  @Column('smallint', { name: 'END_YEAR' })
  endYear!: number

  @Column({
    type: 'enum',
    enum: CourseState,
    default: CourseState.PLANIFICADO,
    name: 'STATE'
  })
  state!: CourseState

  @ManyToOne(() => Degree, degree => degree.courses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ID_DEGREE' })
  degree!: Degree

  @OneToMany(() => Calendar, calendar => calendar.course)
  calendars!: Calendar[]
}