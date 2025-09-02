import {
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    Column,
    OneToMany,
    ManyToOne,
} from 'typeorm';
import { Event } from '@/entities/event.entity';
import { Calendar } from '@/entities/calendar.entity';

@Entity('DAYS')
export class Day {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    @Column('timestamp', { name: 'DATE' })
    date!: Date;

    @Column('boolean', { name: 'LECTIVE' })
    lective!: boolean;

    @Column('varchar', { length: 100, name: 'DAY_CHARACTER' })
    dayCharacter!: string;

    @OneToMany(() => Event, (event) => event.day)
    events!: Event[];

    @ManyToOne(() => Calendar, (calendar) => calendar.days)
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;
}
