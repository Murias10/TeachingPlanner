import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('DEGREES')
export class Degree {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { length: 100, name: 'NAME', unique: true })
    name!: string;

    @Column('varchar', { length: 20, name: 'ACRONYM', unique: true })
    acronym!: string;
}