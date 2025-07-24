import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';

@Entity('CLASSROOMS')
export class Classroom {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { name: 'CODE', length: 50, unique: true })
    code!: string;

    @Column('varchar', { name: 'GIS_URL', length: 255, unique: true })
    gisUrl!: string;
}
