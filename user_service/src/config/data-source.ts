import { DataSource } from 'typeorm';
import { User } from '@/entities/user.entity';

export function createAppDataSource() {
  return new DataSource({
    type: 'mariadb',
    host: process.env.PLANNER_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.PLANNER_DATABASE_PORT ?? '', 10),
    username: process.env.PLANNER_DATABASE_USER,
    password: process.env.PLANNER_DATABASE_PASSWORD,
    database: process.env.PLANNER_DATABASE_DATABASE,
    entities: [User],
    synchronize: true,
    logging: true,
  });
}

export const AppDataSource = createAppDataSource();

export const connectToPlannerDatabase = async (): Promise<void> => {
  let attempts = 0;

  while (true) {
    try {
      await AppDataSource.initialize();
      console.log('✅ Connected to the database');
      break;
    } catch (err) {
      attempts++;
      console.error(`❌ Failed to connect to the database (attempt ${attempts})`);
      console.error(err);

      if (attempts === 10) {
        console.warn('⚠️ Still trying to connect after 10 failed attempts...');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};
