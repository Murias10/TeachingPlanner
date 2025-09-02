import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Event } from '@/entities/event.entity';

@Entity('CLASSROOMS')
export class Classroom {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { name: 'CODE', length: 50, unique: true })
    code!: string;

    @Column('varchar', { name: 'GIS_URL', length: 255 })
    gisUrl!: string;

    @ManyToMany(() => Event, (event) => event.classrooms)
    events!: Event[];
}
