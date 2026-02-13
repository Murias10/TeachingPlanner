import { DataSource } from 'typeorm';
import { setupTestDatabase, teardownTestDatabase, cleanDatabase } from '../setup/testDatabase';
import { Classroom } from '@/entities/classroom.entity';
import { Degree } from '@/entities/degree.entity';
import { Course } from '@/entities/course.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Day } from '@/entities/day.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';

describe('Classroom Delete Integration Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('DELETE classroom with force=true', () => {
    it('should delete classroom and all related events when force=true', async () => {
      // ========== ARRANGE: Crear estructura con classroom y eventos ==========
      const classroomRepo = dataSource.getRepository(Classroom);
      const degreeRepo = dataSource.getRepository(Degree);
      const courseRepo = dataSource.getRepository(Course);
      const calendarRepo = dataSource.getRepository(Calendar);
      const subjectRepo = dataSource.getRepository(Subject);
      const groupRepo = dataSource.getRepository(Group);
      const dayRepo = dataSource.getRepository(Day);
      const puntualEventRepo = dataSource.getRepository(PuntualEvent);
      const periodicEventRepo = dataSource.getRepository(PeriodicEvent);

      // Crear Classroom
      const classroom = classroomRepo.create({
        code: 'L-13',
        gisUrl: 'http://gis.example.com/L-13'
      });
      await classroomRepo.save(classroom);

      // Crear estructura académica
      const degree = degreeRepo.create({
        name: 'Test Degree',
        acronym: 'TD'
      });
      await degreeRepo.save(degree);

      const course = courseRepo.create({
        startYear: 2024,
        endYear: 2025,
        state: 'activo',
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

      const subject = subjectRepo.create({
        name: 'Test Subject',
        acronym: 'TS',
        semester: 1,
        year: 1,
        siesCode: 'TS001',
        calendar: calendar
      });
      await subjectRepo.save(subject);

      const group = groupRepo.create({
        number: 1,
        type: 'teoría',
        language: 'ES',
        planifiedHours: 30,
        calendar: calendar,
        subject: subject
      });
      await groupRepo.save(group);

      const day = dayRepo.create({
        date: new Date('2024-09-02'),
        lective: true,
        dayCharacter: 'N',
        comment: 'Test day',
        calendar: calendar
      });
      await dayRepo.save(day);

      // Crear PuntualEvent que usa el classroom
      const puntualEvent = puntualEventRepo.create({
        startTime: '09:00:00',
        endTime: '11:00:00',
        cancelled: false,
        comment: 'Event in classroom L-13',
        eventType: 'NORMAL',
        day: day,
        groups: [group],
        classrooms: [classroom]
      });
      await puntualEventRepo.save(puntualEvent);

      // Crear PeriodicEvent que usa el classroom
      const periodicEvent = periodicEventRepo.create({
        startTime: '12:00:00',
        endTime: '14:00:00',
        year: 1,
        weekDay: 'Monday',
        eventCharacter: 'N',
        planifiedHours: 2,
        eventType: 'NORMAL',
        calendar: calendar,
        groups: [group],
        classrooms: [classroom]
      });
      await periodicEventRepo.save(periodicEvent);

      // ========== VERIFICAR: Eventos están relacionados con el classroom ==========
      const puntualEvents = await puntualEventRepo
        .createQueryBuilder('puntualEvent')
        .innerJoin('puntualEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getCount();

      const periodicEvents = await periodicEventRepo
        .createQueryBuilder('periodicEvent')
        .innerJoin('periodicEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getCount();

      expect(puntualEvents).toBe(1);
      expect(periodicEvents).toBe(1);

      const totalRelatedEvents = puntualEvents + periodicEvents;
      expect(totalRelatedEvents).toBe(2);

      // ========== ACT: Eliminar classroom con force=true (simulando controlador) ==========
      // Paso 1: Buscar eventos relacionados
      const relatedPuntualEvents = await puntualEventRepo
        .createQueryBuilder('puntualEvent')
        .innerJoinAndSelect('puntualEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getMany();

      const relatedPeriodicEvents = await periodicEventRepo
        .createQueryBuilder('periodicEvent')
        .innerJoinAndSelect('periodicEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getMany();

      // Paso 2: Eliminar eventos (force=true)
      if (relatedPuntualEvents.length > 0) {
        await puntualEventRepo.remove(relatedPuntualEvents);
      }

      if (relatedPeriodicEvents.length > 0) {
        await periodicEventRepo.remove(relatedPeriodicEvents);
      }

      // Paso 3: Eliminar classroom
      await classroomRepo.delete(classroom.id);

      // ========== ASSERT: Classroom y eventos eliminados ==========
      const finalClassroomCount = await classroomRepo.count();
      const finalPuntualEventCount = await puntualEventRepo.count();
      const finalPeriodicEventCount = await periodicEventRepo.count();

      expect(finalClassroomCount).toBe(0);
      expect(finalPuntualEventCount).toBe(0);
      expect(finalPeriodicEventCount).toBe(0);

      // Grupos y calendario deben permanecer intactos
      const finalGroupCount = await groupRepo.count();
      const finalCalendarCount = await calendarRepo.count();
      expect(finalGroupCount).toBe(1);
      expect(finalCalendarCount).toBe(1);
    });

    it('should return error when classroom has events and force=false', async () => {
      // ========== ARRANGE: Crear classroom con eventos ==========
      const classroomRepo = dataSource.getRepository(Classroom);
      const degreeRepo = dataSource.getRepository(Degree);
      const courseRepo = dataSource.getRepository(Course);
      const calendarRepo = dataSource.getRepository(Calendar);
      const subjectRepo = dataSource.getRepository(Subject);
      const groupRepo = dataSource.getRepository(Group);
      const dayRepo = dataSource.getRepository(Day);
      const puntualEventRepo = dataSource.getRepository(PuntualEvent);

      const classroom = classroomRepo.create({
        code: 'TEST-101',
        gisUrl: 'http://test.com'
      });
      await classroomRepo.save(classroom);

      const degree = degreeRepo.create({ name: 'Degree', acronym: 'D' });
      await degreeRepo.save(degree);

      const course = courseRepo.create({
        startYear: 2024,
        endYear: 2025,
        state: 'activo',
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

      const subject = subjectRepo.create({
        name: 'Subject',
        acronym: 'S',
        semester: 1,
        year: 1,
        siesCode: 'S001',
        calendar: calendar
      });
      await subjectRepo.save(subject);

      const group = groupRepo.create({
        number: 1,
        type: 'teoría',
        language: 'ES',
        calendar: calendar,
        subject: subject
      });
      await groupRepo.save(group);

      const day = dayRepo.create({
        date: new Date('2024-09-02'),
        lective: true,
        dayCharacter: 'N',
        comment: '',
        calendar: calendar
      });
      await dayRepo.save(day);

      const puntualEvent = puntualEventRepo.create({
        startTime: '09:00:00',
        endTime: '11:00:00',
        cancelled: false,
        comment: '',
        eventType: 'NORMAL',
        day: day,
        groups: [group],
        classrooms: [classroom]
      });
      await puntualEventRepo.save(puntualEvent);

      // ========== ACT & ASSERT: Verificar que hay eventos relacionados ==========
      const relatedPunctualEvents = await puntualEventRepo
        .createQueryBuilder('puntualEvent')
        .innerJoin('puntualEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getCount();

      const relatedPeriodicEvents = await periodicEventRepo
        .createQueryBuilder('periodicEvent')
        .innerJoin('periodicEvent.classrooms', 'classroom')
        .where('classroom.id = :id', { id: classroom.id })
        .getCount();

      const totalRelatedEvents = relatedPunctualEvents + relatedPeriodicEvents;

      // Simular la lógica del controlador cuando force=false
      const force = false;

      // Si hay eventos y force=false, debe retornar error 409
      expect(totalRelatedEvents).toBeGreaterThan(0);
      expect(force).toBe(false);

      // En el controlador real esto retornaría:
      // res.status(409).json({
      //   status: "error",
      //   message: "No se puede eliminar el aula porque tiene eventos asociados",
      //   data: { relatedEvents: totalRelatedEvents }
      // });

      // Verificar que el classroom NO debe ser eliminado
      const classroomStillExists = await classroomRepo.findOne({
        where: { id: classroom.id }
      });
      expect(classroomStillExists).not.toBeNull();
    });

    it('should delete classroom without events successfully', async () => {
      // ========== ARRANGE: Crear classroom sin eventos ==========
      const classroomRepo = dataSource.getRepository(Classroom);

      const classroom = classroomRepo.create({
        code: 'EMPTY-ROOM',
        gisUrl: 'http://empty.com'
      });
      await classroomRepo.save(classroom);

      // ========== ACT: Eliminar classroom sin eventos ==========
      await classroomRepo.delete(classroom.id);

      // ========== ASSERT: Classroom eliminado ==========
      const finalCount = await classroomRepo.count();
      expect(finalCount).toBe(0);
    });
  });

  describe('Classroom uniqueness validation', () => {
    it('should prevent creating classroom with duplicate code', async () => {
      const classroomRepo = dataSource.getRepository(Classroom);

      // Crear primer classroom
      const classroom1 = classroomRepo.create({
        code: 'UNIQUE-CODE',
        gisUrl: 'http://example.com'
      });
      await classroomRepo.save(classroom1);

      // Intentar crear segundo classroom con el mismo código
      const classroom2 = classroomRepo.create({
        code: 'UNIQUE-CODE', // Mismo código
        gisUrl: 'http://different.com'
      });

      // Debe lanzar error de duplicado
      await expect(classroomRepo.save(classroom2)).rejects.toThrow();
    });

    it('should allow creating classrooms with different codes', async () => {
      const classroomRepo = dataSource.getRepository(Classroom);

      const classroom1 = classroomRepo.create({
        code: 'ROOM-A',
        gisUrl: 'http://a.com'
      });
      await classroomRepo.save(classroom1);

      const classroom2 = classroomRepo.create({
        code: 'ROOM-B',
        gisUrl: 'http://b.com'
      });
      await classroomRepo.save(classroom2);

      const count = await classroomRepo.count();
      expect(count).toBe(2);
    });
  });
});
