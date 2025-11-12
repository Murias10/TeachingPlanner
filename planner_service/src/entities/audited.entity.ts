import {
    CreateDateColumn,
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Abstract base entity class with audit tracking columns
 *
 * All entities that need audit tracking should extend this class.
 * This provides automatic tracking of who created/updated records and when.
 *
 * Columns automatically managed by this class:
 * - `id`: Unique identifier (UUID, primary key)
 * - `createdAt`: Timestamp of record creation (auto-set on insert)
 * - `createdBy`: Email of user who created the record (must be set by controller)
 * - `updatedAt`: Timestamp of last update (NULL on insert, auto-updated on subsequent saves)
 * - `updatedBy`: Email of user who last updated the record (must be set by controller)
 *
 * @example
 * ```typescript
 * @Entity('CALENDARS')
 * export class Calendar extends AuditedEntity {
 *   @Column('varchar', { name: 'NAME', length: 255 })
 *   name!: string;
 *   // ... other columns
 * }
 * ```
 *
 * When creating a record:
 * ```typescript
 * const calendar = repo.create({
 *   name: 'Spring 2024',
 *   createdBy: req.user?.email,  // Extract from authenticated request
 *   // ... other fields
 * });
 * ```
 *
 * When updating:
 * ```typescript
 * Object.assign(calendar, {
 *   name: 'Updated Name',
 *   updatedBy: req.user?.email,  // Extract from authenticated request
 * });
 * await repo.save(calendar);
 * ```
 */
export abstract class AuditedEntity {
    /**
     * Unique identifier for the entity (UUID)
     * Generated automatically on insert
     */
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    /**
     * Timestamp when the record was created
     * Automatically set by TypeORM on insert
     * Uses database server time for consistency
     */
    @CreateDateColumn({ name: 'CREATED_AT', type: 'timestamp' })
    createdAt!: Date;

    /**
     * Email address of the user who created the record
     * Must be set explicitly in the controller using req.user?.email
     * Nullable to support existing records without audit info
     */
    @Column('varchar', { name: 'CREATED_BY', length: 255, nullable: true })
    createdBy!: string | null;

    /**
     * Timestamp when the record was last updated
     * NULL on creation, updated manually in controllers when record is modified
     * Must be set explicitly using: updatedAt = new Date()
     * Uses database server time for consistency
     */
    @Column({ name: 'UPDATED_AT', type: 'timestamp', nullable: true, default: null })
    updatedAt!: Date | null;

    /**
     * Email address of the user who last updated the record
     * Must be set explicitly in the controller using req.user?.email
     * Nullable to support existing records without audit info
     */
    @Column('varchar', { name: 'UPDATED_BY', length: 255, nullable: true })
    updatedBy!: string | null;
}
