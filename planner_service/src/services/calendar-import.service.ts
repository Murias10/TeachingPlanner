import { AppDataSource } from '@/config/data-source';
import { Classroom } from '@/entities/classroom.entity';
import { Course } from '@/entities/course.entity';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';

/**
 * Service for handling calendar file imports
 * Processes ubicaciones.txt, asignaturas.txt, calendario.txt, horarios.txt, excepciones.txt
 */
export class CalendarImportService {
  /**
   * Decode file content based on expected encoding
   */
  static decodeFileContent(file: Express.Multer.File): string {
    const fileName = file.originalname;
    const ansiFiles = ['excepciones.txt', 'asignaturas.txt'];
    const utf8Files = ['ubicaciones.txt', 'horarios.txt', 'calendario.txt'];

    if (ansiFiles.includes(fileName)) {
      const iconv = require('iconv-lite');
      return iconv.decode(file.buffer, 'windows-1252');
    } else if (utf8Files.includes(fileName)) {
      return file.buffer.toString('utf-8');
    } else {
      return file.buffer.toString('utf-8');
    }
  }

  /**
   * Process all imported files in the correct order
   */
  static async processImportedFiles(
    files: Express.Multer.File[],
    courseId: string,
    semester: number,
    userEmail: string | null
  ) {
    const importResult: any = {};
    const processingOrder = ['ubicaciones.txt', 'asignaturas.txt', 'calendario.txt', 'horarios.txt', 'excepciones.txt'];

    for (const fileName of processingOrder) {
      const file = files.find(f => f.originalname === fileName);
      if (!file) continue;

      const content = this.decodeFileContent(file);

      switch (fileName) {
        case 'ubicaciones.txt':
          importResult.classrooms = await this.processUbicacionesFile(content, userEmail);
          break;
        case 'asignaturas.txt':
          importResult.subjects = await this.processAsignaturasFile(content, courseId, semester, userEmail);
          break;
        case 'calendario.txt':
          importResult.calendario = await this.processCalendarioFile(content, courseId, semester, userEmail);
          break;
        case 'horarios.txt':
          importResult.events = await this.processHorariosFile(content, courseId, semester, userEmail);
          break;
        case 'excepciones.txt':
          importResult.puntualEvents = await this.processExcepcionesFile(content, courseId, semester, userEmail);
          break;
      }
    }

    return { importResult };
  }

  /**
   * Process ubicaciones.txt file
   */
  private static async processUbicacionesFile(content: string, userEmail: string | null) {
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const lines = content.split('\n');
    const processedClassrooms: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          errors.push(`Línea ${i + 1}: Formato inválido - falta ':' separador`);
          continue;
        }

        const code = line.substring(0, colonIndex).trim();
        const gisUrlRaw = line.substring(colonIndex + 1).trim();

        if (!code || !gisUrlRaw) {
          errors.push(`Línea ${i + 1}: Código de aula o URL vacíos`);
          continue;
        }

        const gisUrl = gisUrlRaw.startsWith('http') ? gisUrlRaw : `https://${gisUrlRaw}`;
        let classroom = await classroomRepo.findOne({ where: { code } });

