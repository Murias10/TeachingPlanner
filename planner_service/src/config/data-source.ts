import "reflect-metadata";

import { DataSource } from 'typeorm';
import { User } from '@/entities/User';

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.PLANNER_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.PLANNER_DATABASE_PORT || '3306', 10),
  username: process.env.PLANNER_DATABASE_USER || '',
  password: process.env.PLANNER_DATABASE_PASSWORD || '',
  database: process.env.PLANNER_DATABASE_DATABASE || '',
  entities: [User],
  synchronize: true,  // Habilita sincronización automática de entidades
  logging: false,     // Desactiva logging de consultas
});
