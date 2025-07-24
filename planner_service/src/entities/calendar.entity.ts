import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';
import { Course } from '@/entities/course.entity';

@Entity('CALENDARS')
@Unique('UQ_CALENDAR_UNIQUE', ['course', 'semester'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
export class Calendar {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string

    @Column('timestamp', { name: 'START' })
    start!: Date;

    @Column('timestamp', { name: 'END' })
    end!: Date;

    @Column('smallint', { name: 'SEMESTER' })
    semester!: number;

    @ManyToOne(() => Course, (course) => course.calendars)
    @JoinColumn({ name: 'ID_COURSE' })
    course!: Course;
}
