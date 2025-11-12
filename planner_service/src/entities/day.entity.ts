import {
    Entity,
    JoinColumn,
    Column,
    OneToMany,
    ManyToOne,
    Unique,
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { Calendar } from '@/entities/calendar.entity';

/**
 * Day entity representing a day in the academic calendar
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('DAYS')
export class Day extends AuditedEntity {
    /** Comment or notes for this day */
    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    /** Date of this day */
    @Column('timestamp', { name: 'DATE' })
    date!: Date;

    /** Indicates if this is a lective (teaching) day */
    @Column('boolean', { name: 'LECTIVE' })
    lective!: boolean;

    /** Character or type of the day (e.g., festive, holiday) */
    @Column('varchar', { length: 100, name: 'DAY_CHARACTER' })
    dayCharacter!: string;

    /** Puntual events that occur on this day */
    @OneToMany(() => PuntualEvent, (puntualEvent) => puntualEvent.day)
    puntualEvents!: PuntualEvent[];

    /** Calendar this day belongs to */
    @ManyToOne(() => Calendar, (calendar) => calendar.days, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_CALENDAR' })
    calendar!: Calendar;
}