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

@Entity('COURSES')
@Unique('UQ_COURSE_UNIQUE', ['degree', 'startYear', 'endYear']) // usar nombre de propiedad, no columna
export class Course {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string

  @Column('smallint', { name: 'START_YEAR' })
  startYear!: number

  @Column('smallint', { name: 'END_YEAR' })
  endYear!: number

  @Column('varchar', { length: 20, name: 'STATE' })
  state!: string

  @ManyToOne(() => Degree, degree => degree.courses)
  @JoinColumn({ name: 'ID_DEGREE' })
  degree!: Degree

  @OneToMany(() => Calendar, calendar => calendar.course)
  calendars!: Calendar[]
}
