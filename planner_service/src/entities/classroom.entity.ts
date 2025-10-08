import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany
} from 'typeorm';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';

@Entity('CLASSROOMS')
export class Classroom {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { name: 'CODE', length: 50, unique: true })
    code!: string;

    @Column('varchar', { name: 'GIS_URL', length: 255 })
    gisUrl!: string;

    @ManyToMany(() => PeriodicEvent, (periodicEvent) => periodicEvent.classrooms, {
        cascade: true
    })
    periodicEvents!: PeriodicEvent[];

    @ManyToMany(() => PuntualEvent, (puntualEvent) => puntualEvent.classrooms, {
        cascade: true
    })
    puntualEvents!: PuntualEvent[];
}
