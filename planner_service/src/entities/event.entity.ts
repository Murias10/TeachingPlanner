import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
} from 'typeorm';
import { DayEntity } from '@/entities/day.entity';
import { Group } from '@/entities/group.entity';

@Entity('EVENT')
export class Event {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @ManyToOne(() => DayEntity, (day) => day.events)
    @JoinColumn({ name: 'ID_DAY' })
    day!: DayEntity;

    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    @Column('varchar', { length: 50, name: 'TYPE' })
    type!: string;

    @Column('boolean', { name: 'CANCELLED' })
    cancelled!: boolean;

    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    @Column('varchar', { length: 50, name: 'EVENT_CHARACTER' })
    eventCharacter!: string;

    @ManyToMany(() => Group, (group) => group.events)
    @JoinTable({
        name: 'GROUP_EVENT', // nombre de la tabla de unión
        joinColumn: { name: 'EVENT_ID', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'GROUP_ID', referencedColumnName: 'id' },
    })
    groups!: Group[];

}
