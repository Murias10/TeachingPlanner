import { DataSource } from 'typeorm';
import { Degree } from '@/entities/degree.entity';
import { Course } from '@/entities/course.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Subject } from '@/entities/subject.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Group } from '@/entities/group.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { Day } from '@/entities/day.entity';
import { EventRequest } from '@/entities/event-request.entity';
import { CalendarSync } from '@/entities/calendar-sync.entity';

export function createAppDataSource() {
  return new DataSource({
    type: 'mariadb',
    host: process.env.PLANNER_DATABASE_HOST,
    port: parseInt(process.env.PLANNER_DATABASE_PORT ?? '', 10),
    username: process.env.PLANNER_DATABASE_USER,
    password: process.env.PLANNER_DATABASE_PASSWORD,
    database: process.env.PLANNER_DATABASE_DATABASE,
    entities: [Degree, Course, Calendar, Classroom, Subject, Group, Day, PuntualEvent, PeriodicEvent, EventRequest, CalendarSync],
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
