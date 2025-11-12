import { Entity, PrimaryColumn } from 'typeorm';

/**
 * Request entity representing a request record
 * Uses a custom string ID (not a UUID) as primary key
 * Currently does not extend AuditedEntity as it serves as a simple reference entity
 */
@Entity('REQUEST')
export class Request {
    /** Custom identifier for the request */
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;
}
