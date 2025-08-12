import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToMany,
    JoinTable,
    OneToMany,
} from 'typeorm';
import { Event } from '@/entities/event.entity';
import { Subject } from '@/entities/subject.entity';

@Entity('GROUP')
export class Group {
    @PrimaryColumn('bigint', { name: 'ID' })
    id!: number;

    @Column('bigint', { name: 'NUMBER', unique: true })
    number!: number;

    @Column('varchar', { length: 50, name: 'TYPE' })
    type!: string;

    @OneToMany(() => Group, (group) => group.subject)
    subject!: Subject;

    @ManyToMany(() => Event, (event) => event.groups)
    @JoinTable({
        name: 'GROUP_EVENT', // nombre de la tabla de unión
        joinColumn: { name: 'GROUP_ID', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'EVENT_ID', referencedColumnName: 'id' },
    })
    events!: Event[];
}
