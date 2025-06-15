import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
    Unique,
} from 'typeorm';
import { Calendar } from '@/entities/calendar.entity';

@Entity('COURSE')
@Unique('UQ_COURSE_UNIQUE', ['ID_DEGREE', 'START_YEAR', 'END_YEAR'])
export class Course {
    @PrimaryColumn('varchar', { length: 36, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 36, name: 'ID_DEGREE' })
    idDegree!: string;

    @Column('smallint', { name: 'START_YEAR' })
    startYear!: number;

    @Column('smallint', { name: 'END_YEAR' })
    endYear!: number;

    @Column('varchar', { length: 20, name: 'STATE' })
    state!: string;

    @OneToMany(() => Calendar, (calendar) => calendar.course)
    calendars!: Calendar[];
}