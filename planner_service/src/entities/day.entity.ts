import {
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    Column,
    OneToMany,
    ManyToOne,
} from 'typeorm';
import { PuntualEvent } from '@/entities/puntual_event.entity';
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

    @OneToMany(() => PuntualEvent, (puntualEvent) => puntualEvent.day)
    puntualEvents!: PuntualEvent[];

    @ManyToOne(() => Calendar, (calendar) => calendar.days, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;
}
