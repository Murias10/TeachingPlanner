import { DataSource } from 'typeorm';
import { User } from '@/entities/user.entity';
import { Degree } from '@/entities/degree.entity';
import { Course } from '@/entities/course.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Subject } from '@/entities/subject.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Group } from '@/entities/group.entity';
import { Event } from '@/entities/event.entity';
import { Day } from '@/entities/day.entity';

export function createAppDataSource() {
  return new DataSource({
    type: 'mariadb',
    host: process.env.PLANNER_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.PLANNER_DATABASE_PORT ?? '', 10),
    username: process.env.PLANNER_DATABASE_USER,
    password: process.env.PLANNER_DATABASE_PASSWORD,
    database: process.env.PLANNER_DATABASE_DATABASE,
    entities: [User, Degree, Course, Calendar, Classroom, Subject, Group, Event, Day],
    synchronize: false,
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
