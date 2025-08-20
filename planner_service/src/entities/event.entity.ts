import {
    Entity,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Day } from '@/entities/day.entity';
import { Group } from '@/entities/group.entity';
import { Classroom } from '@/entities/classroom.entity';

@Entity('EVENT')
export class Event {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @ManyToOne(() => Day, (day) => day.events)
    @JoinColumn({ name: 'ID_DAY' })
    day!: Day;

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

    @ManyToMany(() => Classroom, (classroom) => classroom.events)
    @JoinTable({
        name: 'EVENT_CLASSROOMS', // nombre de la tabla de unión
        joinColumn: { name: 'ID_CLASSROOM', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_EVENT', referencedColumnName: 'id' },
    })
    classrooms!: Classroom[];

}