        if (classroom) {
          if (classroom.gisUrl !== gisUrl) {
            classroom.gisUrl = gisUrl;
            classroom.updatedBy = userEmail;
            classroom.updatedAt = new Date();
            await classroomRepo.save(classroom);
            processedClassrooms.push({ code, action: 'updated', gisUrl, line: i + 1 });
          } else {
            processedClassrooms.push({ code, action: 'skipped', reason: 'already exists with same URL', line: i + 1 });
          }
        } else {
          classroom = classroomRepo.create({ code, gisUrl, createdBy: userEmail });
          await classroomRepo.save(classroom);
          processedClassrooms.push({ code, action: 'created', gisUrl, line: i + 1 });
        }
      } catch (error) {
        const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
      }
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedClassrooms.length,
      errorCount: errors.length,
      classrooms: processedClassrooms,
      errors
    };
  }

  /**
   * Process asignaturas.txt file
   */
  private static async processAsignaturasFile(content: string, courseId: string, semester: number, userEmail: string | null) {
    const subjectRepo = AppDataSource.getRepository(Subject);
    const courseRepo = AppDataSource.getRepository(Course);
    const groupRepo = AppDataSource.getRepository(Group);
    const lines = content.split('\n');
    const processedSubjects: any[] = [];
    const errors: string[] = [];

    const course = await courseRepo.findOne({ where: { id: courseId }, relations: ['degree'] });
    if (!course) {
      return {
        processed: false,
        error: `Course with ID ${courseId} not found`,
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        subjects: [],
        errors: [`Course with ID ${courseId} not found`]
      };
    }

    const degreeId = course.degree.id;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':').map(part => part.trim());
        if (parts.length !== 12) {
          errors.push(`Línea ${i + 1}: Formato inválido - debe tener exactamente 12 campos separados por ':'`);
          continue;
        }

        const [
          acronym,
          name,
          yearStr,
          groupsTeoriaES,
          groupsSeminarioES,
          groupsLaboratorioES,
          groupsTeoriaEN,
          groupsSeminarioEN,
          groupsLaboratorioEN,
          groupsTutoriaGrupalES,
          groupsTutoriaGrupalEN,
          siesCode
        ] = parts;

        if (!acronym || !name || !yearStr || !siesCode) {
          errors.push(`Línea ${i + 1}: Campos obligatorios vacíos`);
          continue;
        }

        const year = Number.parseInt(yearStr, 10);
        if (isNaN(year) || year < 0 || year > 6) {
          errors.push(`Línea ${i + 1}: Año inválido '${yearStr}'`);
          continue;
        }

        const groups = [
          { number: Number.parseInt(groupsTeoriaES, 10), type: 'T', language: 'ES' },
          { number: Number.parseInt(groupsSeminarioES, 10), type: 'S', language: 'ES' },
          { number: Number.parseInt(groupsLaboratorioES, 10), type: 'L', language: 'ES' },
          { number: Number.parseInt(groupsTeoriaEN, 10), type: 'T', language: 'EN' },
          { number: Number.parseInt(groupsSeminarioEN, 10), type: 'S', language: 'EN' },
          { number: Number.parseInt(groupsLaboratorioEN, 10), type: 'L', language: 'EN' },
          { number: Number.parseInt(groupsTutoriaGrupalES, 10), type: 'TG', language: 'ES' },
          { number: Number.parseInt(groupsTutoriaGrupalEN, 10), type: 'TG', language: 'EN' }
        ];

        let subject = await subjectRepo.findOne({ where: { acronym, degree: { id: degreeId } } });

        let isNewSubject = false;
        if (subject) {
          let hasChanges = false;
          if (subject.name !== name) subject.name = name, hasChanges = true;
          if (subject.year !== year) subject.year = year, hasChanges = true;
          if (subject.siesCode !== siesCode) subject.siesCode = siesCode, hasChanges = true;
          if (hasChanges) await subjectRepo.save(subject);
        } else {
          subject = subjectRepo.create({ acronym, name, year, degree: course.degree, semester, siesCode, createdBy: userEmail });
          await subjectRepo.save(subject);
          isNewSubject = true;
        }

        let totalGroupsCreated = 0;
        let totalGroupsSkipped = 0;

        // Crear grupos solo si el número es > 0
        // Si es 0, la asignatura es optativa y se guarda sin grupos
        for (const groupConfig of groups) {
          if (groupConfig.number === 0 || isNaN(groupConfig.number)) continue;

          for (let groupNumber = 1; groupNumber <= groupConfig.number; groupNumber++) {
            try {
              const existingGroup = await groupRepo.findOne({
                where: { subject: { id: subject.id }, number: groupNumber, type: groupConfig.type, language: groupConfig.language }
              });

              if (existingGroup) {
                totalGroupsSkipped++;
              } else {
                const group = groupRepo.create({
                  number: groupNumber,
                  type: groupConfig.type,
                  language: groupConfig.language,
                  subject: subject,
                  createdBy: userEmail
                });
                await groupRepo.save(group);
                totalGroupsCreated++;
              }
            } catch (groupError) {
              if (groupError instanceof Error && groupError.message.includes('ER_DUP_ENTRY')) {
                totalGroupsSkipped++;
              } else {
                throw groupError;
              }
            }
          }
        }

        processedSubjects.push({
          acronym,
          name,
          year,
          siesCode,
          totalGroupsCreated,
          totalGroupsSkipped,
          action: isNewSubject ? 'created' : 'updated',
          line: i + 1
        });
      } catch (error) {
        const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
      }
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedSubjects.length,
      errorCount: errors.length,
      subjects: processedSubjects,
      errors
    };
  }

  /**
   * Process calendario.txt file
   */
  private static async processCalendarioFile(content: string, courseId: string, semester: number, userEmail: string | null) {
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const courseRepo = AppDataSource.getRepository(Course);
    const lines = content.split('\n');
    const processedDays: any[] = [];
    const errors: string[] = [];
    const dates: Date[] = [];

    const course = await courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      return {
        processed: false,
        error: `Course with ID ${courseId} not found`,
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        days: [],
        errors: [`Course with ID ${courseId} not found`]
      };
    }

    // First pass: validate dates
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length < 3) continue;

        const dateStr = parts[0].trim();
        const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!dateMatch) {
          errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}'`);
          continue;
        }

        const [, day, month, year] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (isNaN(date.getTime()) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}'`);
          continue;
        }

        dates.push(date);
      } catch (error) {
        // Skip
      }
    }

    if (dates.length === 0) {
      return {
        processed: false,
        error: 'No valid dates found',
        totalLines: 0,
        processedCount: 0,
        errorCount: errors.length,
        days: [],
        errors: [...errors, 'No valid dates found']
      };
    }

    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    let calendar = await calendarRepo.findOne({ where: { course: { id: courseId }, semester } });
    let calendarAction = '';

    if (calendar) {
      let calendarUpdated = false;
      if (calendar.start.getTime() !== startDate.getTime()) {
        calendar.start = startDate;
        calendarUpdated = true;
      }
      if (calendar.end.getTime() !== endDate.getTime()) {
        calendar.end = endDate;
        calendarUpdated = true;
      }

      if (calendarUpdated) {
        calendar.updatedBy = userEmail;
        calendar.updatedAt = new Date();
        await calendarRepo.save(calendar);
        calendarAction = 'updated';
      } else {
        calendarAction = 'existing';
      }
    } else {
      calendar = calendarRepo.create({ course, semester, start: startDate, end: endDate, createdBy: userEmail });
      await calendarRepo.save(calendar);
      calendarAction = 'created';
    }

    // Second pass: process days
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length < 3) continue;

        const dateStr = parts[0].trim();
        const dayCharacter = parts[1].trim();
        const comment = parts.slice(2).join(':').trim();

        if (!dayCharacter) continue;

        const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!dateMatch) continue;

        const [, day, month, year] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (isNaN(date.getTime())) continue;

        const lective = dayCharacter.toUpperCase() !== 'F';
        const existingDay = await dayRepo.findOne({ where: { calendar: { id: calendar.id }, date } });

        if (existingDay) {
          let hasChanges = false;
          if (existingDay.lective !== lective) {
            existingDay.lective = lective;
            hasChanges = true;
          }
          if (existingDay.dayCharacter !== dayCharacter) {
            existingDay.dayCharacter = dayCharacter;
            hasChanges = true;
          }
          if (existingDay.comment !== comment) {
            existingDay.comment = comment;
            hasChanges = true;
          }

          if (hasChanges) {
            await dayRepo.save(existingDay);
            processedDays.push({ date: dateStr, action: 'updated', line: i + 1 });
          } else {
            processedDays.push({ date: dateStr, action: 'skipped', line: i + 1 });
          }
        } else {
          const dayEntity = dayRepo.create({ date, lective, dayCharacter, comment, calendar, createdBy: userEmail });
          await dayRepo.save(dayEntity);
          processedDays.push({ date: dateStr, action: 'created', line: i + 1 });
        }
      } catch (error) {
        const errorMsg = `Línea ${i + 1}: Error procesando`;
        errors.push(errorMsg);
      }
    }

    return {
      processed: true,
      calendarId: calendar.id,
      calendarAction,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedDays.length,
      errorCount: errors.length,
      days: processedDays,
      errors
    };
  }

  /**
   * Process horarios.txt file
   */
  private static async processHorariosFile(content: string, courseId: string, semester: number, userEmail: string | null) {
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents: any[] = [];
    const errors: string[] = [];

    const calendar = await calendarRepo.findOne({ where: { course: { id: courseId }, semester } });
    if (!calendar) {
      return {
        processed: false,
        error: 'Calendar not found',
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        events: [],
        errors: ['Calendar not found. Please process calendario.txt first.']
      };
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length !== 8) continue;

        const [courseYearStr, subjectGroupInfo, weekDay, startTimeStr, endTimeStr, classroomCode, eventCharacter, planifiedHoursStr] = parts.map(p => p.trim());

        const year = parseInt(courseYearStr, 10);
        if (isNaN(year) || year < 1 || year > 5) continue;

        const groupParts = subjectGroupInfo.split('.');
        if (groupParts.length !== 3) continue;

        const [subjectAcronym, groupType, groupInfo] = groupParts;
        let language: string, groupNumber: number;

        if (groupInfo.includes('-')) {
          const groupMatch = groupInfo.match(/^I-(\d+)$/);
          if (!groupMatch) continue;
          language = 'EN';
          groupNumber = parseInt(groupMatch[1], 10);
        } else {
          groupNumber = parseInt(groupInfo, 10);
          if (isNaN(groupNumber)) continue;
          language = 'ES';
        }

        const weekDayUpper = weekDay.toUpperCase();
        if (!['L', 'M', 'X', 'J', 'V'].includes(weekDayUpper)) continue;

        const normalizeTime = (time: string) => time.replace('.', ':');
        const startTime = normalizeTime(startTimeStr);
        const endTime = normalizeTime(endTimeStr);

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) continue;

        const planifiedHours = parseInt(planifiedHoursStr, 10);
        if (isNaN(planifiedHours) || planifiedHours < 0) continue;
        if (!eventCharacter) continue;

        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym } });
        if (!subject) continue;

        let group = await groupRepo.findOne({ where: { number: groupNumber, type: groupType, language, subject: { id: subject.id } }, relations: ['subject'] });
        if (!group) {
          group = groupRepo.create({ number: groupNumber, type: groupType, language, subject });
          await groupRepo.save(group);
        }

        let classroom = await classroomRepo.findOne({ where: { code: classroomCode } });
        if (!classroom) {
          classroom = classroomRepo.create({ code: classroomCode, gisUrl: '' });
          await classroomRepo.save(classroom);
        }

        const existingEvent = await periodicEventRepo
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.groups', 'group')
          .leftJoinAndSelect('event.classrooms', 'classroom')
          .where('event.calendar = :calendarId', { calendarId: calendar.id })
          .andWhere('event.year = :year', { year })
          .andWhere('event.weekDay = :weekDay', { weekDay: weekDayUpper })
          .andWhere('event.startTime = :startTime', { startTime })
          .andWhere('event.endTime = :endTime', { endTime })
          .andWhere('group.id = :groupId', { groupId: group.id })
          .andWhere('classroom.id = :classroomId', { classroomId: classroom.id })
          .getOne();

        if (existingEvent) {
          let hasChanges = false;
          if (existingEvent.eventCharacter !== eventCharacter) {
            existingEvent.eventCharacter = eventCharacter;
            hasChanges = true;
          }
          if (existingEvent.planifiedHours !== planifiedHours) {
            existingEvent.planifiedHours = planifiedHours;
            hasChanges = true;
          }
          if (hasChanges) {
            await periodicEventRepo.save(existingEvent);
            processedEvents.push({ subject: subjectAcronym, groupType, groupNumber, language, action: 'updated', line: i + 1 });
          } else {
            processedEvents.push({ subject: subjectAcronym, groupType, groupNumber, language, action: 'skipped', line: i + 1 });
          }
        } else {
          const periodicEvent = periodicEventRepo.create({
            calendar,
            year,
            weekDay: weekDayUpper,
            startTime,
            endTime,
            eventCharacter,
            planifiedHours,
            groups: [group],
            classrooms: [classroom],
            createdBy: userEmail
          });
          await periodicEventRepo.save(periodicEvent);
          processedEvents.push({ subject: subjectAcronym, groupType, groupNumber, language, action: 'created', line: i + 1 });
        }
      } catch (error) {
        // Continue on error
      }
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      events: processedEvents,
      errors
    };
  }

  /**
   * Process excepciones.txt file
   */
  private static async processExcepcionesFile(content: string, courseId: string, semester: number, userEmail: string | null) {
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents: any[] = [];
    const errors: string[] = [];

    const calendar = await calendarRepo.findOne({ where: { course: { id: courseId }, semester } });
    if (!calendar) {
      return {
        processed: false,
        error: 'Calendar not found',
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        events: [],
        errors: ['Calendar not found']
      };
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length !== 6) continue;

        const [dateStr, subjectGroupInfo, startTimeStr, endTimeStr, classroomCode, comment] = parts.map(p => p.trim());
        const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!dateMatch) continue;

        const [, day, month, year] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) continue;

        const groupParts = subjectGroupInfo.split('.');
        if (groupParts.length !== 3) continue;

        const [subjectAcronym, groupType, groupInfo] = groupParts;
        let language: string, groupNumber: number;

        if (groupInfo.includes('-')) {
          const groupMatch = groupInfo.match(/^I-(\d+)$/);
          if (!groupMatch) continue;
          language = 'EN';
          groupNumber = parseInt(groupMatch[1], 10);
        } else {
          groupNumber = parseInt(groupInfo, 10);
          if (isNaN(groupNumber)) continue;
          language = 'ES';
        }

        const cancelled = startTimeStr === '-1';
        let startTime: string, endTime: string;

        if (cancelled) {
          const normalizeTime = (time: string) => time.replace('.', ':');
          startTime = normalizeTime(endTimeStr);
          endTime = '00:00';
        } else {
          const normalizeTime = (time: string) => time.replace('.', ':');
          startTime = normalizeTime(startTimeStr);
          endTime = normalizeTime(endTimeStr);
        }

        const dayEntity = await dayRepo.findOne({ where: { calendar: { id: calendar.id }, date } });
        if (!dayEntity) continue;

        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym } });
        if (!subject) continue;

        let group = await groupRepo.findOne({ where: { number: groupNumber, type: groupType, language, subject: { id: subject.id } }, relations: ['subject'] });
        if (!group) {
          group = groupRepo.create({ number: groupNumber, type: groupType, language, subject });
          await groupRepo.save(group);
        }

        let classroom = await classroomRepo.findOne({ where: { code: classroomCode } });
        if (!classroom) {
          classroom = classroomRepo.create({ code: classroomCode, gisUrl: '' });
          await classroomRepo.save(classroom);
        }

        const existingEvent = await puntualEventRepo
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.groups', 'group')
          .leftJoinAndSelect('event.classrooms', 'classroom')
          .where('event.day = :dayId', { dayId: dayEntity.id })
          .andWhere('event.startTime = :startTime', { startTime })
          .andWhere('event.endTime = :endTime', { endTime })
          .andWhere('group.id = :groupId', { groupId: group.id })
          .andWhere('classroom.id = :classroomId', { classroomId: classroom.id })
          .getOne();

        if (existingEvent) {
          let hasChanges = false;
          if (existingEvent.cancelled !== cancelled) {
            existingEvent.cancelled = cancelled;
            hasChanges = true;
          }
          if (existingEvent.comment !== comment) {
            existingEvent.comment = comment;
            hasChanges = true;
          }
          if (hasChanges) {
            await puntualEventRepo.save(existingEvent);
            processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'updated', line: i + 1 });
          } else {
            processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'skipped', line: i + 1 });
          }
        } else {
          const puntualEvent = puntualEventRepo.create({ day: dayEntity, startTime, endTime, cancelled, comment, groups: [group], classrooms: [classroom], createdBy: userEmail });
          await puntualEventRepo.save(puntualEvent);
          processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'created', line: i + 1 });
        }
      } catch (error) {
        // Continue on error
      }
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      events: processedEvents,
      errors
    };
  }
}
