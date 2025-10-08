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

@Entity('PERIODIC_EVENTS')
export class PeriodicEvent {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    @Column('int', { name: 'YEAR' })
    year!: number;

    @Column('varchar', { length: 10, name: 'WEEK_DAY' })
    weekDay!: string;

    @Column('varchar', { length: 50, name: 'EVENT_CHARACTER' })
    eventCharacter!: string;

    @ManyToMany(() => Group, (group) => group.periodicEvents)
    @JoinTable({
        name: 'PERIODIC_EVENTS_GROUPS',
        joinColumn: { name: 'ID_PERIODIC_EVENT', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_GROUP', referencedColumnName: 'id' },
    })
    groups!: Group[];

    @ManyToMany(() => Classroom, (classroom) => classroom.periodicEvents)
    @JoinTable({
        name: 'PERIODIC_EVENTS__CLASSROOMS',
        joinColumn: { name: 'ID_CLASSROOM', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_PERIODIC_EVENT', referencedColumnName: 'id' },
    })
    classrooms!: Classroom[];

}
