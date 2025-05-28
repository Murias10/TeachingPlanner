import "reflect-metadata";

import { DataSource } from 'typeorm';
import { User } from '@/entities/User';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: "localhost",//process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: "db_username", //process.env.DB_USER,
  password: "db_password",//process.env.DB_PASSWORD,
  database: "db_name",//process.env.DB_NAME,
  entities: [User],
  synchronize: true, // usar false en producción
  logging: false,
});
