import { DataSource } from 'typeorm';
import { MariaDbContainer, StartedMariaDbContainer } from '@testcontainers/mariadb';
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
import { GoogleClassroomCalendar } from '@/entities/google-classroom-calendar.entity';

let mariaDbContainer: StartedMariaDbContainer;
let testDataSource: DataSource;

/**
 * Inicializa el contenedor de MariaDB y la conexión de TypeORM para tests
 */
export async function setupTestDatabase(): Promise<DataSource> {
  // Iniciar contenedor de MariaDB
  mariaDbContainer = await new MariaDbContainer('mariadb:11.2')
    .withDatabase('test_planner_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .start();

  // Crear DataSource con la configuración del contenedor
  testDataSource = new DataSource({
    type: 'mariadb',
    host: mariaDbContainer.getHost(),
    port: mariaDbContainer.getPort(),
    username: mariaDbContainer.getUsername(),
    password: mariaDbContainer.getUserPassword(),
    database: mariaDbContainer.getDatabase(),
    entities: [
      Degree,
      Course,
      Calendar,
      Classroom,
      Subject,
      Group,
      Day,
      PuntualEvent,
      PeriodicEvent,
      EventRequest,
      CalendarSync,
      GoogleClassroomCalendar
    ],
    synchronize: true, // Auto-crear tablas para tests
    logging: false,
    dropSchema: true // Limpiar esquema al inicio
  });

  // Inicializar conexión
  await testDataSource.initialize();

  return testDataSource;
}

/**
 * Cierra la conexión y detiene el contenedor
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy();
  }

  if (mariaDbContainer) {
    await mariaDbContainer.stop();
  }
}

/**
 * Limpia todas las tablas (útil entre tests)
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // Desactivar foreign key checks temporalmente
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  // Limpiar cada tabla
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE ${entity.tableName}`);
  }

  // Reactivar foreign key checks
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Obtiene el DataSource actual de test
 */
export function getTestDataSource(): DataSource {
  if (!testDataSource?.isInitialized) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testDataSource;
}
