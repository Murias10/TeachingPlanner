import { validate as isValidUUID } from 'uuid';
import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Course } from '@/entities/course.entity';

export class ValidationService {
  /**
   * Valida si una cadena es un UUID válido
   */
  static validateUUID(id: string): boolean {
    return isValidUUID(id);
  }

  /**
   * Valida si un curso existe en la base de datos
   */
  static async validateCourseExists(courseId: string): Promise<boolean> {
    const courseRepo = AppDataSource.getRepository(Course);
    const course = await courseRepo.findOne({ where: { id: courseId } });
    return !!course;
  }

  /**
   * Valida si un calendario existe en la base de datos
   */
  static async validateCalendarExists(calendarId: string): Promise<boolean> {
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const calendar = await calendarRepo.findOne({ where: { id: calendarId } });
    return !!calendar;
  }
}
