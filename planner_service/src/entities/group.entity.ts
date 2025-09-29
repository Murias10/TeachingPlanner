import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinColumn,
    ManyToOne,
    Unique,
} from 'typeorm';
import { Event } from '@/entities/event.entity';
import { Subject } from '@/entities/subject.entity';

@Entity('GROUPS')
@Unique('UQ_GROUP_UNIQUE', ['subject', 'number', 'type', 'language'])
export class Group {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('bigint', { name: 'NUMBER' })
    number!: number;

    @Column('varchar', { length: 50, name: 'TYPE' })
    type!: string;

    @Column('varchar', { length: 2, name: 'LANGUAGE' })
    language!: string;

    @ManyToOne(() => Subject, (subject) => subject.groups, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_SUBJECT' })
    subject!: Subject;

    @ManyToMany(() => Event, (event) => event.groups, {
        cascade: true,
    })
    events!: Event[];
}
