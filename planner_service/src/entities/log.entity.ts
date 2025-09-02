import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '@/entities/user.entity';

@Entity('LOGS')
export class Log {
    @PrimaryGeneratedColumn('uuid', { name: 'ID' })
    id!: string;

    @Column('timestamp', { name: 'DATE' })
    date!: Date;

    @Column('varchar', { length: 255, name: 'DESCRIPTION' })
    description!: string;

    @Column('varchar', { length: 255, name: 'ID_USER' })
    idUser!: string;

    @ManyToOne(() => User, (user) => user.logs)
    @JoinColumn({ name: 'ID_USER' })
    user!: User;
}
