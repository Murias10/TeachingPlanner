import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Event } from '@/entities/event.entity';

@Entity('GROUP')
export class Group {
    @PrimaryColumn('bigint', { name: 'ID' })
    id!: number;

    @Column('bigint', { name: 'NUMBER', unique: true })
    number!: number;

    @OneToMany(() => Event, (event) => event.group)
    events!: Event[];
}
