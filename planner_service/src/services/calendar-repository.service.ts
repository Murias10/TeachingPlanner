import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Classroom } from '@/entities/classroom.entity';
import { Group } from '@/entities/group.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { In } from 'typeorm';

/**
 * Servicio para operaciones de repositorio de calendario
 * Centraliza acceso a base de datos para calendario y entidades relacionadas
 */
export class CalendarRepositoryService {
  /**
   * Obtiene todos los calendarios
   */
  static async getAllCalendars() {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    return await calendarRepo.find();
  }

  /**
   * Obtiene un calendario por ID
   */
  static async getCalendarById(id: string) {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    return await calendarRepo.findOne({ where: { id } });
  }

  /**
   * Obtiene todos los días del calendario con sus eventos
   */
  static async getCalendarDaysWithEvents(calendarId: string) {
    const dayRepo = AppDataSource.getRepository(Day);
    return await dayRepo.find({
      where: { calendar: { id: calendarId } },
      relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.groups.subject', 'puntualEvents.classrooms'],
      order: { date: 'ASC' }
    });
  }

  /**
   * Obtiene todos los eventos periódicos del calendario
   */
  static async getCalendarPeriodicEvents(calendarId: string) {
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    return await periodicEventRepo.find({
      where: { calendar: { id: calendarId } },
      relations: ['groups', 'groups.subject', 'classrooms']
    });
  }

  /**
   * Obtiene grupos y aulas por IDs
   * Retorna tanto grupos como aulas cargadas desde base de datos
   */
  static async fetchGroupsAndClassrooms(
    groupIds: string[] | undefined,
    classroomIds: string[] | undefined
  ) {
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    const groups = groupIds
      ? await groupRepo.find({
          where: { id: In(groupIds) },
          relations: ['subject']
        })
      : [];

    const classrooms = classroomIds
      ? await classroomRepo.find({
          where: { id: In(classroomIds) }
        })
      : [];

    return { groups, classrooms };
  }

  /**
   * Crea un nuevo calendario
   */
  static async createCalendar(calendarData: Partial<Calendar>) {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const calendar = calendarRepo.create(calendarData);
    return await calendarRepo.save(calendar);
  }

  /**
   * Actualiza un calendario
   */
  static async updateCalendar(id: string, calendarData: Partial<Calendar>) {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    await calendarRepo.update(id, calendarData);
    return await calendarRepo.findOne({ where: { id } });
  }

  /**
   * Elimina un calendario
   */
  static async deleteCalendar(id: string) {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    return await calendarRepo.delete(id);
  }
}
