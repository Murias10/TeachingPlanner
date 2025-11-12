import {
    Entity,
    Column,
    ManyToMany
} from 'typeorm';
import { AuditedEntity } from '@/entities/audited.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';

/**
 * Classroom entity representing a physical or virtual classroom location
 * Inherits audit tracking from AuditedEntity (created_at, created_by, updated_at, updated_by)
 */
@Entity('CLASSROOMS')
export class Classroom extends AuditedEntity {
    /** Unique code or identifier for the classroom */
    @Column('varchar', { name: 'CODE', length: 50, unique: true })
    code!: string;

    /** GIS URL or location information for the classroom */
    @Column('varchar', { name: 'GIS_URL', length: 255 })
    gisUrl!: string;

    /** Periodic events held in this classroom */
    @ManyToMany(() => PeriodicEvent, (periodicEvent) => periodicEvent.classrooms, {
        cascade: true
    })
    periodicEvents!: PeriodicEvent[];

    /** Puntual events held in this classroom */
    @ManyToMany(() => PuntualEvent, (puntualEvent) => puntualEvent.classrooms, {
        cascade: true
    })
    puntualEvents!: PuntualEvent[];
}
