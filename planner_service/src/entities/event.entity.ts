import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { DateEntity } from '@/entities/date.entity';
import { Subject } from '@/entities/subject.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Group } from '@/entities/group.entity';

@Entity('EVENT')
export class Event {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 255, name: 'ID_DATE' })
    idDate!: string;

    @Column('varchar', { length: 255, name: 'ID_SUBJECT' })
    idSubject!: string;

    @Column('varchar', { length: 255, name: 'ID_CLASSROOM' })
    idClassroom!: string;

    @Column('bigint', { name: 'ID_GROUP' })
    idGroup!: number;

    @Column('time', { name: 'START_TIME' })
    startTime!: string;

    @Column('time', { name: 'END_TIME' })
    endTime!: string;

    @Column('boolean', { name: 'EVENTUAL' })
    eventual!: boolean;

    @ManyToOne(() => DateEntity, (date) => date.events)
    @JoinColumn({ name: 'ID_DATE' })
    date!: DateEntity;

    @ManyToOne(() => Subject, (subject) => subject.events)
    @JoinColumn({ name: 'ID_SUBJECT' })
    subject!: Subject;

    @ManyToOne(() => Classroom, (classroom) => classroom.events)
    @JoinColumn({ name: 'ID_CLASSROOM' })
    classroom!: Classroom;

    @ManyToOne(() => Group, (group) => group.events)
    @JoinColumn({ name: 'ID_GROUP' })
    group!: Group;

    // Relación inversa extra para la FK circular (CLASSROOM.ID → EVENT.ID_CLASSROOM)
    @OneToMany(() => Classroom, (cls) => cls.reverseEvent)
    classroomsReverse!: Classroom[];
}
