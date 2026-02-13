import { DataSource } from 'typeorm';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from '../setup/testDatabase';
import { Degree } from '@/entities/degree.entity';
import { Course, CourseState } from '@/entities/course.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Day } from '@/entities/day.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';

describe('Calendar Delete Integration Tests', () => {
  let dataSource: DataSource;

  // Setup: Inicializar DB antes de todos los tests
  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  }, 120000); // 2 minutos timeout para iniciar contenedor

  // Cleanup: Limpiar DB después de cada test
  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  // Teardown: Cerrar DB y contenedor después de todos los tests
  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('DELETE calendar with CASCADE', () => {
    it('should delete calendar and all related entities (days, events, groups, subjects)', async () => {
      // ========== ARRANGE: Crear estructura completa ==========
      const degreeRepo = dataSource.getRepository(Degree);
      const courseRepo = dataSource.getRepository(Course);
      const calendarRepo = dataSource.getRepository(Calendar);
      const subjectRepo = dataSource.getRepository(Subject);
      const groupRepo = dataSource.getRepository(Group);
      const dayRepo = dataSource.getRepository(Day);
      const puntualEventRepo = dataSource.getRepository(PuntualEvent);
      const periodicEventRepo = dataSource.getRepository(PeriodicEvent);

      // 1. Crear Degree
      const degree = degreeRepo.create({
        name: 'Grado en Ingeniería Informática',
        acronym: 'GII'
      });
      await degreeRepo.save(degree);

      // 2. Crear Course
      const course = courseRepo.create({
        startYear: 2024,
        endYear: 2025,
        state: CourseState.ACTIVO,
        degree: degree
      });
      await courseRepo.save(course);

      // 3. Crear Calendar
      const calendar = calendarRepo.create({
        start: new Date('2024-09-01'),
        end: new Date('2025-01-31'),
        semester: 1,
        course: course
      });
      await calendarRepo.save(calendar);

      // 4. Crear Subject
      const subject = subjectRepo.create({
        name: 'Programación',
        acronym: 'PROG',
        semester: 1,
        year: 1,
        siesCode: 'PROG001',
        calendar: calendar
      });
      await subjectRepo.save(subject);

      // 5. Crear Group
      const group = groupRepo.create({
        number: 1,
        type: 'teoría',
        language: 'ES',
        planifiedHours: 40,
        calendar: calendar,
        subject: subject
      });
      await groupRepo.save(group);

      // 6. Crear Days
      const day1 = dayRepo.create({
        date: new Date('2024-09-02'),
        lective: true,
        dayCharacter: 'N',
        comment: 'Normal day',
        calendar: calendar
      });
      const day2 = dayRepo.create({
        date: new Date('2024-09-03'),
        lective: true,
        dayCharacter: 'N',
        comment: 'Normal day',
        calendar: calendar
      });
      await dayRepo.save([day1, day2]);

      // 7. Crear PuntualEvent
      const puntualEvent = puntualEventRepo.create({
        startTime: '09:00:00',
        endTime: '11:00:00',
        cancelled: false,
        comment: 'Test event',
        eventType: 'NORMAL',
        day: day1,
        groups: [group]
      });
      await puntualEventRepo.save(puntualEvent);

      // 8. Crear PeriodicEvent
      const periodicEvent = periodicEventRepo.create({
        startTime: '12:00:00',
        endTime: '14:00:00',
        year: 1,
        weekDay: 'Monday',
        eventCharacter: 'N',
        planifiedHours: 2,
        eventType: 'NORMAL',
        calendar: calendar,
        groups: [group]
      });
      await periodicEventRepo.save(periodicEvent);

      // ========== VERIFICAR: Todo está creado correctamente ==========
      const initialCalendarCount = await calendarRepo.count();
      const initialSubjectCount = await subjectRepo.count();
      const initialGroupCount = await groupRepo.count();
      const initialDayCount = await dayRepo.count();
      const initialPuntualEventCount = await puntualEventRepo.count();
      const initialPeriodicEventCount = await periodicEventRepo.count();

      expect(initialCalendarCount).toBe(1);
      expect(initialSubjectCount).toBe(1);
      expect(initialGroupCount).toBe(1);
      expect(initialDayCount).toBe(2);
      expect(initialPuntualEventCount).toBe(1);
      expect(initialPeriodicEventCount).toBe(1);

      // ========== ACT: Eliminar Calendar (simulando el controlador) ==========
      // Esto simula la lógica del controller deleteCalendar

      // Paso 1: Eliminar PeriodicEvents
      const periodicEvents = await periodicEventRepo.find({
        where: { calendar: { id: calendar.id } }
      });
      if (periodicEvents.length > 0) {
        await periodicEventRepo.remove(periodicEvents);
      }

      // Paso 2: Eliminar PuntualEvents (a través de Days)
      const days = await dayRepo.find({
        where: { calendar: { id: calendar.id } },
        relations: ['puntualEvents']
      });
      for (const day of days) {
        if (day.puntualEvents && day.puntualEvents.length > 0) {
          await puntualEventRepo.remove(day.puntualEvents);
        }
      }

      // Paso 3: Eliminar Groups
      const groups = await groupRepo.find({
        where: { calendar: { id: calendar.id } }
      });
      if (groups.length > 0) {
        await groupRepo.remove(groups);
      }

      // Paso 4: Eliminar Calendar (cascade eliminará Subject y Day automáticamente)
      await calendarRepo.remove(calendar);

      // ========== ASSERT: Verificar que todo fue eliminado ==========
      const finalCalendarCount = await calendarRepo.count();
      const finalSubjectCount = await subjectRepo.count();
      const finalGroupCount = await groupRepo.count();
      const finalDayCount = await dayRepo.count();
      const finalPuntualEventCount = await puntualEventRepo.count();
      const finalPeriodicEventCount = await periodicEventRepo.count();

      // Todas las entidades relacionadas deben haber sido eliminadas
      expect(finalCalendarCount).toBe(0);
      expect(finalSubjectCount).toBe(0);
      expect(finalGroupCount).toBe(0);
      expect(finalDayCount).toBe(0);
      expect(finalPuntualEventCount).toBe(0);
      expect(finalPeriodicEventCount).toBe(0);

      // Degree y Course NO deben ser eliminados (no tienen cascade desde Calendar)
      const finalDegreeCount = await degreeRepo.count();
      const finalCourseCount = await courseRepo.count();
      expect(finalDegreeCount).toBe(1);
      expect(finalCourseCount).toBe(1);
    });

    it('should handle deleting calendar with no events', async () => {
      // ========== ARRANGE: Crear Calendar sin eventos ==========
      const degreeRepo = dataSource.getRepository(Degree);
      const courseRepo = dataSource.getRepository(Course);
      const calendarRepo = dataSource.getRepository(Calendar);

      const degree = degreeRepo.create({
        name: 'Test Degree',
        acronym: 'TD'
      });
      await degreeRepo.save(degree);

      const course = courseRepo.create({
        startYear: 2024,
        endYear: 2025,
        state: CourseState.PLANIFICADO,
        degree: degree
      });
      await courseRepo.save(course);

      const calendar = calendarRepo.create({
        start: new Date('2024-09-01'),
        end: new Date('2025-01-31'),
        semester: 1,
        course: course
      });
      await calendarRepo.save(calendar);

      // ========== ACT: Eliminar Calendar vacío ==========
      await calendarRepo.remove(calendar);

      // ========== ASSERT: Calendar eliminado, Course y Degree permanecen ==========
      const finalCalendarCount = await calendarRepo.count();
      const finalCourseCount = await courseRepo.count();
      const finalDegreeCount = await degreeRepo.count();

      expect(finalCalendarCount).toBe(0);
      expect(finalCourseCount).toBe(1);
      expect(finalDegreeCount).toBe(1);
    });
  });
});
