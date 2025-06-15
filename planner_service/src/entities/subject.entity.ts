import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Event } from '@/entities/event.entity';

@Entity('SUBJECT')
export class Subject {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 255, name: 'ACRONYM', unique: true })
    acronym!: string;

    @Column('bigint', { name: 'SEMESTER' })
    semester!: number;

    @Column('varchar', { length: 255, name: 'COURSE' })
    course!: string;

    @Column('bigint', { name: 'YEAR' })
    year!: number;

    @Column('varchar', { length: 255, name: 'NAME', unique: true })
    name!: string;

    @Column('bigint', { name: 'ES_THEORY_GROUPS' })
    esTheoryGroups!: number;

    @Column('bigint', { name: 'ES_SEMINAR_GROUPS' })
    esSeminarGroups!: number;

    @Column('bigint', { name: 'ES_LAB_GROUPS' })
    esLabGroups!: number;

    @Column('bigint', { name: 'ES_TG_GROUPS' })
    esTgGroups!: number;

    @Column('bigint', { name: 'EN_THEORY_GROUPS' })
    enTheoryGroups!: number;

    @Column('bigint', { name: 'EN_SEMINAR_GROUPS' })
    enSeminarGroups!: number;

    @Column('bigint', { name: 'EN_LAB_GROUPS' })
    enLabGroups!: number;

    @Column('bigint', { name: 'EN_TG_GROUPS' })
    enTgGroups!: number;

    @Column('varchar', { length: 255, name: 'SIES_CODE' })
    siesCode!: string;

    @OneToMany(() => Event, (event) => event.subject)
    events!: Event[];
}
