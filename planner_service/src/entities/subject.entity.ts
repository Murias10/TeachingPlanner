import {
    Entity,
    Unique,
    PrimaryGeneratedColumn,
    Column,
    Check,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Degree } from '@/entities/degree.entity'
import { Group } from '@/entities/group.entity';

@Entity('SUBJECTS')
@Unique('UQ_SUBJECT_NAME_DEGREE', ['name', 'degree'])
@Unique('UQ_SUBJECT_ACRONYM_DEGREE', ['acronym', 'degree'])
@Check('CHK_SEMESTER', '"SEMESTER" IN (1, 2)')
@Check('CHK_YEAR', '"YEAR" IN (1, 2, 3, 4)')
export class Subject {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('varchar', { length: 20, name: 'ACRONYM' })
    acronym!: string

    @Column('int', { name: 'SEMESTER' })
    semester!: number;
    
    @Column('int', { name: 'YEAR' })
    year!: number;

    @Column('varchar', { length: 100, name: 'NAME' })
    name!: string;

    @Column('varchar', { length: 20, name: 'SIES_CODE' })
    siesCode!: string;

    @OneToMany(() => Group, (group) => group.subject)
    groups!: Group[];

    @ManyToOne(() => Degree, degree => degree.subjects, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ID_DEGREE' })
    degree!: Degree
}