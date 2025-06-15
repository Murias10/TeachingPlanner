import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Event } from '@/entities/event.entity';

@Entity('CLASSROOM')
export class Classroom {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @Column('bigint', { name: 'CODE', unique: true })
    code!: number;

    @Column('varchar', { length: 255, name: 'GIS_URL', unique: true })
    gisUrl!: string;

    @OneToMany(() => Event, (event) => event.classroom)
    events!: Event[];

    // Relación según ALTER TABLE CLASSROOM ADD FOREIGN KEY(ID) REFERENCES EVENT(ID_CLASSROOM)
    @ManyToOne(() => Event, (event) => event.classroomsReverse)
    @JoinColumn({ name: 'ID', referencedColumnName: 'ID_CLASSROOM' })
    reverseEvent!: Event;
}
