import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Event } from '@/entities/event.entity';
import { ExceptionCancelled } from '@/entities/exception-cancelled.entity';

@Entity('DATE')
export class DateEntity {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 255, name: 'ID_CALENDAR' })
    idCalendar!: string;

    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    @Column('timestamptz', { name: 'DATE' })
    date!: Date;

    @Column('boolean', { name: 'LECTIVE' })
    lective!: boolean;

    @OneToMany(() => Event, (event) => event.date)
    events!: Event[];

    @OneToMany(
        () => ExceptionCancelled,
        (exception) => exception.date
    )
    exceptionsCancelled!: ExceptionCancelled[];
}
