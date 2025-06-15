import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { DateEntity } from '@/entities/date.entity';

@Entity('EXCEPTION_CANCELLED')
export class ExceptionCancelled {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;

    @Column('varchar', { length: 255, name: 'ID_DATE' })
    idDate!: string;

    @Column('varchar', { length: 255, name: 'COMMENT' })
    comment!: string;

    @ManyToOne(() => DateEntity, (date) => date.exceptionsCancelled)
    @JoinColumn({ name: 'ID_DATE' })
    date!: DateEntity;
}
