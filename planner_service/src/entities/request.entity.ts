import { Entity, PrimaryColumn } from 'typeorm';

@Entity('REQUEST')
export class Request {
    @PrimaryColumn('varchar', { length: 255, name: 'ID' })
    id!: string;
}
