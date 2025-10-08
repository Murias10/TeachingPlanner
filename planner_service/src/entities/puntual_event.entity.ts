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

@Entity('PUNTUAL_EVENTS')
export class PuntualEvent {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @ManyToOne(() => Day, (day) => day.puntualEvents, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_DAY' })
    day!: Day;

    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    @Column('boolean', { name: 'CANCELLED' })
    cancelled!: boolean;

    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    @ManyToMany(() => Group, (group) => group.puntualEvents)
    @JoinTable({
        name: 'PUNTUAL_EVENTS_GROUPS',
        joinColumn: { name: 'ID_PUNTUAL_EVENT', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_GROUP', referencedColumnName: 'id' },
    })
    groups!: Group[];

    @ManyToMany(() => Classroom, (classroom) => classroom.puntualEvents)
    @JoinTable({
        name: 'PUNTUAL_EVENTS_CLASSROOMS',
        joinColumn: { name: 'ID_CLASSROOM', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_PUNTUAL_EVENT', referencedColumnName: 'id' },
    })
    classrooms!: Classroom[];

}
