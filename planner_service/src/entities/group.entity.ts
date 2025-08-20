import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { Event } from '@/entities/event.entity';
import { Subject } from '@/entities/subject.entity';

@Entity('GROUP')
export class Group {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('bigint', { name: 'NUMBER', unique: true })
    number!: number;

    @Column('varchar', { length: 50, name: 'TYPE' })
    type!: string;

    @ManyToOne(() => Subject, (subject) => subject.groups)
    @JoinColumn({ name: 'ID_SUBJECT' })
    subject!: Subject;

    @ManyToMany(() => Event, (event) => event.groups)
    @JoinTable({
        name: 'EVENT_GROUPS',
        joinColumn: { name: 'ID_GROUP', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'ID_EVENT', referencedColumnName: 'id' },
    })
    events!: Event[];
}
