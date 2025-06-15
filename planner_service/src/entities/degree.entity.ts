import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('DEGREE')
export class Degree {
    @PrimaryColumn('varchar', { length: 36, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 100, name: 'NAME', unique: true })
    name!: string;
}