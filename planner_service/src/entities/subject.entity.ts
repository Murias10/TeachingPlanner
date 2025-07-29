import {
    Entity,
    Unique,
    PrimaryGeneratedColumn,
    Column,
    Check,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Degree } from '@/entities/degree.entity'

@Entity('SUBJECTS')
@Unique('UQ_SUBJECT_UNIQUE', ['acronym', 'semester', 'year', 'degree'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
export class Subject {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { length: 20, name: 'ACRONYM', unique: true })
    acronym!: string

    @Column('smallint', { name: 'SEMESTER' })
    semester!: number;

    @Column('bigint', { name: 'YEAR' })
    year!: number;

    @Column('varchar', { length: 100, name: 'NAME', unique: true })
    name!: string;

    @Column('varchar', { length: 20, name: 'SIES_CODE' })
    siesCode!: string;

    @ManyToOne(() => Degree, degree => degree.courses)
    @JoinColumn({ name: 'ID_DEGREE' })
    degree!: Degree

}
