import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';
import { Course } from '@/entities/course.entity';

@Entity('CALENDAR')
@Unique('UQ_CALENDAR_UNIQUE', ['ID_COURSE', 'SEMESTER'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
export class Calendar {
    @PrimaryColumn('varchar', { length: 36, name: 'ID' })
    id!: string;

    @Column('timestamp', { name: 'START' })
    start!: Date;

    @Column('timestamp', { name: 'END' })
    end!: Date;

    @Column('varchar', { length: 36, name: 'ID_COURSE' })
    idCourse!: string;

    @Column('smallint', { name: 'SEMESTER' })
    semester!: number;

    @ManyToOne(() => Course, (course) => course.calendars)
    @JoinColumn({ name: 'ID_COURSE' })
    course!: Course;
}