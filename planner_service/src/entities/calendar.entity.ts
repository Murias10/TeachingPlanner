import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';
import { Course } from '@/entities/course.entity';
import { Day } from '@/entities/day.entity';

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

    @OneToMany(() => Day, (day) => day.calendar)
    days!: Day[];

    @ManyToOne(() => Course, (course) => course.calendars, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_COURSE' })
    course!: Course;
}
