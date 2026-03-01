import { AppDataSource } from '@/config/data-source';
import { Classroom } from '@/entities/classroom.entity';
import { Course } from '@/entities/course.entity';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { EVENT_CHARACTERS, findAvailableCharacter } from '@/constants/event-characters.constants';
import { esSemanaPar, calcularNumeroSemanaDesdeInicio } from '@/utils/calendar-week.utils';

/**
 * Result of P/I validation and normalization process
 */
interface PINormalizationResult {
  performed: boolean;
  eventsUsePI: boolean; // Whether horarios.txt/excepciones.txt use P or I
  iValid: boolean; // Whether I follows correct pattern (all odd weeks)
  pValid: boolean; // Whether P follows correct pattern (all even weeks)
  substitutions: Array<{
    oldCharacter: string;
    newCharacter: string;
    daysUpdated: number;
    periodicEventsUpdated: number;
    puntualEventsUpdated: number;
  }>;
  piAdded: boolean; // Whether P/I were added to days at the end
  summary: string;
}

/**
 * Service for handling calendar file imports
 * Processes ubicaciones.txt, asignaturas.txt, calendario.txt, horarios.txt, excepciones.txt
 */
export class CalendarImportService {
  /**
   * Format group key for display
   * Spanish: "AMD.S.1" (without language suffix)
   * English: "AMD.S.I-1" (with "I-" prefix before number)
   */
  private static formatGroupKey(subjectAcronym: string, groupType: string, groupNumber: number, language: string): string {
    if (language === 'EN') {
      return `${subjectAcronym}.${groupType}.I-${groupNumber}`;
    } else {
      return `${subjectAcronym}.${groupType}.${groupNumber}`;
    }
  }

  /**
   * Decode file content as UTF-8
   */
  static decodeFileContent(file: Express.Multer.File): string {
    return file.buffer.toString('utf-8');
  }

  /**
   * Process all imported files in the correct order
   * excepciones.txt is optional - will be skipped if not provided
   */
  static async processImportedFiles(
    files: Express.Multer.File[],
    courseId: string,
    semester: number,
    userEmail: string | null
  ) {
    const importResult: any = {};
    // IMPORTANT: calendario.txt must be processed BEFORE asignaturas.txt
    // because subjects now belong to calendars, not degrees
    const processingOrder = ['ubicaciones.txt', 'calendario.txt', 'asignaturas.txt', 'horarios.txt', 'excepciones.txt'];

    // Store group limits from asignaturas.txt to validate in horarios.txt and excepciones.txt
    let groupLimits: Map<string, number> | undefined;
    // Store calendarId from calendario.txt to use when creating subjects and groups
    let calendarId: string | undefined;

    for (const fileName of processingOrder) {
      const file = files.find(f => f.originalname === fileName);
      // excepciones.txt is optional, skip if not provided
      if (!file && fileName === 'excepciones.txt') {
        console.log('[Import] excepciones.txt not provided - skipping puntual events import');
        continue;
      }
      if (!file) continue;

      const content = this.decodeFileContent(file);

      switch (fileName) {
        case 'ubicaciones.txt':
          importResult.classrooms = await this.processUbicacionesFile(content, userEmail);
          break;
        case 'calendario.txt':
          importResult.calendario = await this.processCalendarioFile(content, courseId, semester, userEmail);
          // Extract calendarId for use in asignaturas.txt, horarios.txt, and excepciones.txt
          calendarId = importResult.calendario.calendarId;
          break;
        case 'asignaturas.txt':
          const subjectsResult = await this.processAsignaturasFile(content, courseId, semester, userEmail, calendarId);
          importResult.subjects = subjectsResult;
          // Extract group limits for validation
          groupLimits = subjectsResult.groupLimits;
          break;
        case 'horarios.txt':
          importResult.events = await this.processHorariosFile(content, courseId, semester, userEmail, groupLimits);
          break;
        case 'excepciones.txt':
          importResult.puntualEvents = await this.processExcepcionesFile(content, courseId, semester, userEmail, groupLimits);
          break;
      }
    }

    // After processing all files, validate and normalize P/I characters
    if (calendarId) {
      console.log('[Import] All files processed - starting P/I validation and normalization');
      const calendarRepo = AppDataSource.getRepository(Calendar);
      const calendar = await calendarRepo.findOne({ where: { id: calendarId } });

      if (calendar) {
        const piNormalization = await this.validateAndNormalizePICharacters(calendar, calendarId);
        importResult.piNormalization = piNormalization;
        console.log('[Import] P/I normalization complete:', piNormalization.summary);
      }
    }

    // Build new validation structures for frontend dialog
    // Only build if we have calendario data (indicates complete import)
    if (importResult.calendario?.calendarId) {
      console.log('[Import] Building validation structures for frontend dialog');

      // Build ubicaciones validation result
      if (importResult.classrooms) {
        const classroomsCreated = importResult.classrooms.classrooms?.filter((c: any) => c.action === 'created') || [];
        const classroomsUpdated = importResult.classrooms.classrooms?.filter((c: any) => c.action === 'updated') || [];

        importResult.ubicaciones = {
          processed: importResult.classrooms.processed,
          classroomsCreated: classroomsCreated.map((c: any) => ({
            code: c.code,
            name: '', // Not available in old structure
            building: '' // Not available in old structure
          })),
          classroomsUpdated: classroomsUpdated.map((c: any) => ({
            code: c.code,
            name: '', // Not available in old structure
            building: '' // Not available in old structure
          }))
        };
      }

      // Build calendario validation result
      if (importResult.calendario) {
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const calendarFinal = await calendarRepo.findOne({ where: { id: calendarId } });

        importResult.calendario = {
          ...importResult.calendario,
          calendarCreated: importResult.calendario.calendarAction === 'created',
          totalDays: importResult.calendario.totalDays || 0,
          lectiveDays: importResult.calendario.lectiveDays || 0,
          charactersInUse: calendarFinal?.charactersInUse || '',
          daysIgnoredOutOfRange: importResult.calendario.daysIgnoredOutOfRange,
          daysAutoFilled: importResult.calendario.daysAutoFilled,
          ignoredDates: importResult.calendario.ignoredDates,
          autoFilledDates: importResult.calendario.autoFilledDates
        };
      }

      // Build asignaturas validation result
      if (importResult.subjects) {
        importResult.asignaturas = {
          subjectsCreated: importResult.subjects.subjects?.map((s: any) => ({
            acronym: s.acronym,
            name: s.name,
            totalGroups: s.totalGroups || 0
          })) || [],
          errors: importResult.subjects.errors?.map((e: string, idx: number) => ({
            row: idx + 1,
            acronym: '',
            error: {
              field: 'subject',
              message: e
            }
          })) || []
        };
      }

      // Build horarios validation result
      if (importResult.events) {
        const groupValidation = importResult.events.groupValidation || {};
        const groupsNotFound = groupValidation.groupsNotFound || [];
        const groupsAutoCreated = groupValidation.groupsAutoCreated || [];
        const statistics = groupValidation.statistics || {};

        // Classify errors by type (subject, classroom, group exceeds max)
        const subjectErrors: any[] = [];
        const classroomErrors: any[] = [];
        const groupErrors: any[] = [];

        groupsNotFound.forEach((error: any) => {
          if (error.error?.field === 'subject') {
            subjectErrors.push(error);
          } else if (error.error?.field === 'classroom') {
            classroomErrors.push(error);
          } else if (error.error?.field === 'group') {
            groupErrors.push(error);
          }
        });

        importResult.horarios = {
          eventsCreated: statistics.eventsCreated || 0,
          eventsSkipped: statistics.eventsSkipped || 0,
          groupsAutoCreated: groupsAutoCreated.map((g: any) => ({
            row: g.row,
            groupKey: g.groupKey,
            warning: {
              field: g.warning.field,
              message: g.warning.message
            }
          })),
          subjectErrors: subjectErrors.map((e: any) => ({
            row: e.row,
            groupKey: e.groupKey,
            error: {
              field: e.error.field,
              message: e.error.message
            }
          })),
          classroomErrors: classroomErrors.map((e: any) => ({
            row: e.row,
            groupKey: e.groupKey,
            error: {
              field: e.error.field,
              message: e.error.message
            }
          })),
          groupErrors: groupErrors.map((e: any) => ({
            row: e.row,
            groupKey: e.groupKey,
            maxAllowed: e.maxAllowed,
            error: {
              field: e.error.field,
              message: e.error.message
            }
          }))
        };
      }

      // Build excepciones validation result from actual import data
      if (importResult.puntualEvents) {
        const groupValidation = importResult.puntualEvents.groupValidation || {};
        const groupsNotFound = groupValidation.groupsNotFound || [];
        const groupsAutoCreated = groupValidation.groupsAutoCreated || [];
        const statistics = groupValidation.statistics || {};

        // Classify errors by type (subject, date, group, classroom)
        const subjectErrors: any[] = [];
        const dateErrors: any[] = [];
        const groupErrors: any[] = [];
        const classroomErrors: any[] = [];

        for (const item of groupsNotFound) {
          const errorType = item.error?.field || 'unknown';
          const errorData = {
            row: item.row,
            groupKey: item.groupKey,
            error: item.error
          };

          if (errorType === 'subject') {
            subjectErrors.push(errorData);
          } else if (errorType === 'date') {
            dateErrors.push({ ...errorData, date: item.date || '' });
          } else if (errorType === 'group') {
            groupErrors.push({ ...errorData, maxAllowed: item.maxAllowed || 0 });
          } else if (errorType === 'classroom') {
            classroomErrors.push(errorData);
          }
        }

        importResult.excepciones = {
          eventsCreated: statistics.eventsCreated || 0,
          eventsSkipped: statistics.eventsSkipped || 0,
          groupsAutoCreated: groupsAutoCreated.map((g: any) => ({
            row: g.row,
            groupKey: g.groupKey,
            warning: {
              message: g.warning?.message || `Grupo ${g.groupKey} creado automáticamente`
            }
          })),
          subjectErrors,
          dateErrors,
          groupErrors,
          classroomErrors
        };
      }

      // Update totalGroups count for subjects after all imports are complete
      // This ensures we get the actual group count after horarios.txt has been processed
      if (importResult.asignaturas?.subjectsCreated && calendarId) {
        const subjectRepo = AppDataSource.getRepository(Subject);
        const groupRepo = AppDataSource.getRepository(Group);

        for (const subjectData of importResult.asignaturas.subjectsCreated) {
          const subject = await subjectRepo.findOne({
            where: {
              acronym: subjectData.acronym,
              calendar: { id: calendarId }
            }
          });

          if (subject) {
            const groupCount = await groupRepo.count({
              where: {
                subject: { id: subject.id }
              }
            });
            subjectData.totalGroups = groupCount;
          }
        }
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
  private static async processAsignaturasFile(content: string, courseId: string, semester: number, userEmail: string | null, calendarId?: string) {
    const subjectRepo = AppDataSource.getRepository(Subject);
    const courseRepo = AppDataSource.getRepository(Course);
    const groupRepo = AppDataSource.getRepository(Group);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedSubjects: any[] = [];
    const errors: string[] = [];

    // Map to store group limits: key = "subjectAcronym.groupType.language", value = max number
    const groupLimits = new Map<string, number>();

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

    // Load calendar - calendar must exist for subjects to be created
    if (!calendarId) {
      return {
        processed: false,
        error: 'Calendar ID is required for subject creation',
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        subjects: [],
        errors: ['Calendar ID is required. Please process calendario.txt first.']
      };
    }

    const calendar = await calendarRepo.findOne({ where: { id: calendarId } });
    if (!calendar) {
      return {
        processed: false,
        error: `Calendar with ID ${calendarId} not found`,
        totalLines: 0,
        processedCount: 0,
        errorCount: 1,
        subjects: [],
        errors: [`Calendar with ID ${calendarId} not found. Please process calendario.txt first.`]
      };
    }

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
          { number: Number.parseInt(groupsTeoriaES, 10), type: 'T', language: 'ES', raw: groupsTeoriaES },
          { number: Number.parseInt(groupsSeminarioES, 10), type: 'S', language: 'ES', raw: groupsSeminarioES },
          { number: Number.parseInt(groupsLaboratorioES, 10), type: 'L', language: 'ES', raw: groupsLaboratorioES },
          { number: Number.parseInt(groupsTeoriaEN, 10), type: 'T', language: 'EN', raw: groupsTeoriaEN },
          { number: Number.parseInt(groupsSeminarioEN, 10), type: 'S', language: 'EN', raw: groupsSeminarioEN },
          { number: Number.parseInt(groupsLaboratorioEN, 10), type: 'L', language: 'EN', raw: groupsLaboratorioEN },
          { number: Number.parseInt(groupsTutoriaGrupalES, 10), type: 'TG', language: 'ES', raw: groupsTutoriaGrupalES },
          { number: Number.parseInt(groupsTutoriaGrupalEN, 10), type: 'TG', language: 'EN', raw: groupsTutoriaGrupalEN }
        ];

        // Validate: no negative group numbers
        let hasNegativeGroups = false;
        for (const groupConfig of groups) {
          if (groupConfig.number < 0) {
            errors.push(`Línea ${i + 1}: Número de grupos negativo (${groupConfig.raw}) para ${groupConfig.type}.${groupConfig.language}`);
            hasNegativeGroups = true;
          }
        }

        // If validation failed, skip to next line
        if (hasNegativeGroups) {
          continue;
        }

        // Store group limits for validation in horarios.txt and excepciones.txt
        for (const groupConfig of groups) {
          const limitKey = `${acronym}.${groupConfig.type}.${groupConfig.language}`;
          groupLimits.set(limitKey, groupConfig.number);
          console.log(`[GROUP LIMITS] Set limit for ${limitKey}: ${groupConfig.number}`);
        }

        let subject = await subjectRepo.findOne({ where: { acronym, calendar: { id: calendar.id } } });

        let isNewSubject = false;
        if (subject) {
          let hasChanges = false;
          if (subject.name !== name) subject.name = name, hasChanges = true;
          if (subject.year !== year) subject.year = year, hasChanges = true;
          if (subject.siesCode !== siesCode) subject.siesCode = siesCode, hasChanges = true;
          if (hasChanges) await subjectRepo.save(subject);
        } else {
          subject = subjectRepo.create({ acronym, name, year, calendar, semester, siesCode, createdBy: userEmail });
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
                where: {
                  subject: { id: subject.id },
                  number: groupNumber,
                  type: groupConfig.type,
                  language: groupConfig.language,
                  calendar: { id: calendar.id }
                }
              });

              if (existingGroup) {
                totalGroupsSkipped++;
              } else {
                const group = groupRepo.create({
                  number: groupNumber,
                  type: groupConfig.type,
                  language: groupConfig.language,
                  subject: subject,
                  calendar: calendar,
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

    console.log(`[GROUP LIMITS] Total limits stored: ${groupLimits.size}`);

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedSubjects.length,
      errorCount: errors.length,
      subjects: processedSubjects,
      errors,
      groupLimits  // Include group limits for validation
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
    const ignoredDates: { date: string; line: number; reason: string }[] = [];
    const autoFilledDates: string[] = [];

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

    // Define valid date range for the course: from 31/08/startYear to 31/08/endYear
    const minDate = new Date(course.startYear, 7, 31); // 31 de agosto del año inicial (month 7 = agosto)
    const maxDate = new Date(course.endYear, 7, 31);   // 31 de agosto del año final

    console.log(`[Calendar Import] Valid date range for course ${course.startYear}-${course.endYear}: ${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`);

    // First pass: validate dates
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length < 3) continue;

        const dateStr = parts[0].trim();
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const dateMatch = dateRegex.exec(dateStr);
        if (!dateMatch) {
          errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}'`);
          continue;
        }

        const [, day, month, year] = dateMatch;
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));

        if (Number.isNaN(date.getTime()) || date.getDate() !== Number.parseInt(day) || date.getMonth() !== Number.parseInt(month) - 1) {
          errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}'`);
          continue;
        }

        // Validate that date is within course date range
        if (date < minDate || date > maxDate) {
          const minDateStr = `31/08/${course.startYear}`;
          const maxDateStr = `31/08/${course.endYear}`;
          const errorMsg = `Fecha '${dateStr}' está fuera del rango del curso (${minDateStr} - ${maxDateStr})`;
          errors.push(`Línea ${i + 1}: ${errorMsg}`);
          ignoredDates.push({ date: dateStr, line: i + 1, reason: errorMsg });
          continue;
        }

        dates.push(date);
      } catch (error) {
        const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
        errors.push(errorMsg);
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
        const dayCharacter = parts[1].trim(); // Can be empty - will be filled by P/I normalization later
        const comment = parts.slice(2).join(':').trim();

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const dateMatch = dateRegex.exec(dateStr);
        if (!dateMatch) continue;

        const [, day, month, year] = dateMatch;
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));

        if (Number.isNaN(date.getTime())) continue;

        // Skip dates outside the course range (already tracked in ignoredDates from first pass)
        if (date < minDate || date > maxDate) continue;

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

    // Third pass: auto-fill missing days between startDate and endDate
    console.log(`[Calendar Import] Auto-filling missing days between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`);
    await this.autoFillMissingDays(calendar, startDate, endDate, dayRepo, userEmail, autoFilledDates);
    console.log(`[Calendar Import] Auto-filled ${autoFilledDates.length} missing days`);

    // Update CHARACTERS_IN_USE after all days have been processed
    // Get all dayCharacter values (which can be multi-character strings)
    const dayCharacters = await dayRepo
      .createQueryBuilder('day')
      .select('day.dayCharacter', 'character')
      .where('day.calendar = :calendarId', { calendarId: calendar.id })
      .andWhere('day.dayCharacter IS NOT NULL')
      .andWhere('day.dayCharacter != :empty', { empty: '' })
      .getRawMany();

    // Extract individual characters from all dayCharacter strings and remove duplicates
    const allCharactersSet = new Set<string>();
    dayCharacters.forEach(row => {
      const charString = row.character as string;
      // Split the string into individual characters
      for (const char of charString) {
        allCharactersSet.add(char);
      }
    });

    // Sort characters alphabetically (case-sensitive: uppercase first, then lowercase)
    const charactersInUse = Array.from(allCharactersSet).sort((a, b) => a.localeCompare(b)).join('');
    calendar.charactersInUse = charactersInUse;
    await calendarRepo.save(calendar);

    console.log(`[CALENDARIO] Characters in use updated: "${charactersInUse}"`);

    // Calculate final totalDays and lectiveDays from the database (after auto-fill)
    const totalDaysCount = await dayRepo.count({
      where: { calendar: { id: calendar.id } }
    });
    const lectiveDaysCount = await dayRepo.count({
      where: { calendar: { id: calendar.id }, lective: true }
    });

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
      errors,
      totalDays: totalDaysCount,
      lectiveDays: lectiveDaysCount,
      daysIgnoredOutOfRange: ignoredDates.length,
      daysAutoFilled: autoFilledDates.length,
      ignoredDates: ignoredDates.map(d => d.date),
      autoFilledDates
    };
  }

  /**
   * Auto-fills missing days between startDate and endDate in the calendar
   * Missing days are created with appropriate lective status and dayCharacter based on day of week
   * @param calendar - Calendar entity
   * @param startDate - First date in the range
   * @param endDate - Last date in the range
   * @param dayRepo - Day repository
   * @param userEmail - Email of user performing the import
   * @param autoFilledDates - Output array to track auto-filled dates
   */
  private static async autoFillMissingDays(
    calendar: Calendar,
    startDate: Date,
    endDate: Date,
    dayRepo: any,
    userEmail: string | null,
    autoFilledDates: string[]
  ): Promise<void> {
    // Get all existing days for this calendar to check for gaps
    const existingDays = await dayRepo.find({
      where: { calendar: { id: calendar.id } },
      select: ['date']
    });

    // Create a Set of existing dates for fast lookup (normalized to midnight)
    const existingDatesSet = new Set<string>();
    existingDays.forEach((day: any) => {
      const dateStr = new Date(day.date).toISOString().split('T')[0]; // YYYY-MM-DD format
      existingDatesSet.add(dateStr);
    });

    // Iterate through all dates between startDate and endDate
    const currentDate = new Date(startDate);
    const endDateTime = endDate.getTime();

    while (currentDate.getTime() <= endDateTime) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if this date already exists
      if (!existingDatesSet.has(dateStr)) {
        // Day is missing, auto-fill it
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Saturday or Sunday

        let lective: boolean;
        let dayCharacter: string;

        if (isWeekend) {
          // Weekend: non-lective, festive character
          lective = false;
          dayCharacter = 'F';
        } else {
          // Weekday: lective, P or I based on week parity
          lective = true;
          const isPar = esSemanaPar(currentDate, calendar.start);
          dayCharacter = isPar ? 'P' : 'I';
        }

        const comment = 'Día autogenerado al usar la importación completa de los .txt';

        // Create the missing day
        const dayEntity = dayRepo.create({
          date: new Date(currentDate),
          lective,
          dayCharacter,
          comment,
          calendar,
          createdBy: userEmail
        });

        await dayRepo.save(dayEntity);

        // Track the auto-filled date
        const displayDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
        autoFilledDates.push(displayDate);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Validates and normalizes P/I characters in calendar days and events
   * Implements strict validation: P must be in ALL lective days of even weeks, I in ALL lective days of odd weeks
   * @param calendar - Calendar entity
   * @param calendarId - Calendar ID for queries
   * @returns PINormalizationResult with validation and substitution details
   */
  private static async validateAndNormalizePICharacters(
    calendar: Calendar,
    calendarId: string
  ): Promise<PINormalizationResult> {
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);

    console.log('[P/I Normalization] Starting validation and normalization process');

    // Get all days from calendar
    const allDays = await dayRepo.find({
      where: { calendar: { id: calendarId } },
      order: { date: 'ASC' }
    });

    // STEP 1: Check if any periodic events use P or I
    // Note: Puntual events don't have eventCharacter field, they occur on specific dates
    const periodicEventsWithPI = await periodicEventRepo
      .createQueryBuilder('event')
      .where('event.calendar = :calendarId', { calendarId })
      .andWhere('(event.eventCharacter LIKE :p OR event.eventCharacter LIKE :i)', {
        p: `%${EVENT_CHARACTERS.PAR}%`,
        i: `%${EVENT_CHARACTERS.IMPAR}%`
      })
      .getCount();

    const eventsUsePI = periodicEventsWithPI > 0;

    console.log(`[P/I Normalization] Periodic events using P/I: ${eventsUsePI} (${periodicEventsWithPI} events)`);

    const substitutions: Array<{
      oldCharacter: string;
      newCharacter: string;
      daysUpdated: number;
      periodicEventsUpdated: number;
      puntualEventsUpdated: number;
    }> = [];

    // STEP 2A: If no events use P/I, remove P/I from days and add standard P/I
    if (!eventsUsePI) {
      console.log('[P/I Normalization] No events use P/I - removing P/I from days and adding standard P/I');

      for (const day of allDays) {
        if (!day.lective) continue;

        // Remove P and I from dayCharacter
        let newChar = day.dayCharacter
          .replace(new RegExp(EVENT_CHARACTERS.PAR, 'g'), '')
          .replace(new RegExp(EVENT_CHARACTERS.IMPAR, 'g'), '');

        // Add standard P/I based on week parity
        const isPar = esSemanaPar(day.date, calendar.start);
        newChar += isPar ? EVENT_CHARACTERS.PAR : EVENT_CHARACTERS.IMPAR;

        if (newChar !== day.dayCharacter) {
          day.dayCharacter = newChar;
          await dayRepo.save(day);
        }
      }

      // Update charactersInUse
      const charactersSet = new Set<string>();
      allDays.forEach(day => {
        for (const char of day.dayCharacter) {
          charactersSet.add(char);
        }
      });
      calendar.charactersInUse = Array.from(charactersSet).sort((a, b) => a.localeCompare(b)).join('');
      await calendarRepo.save(calendar);

      return {
        performed: true,
        eventsUsePI: false,
        iValid: false,
        pValid: false,
        substitutions: [],
        piAdded: true,
        summary: 'No events use P/I. Removed P/I from days and added standard P/I based on week parity.'
      };
    }

    // STEP 2B: Events use P/I - validate strict pattern
    console.log('[P/I Normalization] Events use P/I - validating strict pattern');

    // Group days by week number
    const daysByWeek = new Map<number, Day[]>();
    for (const day of allDays) {
      if (!day.lective) continue;
      const weekNum = calcularNumeroSemanaDesdeInicio(day.date, calendar.start);
      if (!daysByWeek.has(weekNum)) {
        daysByWeek.set(weekNum, []);
      }
      daysByWeek.get(weekNum)!.push(day);
    }

    // Validate I: ALL lective days of odd weeks must have I
    let iValid = true;
    for (const [weekNum, days] of daysByWeek) {
      const isOddWeek = weekNum % 2 === 1;
      if (isOddWeek) {
        for (const day of days) {
          if (!day.dayCharacter.includes(EVENT_CHARACTERS.IMPAR)) {
            iValid = false;
            console.log(`[P/I Normalization] I invalid: Week ${weekNum} (odd) day ${day.date.toISOString().split('T')[0]} missing I`);
            break;
          }
        }
        if (!iValid) break;
      }
    }

    // Validate P: ALL lective days of even weeks must have P
    let pValid = true;
    for (const [weekNum, days] of daysByWeek) {
      const isEvenWeek = weekNum % 2 === 0;
      if (isEvenWeek) {
        for (const day of days) {
          if (!day.dayCharacter.includes(EVENT_CHARACTERS.PAR)) {
            pValid = false;
            console.log(`[P/I Normalization] P invalid: Week ${weekNum} (even) day ${day.date.toISOString().split('T')[0]} missing P`);
            break;
          }
        }
        if (!pValid) break;
      }
    }

    console.log(`[P/I Normalization] Validation results - I: ${iValid}, P: ${pValid}`);

    let currentCharactersInUse = calendar.charactersInUse;

    // STEP 2.2: If I invalid, substitute I with available character
    if (!iValid) {
      const newChar = findAvailableCharacter(currentCharactersInUse);
      console.log(`[P/I Normalization] Substituting I → ${newChar}`);

      let daysUpdated = 0;
      let periodicEventsUpdated = 0;

      // Update days
      for (const day of allDays) {
        if (day.dayCharacter.includes(EVENT_CHARACTERS.IMPAR)) {
          day.dayCharacter = day.dayCharacter.replace(new RegExp(EVENT_CHARACTERS.IMPAR, 'g'), newChar);
          await dayRepo.save(day);
          daysUpdated++;
        }
      }

      // Update periodic events
      const periodicEventsToUpdate = await periodicEventRepo.find({
        where: { calendar: { id: calendarId } }
      });
      for (const event of periodicEventsToUpdate) {
        if (event.eventCharacter.includes(EVENT_CHARACTERS.IMPAR)) {
          event.eventCharacter = event.eventCharacter.replace(new RegExp(EVENT_CHARACTERS.IMPAR, 'g'), newChar);
          await periodicEventRepo.save(event);
          periodicEventsUpdated++;
        }
      }

      // Note: Puntual events don't have eventCharacter, no need to update them

      currentCharactersInUse = currentCharactersInUse.replace(EVENT_CHARACTERS.IMPAR, '') + newChar;

      substitutions.push({
        oldCharacter: EVENT_CHARACTERS.IMPAR,
        newCharacter: newChar,
        daysUpdated,
        periodicEventsUpdated,
        puntualEventsUpdated: 0
      });

      console.log(`[P/I Normalization] I substitution complete: ${daysUpdated} days, ${periodicEventsUpdated} periodic events`);
    }

    // STEP 2.4: If P invalid, substitute P with available character
    if (!pValid) {
      const newChar = findAvailableCharacter(currentCharactersInUse);
      console.log(`[P/I Normalization] Substituting P → ${newChar}`);

      let daysUpdated = 0;
      let periodicEventsUpdated = 0;

      // Reload days after potential I substitution
      const allDaysRefreshed = await dayRepo.find({
        where: { calendar: { id: calendarId } },
        order: { date: 'ASC' }
      });

      // Update days
      for (const day of allDaysRefreshed) {
        if (day.dayCharacter.includes(EVENT_CHARACTERS.PAR)) {
          day.dayCharacter = day.dayCharacter.replace(new RegExp(EVENT_CHARACTERS.PAR, 'g'), newChar);
          await dayRepo.save(day);
          daysUpdated++;
        }
      }

      // Update periodic events
      const periodicEventsToUpdate = await periodicEventRepo.find({
        where: { calendar: { id: calendarId } }
      });
      for (const event of periodicEventsToUpdate) {
        if (event.eventCharacter.includes(EVENT_CHARACTERS.PAR)) {
          event.eventCharacter = event.eventCharacter.replace(new RegExp(EVENT_CHARACTERS.PAR, 'g'), newChar);
          await periodicEventRepo.save(event);
          periodicEventsUpdated++;
        }
      }

      // Note: Puntual events don't have eventCharacter, no need to update them

      currentCharactersInUse = currentCharactersInUse.replace(EVENT_CHARACTERS.PAR, '') + newChar;

      substitutions.push({
        oldCharacter: EVENT_CHARACTERS.PAR,
        newCharacter: newChar,
        daysUpdated,
        periodicEventsUpdated,
        puntualEventsUpdated: 0
      });

      console.log(`[P/I Normalization] P substitution complete: ${daysUpdated} days, ${periodicEventsUpdated} periodic events`);
    }

    // STEP 2.5: Add standard P/I to all lective days (concatenate)
    console.log('[P/I Normalization] Adding standard P/I to all lective days');

    const allDaysFinal = await dayRepo.find({
      where: { calendar: { id: calendarId } },
      order: { date: 'ASC' }
    });

    for (const day of allDaysFinal) {
      if (!day.lective) continue;

      const isPar = esSemanaPar(day.date, calendar.start);
      const standardChar = isPar ? EVENT_CHARACTERS.PAR : EVENT_CHARACTERS.IMPAR;

      // Only add if not already present
      if (!day.dayCharacter.includes(standardChar)) {
        day.dayCharacter += standardChar;
        await dayRepo.save(day);
      }
    }

    // Update charactersInUse
    const charactersSet = new Set<string>();
    allDaysFinal.forEach(day => {
      for (const char of day.dayCharacter) {
        charactersSet.add(char);
      }
    });
    calendar.charactersInUse = Array.from(charactersSet).sort((a, b) => a.localeCompare(b)).join('');
    await calendarRepo.save(calendar);

    const summary = substitutions.length > 0
      ? `Validation complete. Substitutions: ${substitutions.map(s => `${s.oldCharacter}→${s.newCharacter}`).join(', ')}. Standard P/I added to all lective days.`
      : 'P/I validation passed. Standard P/I confirmed in all lective days.';

    console.log(`[P/I Normalization] ${summary}`);

    return {
      performed: true,
      eventsUsePI: true,
      iValid,
      pValid,
      substitutions,
      piAdded: true,
      summary
    };
  }

  /**
   * Get the maximum number of groups allowed for a specific subject/type/language
   * This is determined by counting existing groups from asignaturas.txt processing
   */
  private static async getMaxGroupsForSubjectType(
    subjectId: string,
    groupType: string,
    language: string
  ): Promise<number> {
    const groupRepo = AppDataSource.getRepository(Group);

    // Count existing groups for this subject/type/language combination
    const count = await groupRepo.count({
      where: {
        subject: { id: subjectId },
        type: groupType,
        language: language
      }
    });

    return count;
  }

  /**
   * Process horarios.txt file
   */
  private static async processHorariosFile(
    content: string,
    courseId: string,
    semester: number,
    userEmail: string | null,
    groupLimits?: Map<string, number>
  ) {
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents: any[] = [];
    const errors: string[] = [];

    // Group validation tracking
    const groupsNotFound: any[] = [];
    const groupsAutoCreated: any[] = [];
    let totalValidRows = 0;
    let eventsCreated = 0;
    let eventsSkipped = 0;

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

    // First pass: Parse all lines and validate planified hours consistency per group
    interface ParsedEvent {
      lineNumber: number;
      year: number;
      subjectAcronym: string;
      groupType: string;
      groupNumber: number;
      language: string;
      weekDay: string;
      startTime: string;
      endTime: string;
      classroomCode: string;
      eventCharacter: string;
      planifiedHours: number;
    }

    const parsedEvents: ParsedEvent[] = [];
    const groupPlanifiedHours = new Map<string, { hours: number[]; lines: number[] }>();

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

        // Store parsed event
        parsedEvents.push({
          lineNumber: i + 1,
          year,
          subjectAcronym,
          groupType,
          groupNumber,
          language,
          weekDay: weekDayUpper,
          startTime,
          endTime,
          classroomCode,
          eventCharacter,
          planifiedHours
        });

        // Track planified hours per group
        const groupKey = this.formatGroupKey(subjectAcronym, groupType, groupNumber, language);
        if (!groupPlanifiedHours.has(groupKey)) {
          groupPlanifiedHours.set(groupKey, { hours: [], lines: [] });
        }
        const groupData = groupPlanifiedHours.get(groupKey)!;
        groupData.hours.push(planifiedHours);
        groupData.lines.push(i + 1);
      } catch (error) {
        // Log parsing error
        console.error(`[HORARIOS PARSING ERROR] Line ${i + 1}:`, error instanceof Error ? error.message : error);
        console.error(`[HORARIOS PARSING ERROR] Line content: "${lines[i]}"`);
      }
    }

    // Validate: all events for the same group must have the same planified hours
    for (const [groupKey, groupData] of groupPlanifiedHours.entries()) {
      const uniqueHours = [...new Set(groupData.hours)];
      if (uniqueHours.length > 1) {
        const hoursDetail = uniqueHours.map(h => `${h}h`).join(', ');
        const linesDetail = groupData.lines.join(', ');
        errors.push(`Grupo ${groupKey}: Horas planificadas inconsistentes (${hoursDetail}) en líneas ${linesDetail}`);
      }
    }

    // If validation failed, return errors without processing anything
    if (errors.length > 0) {
      return {
        processed: false,
        error: 'Validación de horas planificadas fallida',
        totalLines: lines.filter(line => line.trim()).length,
        processedCount: 0,
        errorCount: errors.length,
        events: [],
        errors
      };
    }

    // Second pass: Process events (validation passed)
    // Track groups to update their planifiedHours
    const groupsToUpdate = new Map<string, { group: Group; planifiedHours: number }>();

    for (const event of parsedEvents) {
      try {
        // Build group key for tracking and logging
        const groupKey = this.formatGroupKey(event.subjectAcronym, event.groupType, event.groupNumber, event.language);

        const subject = await subjectRepo.findOne({
          where: {
            acronym: event.subjectAcronym,
            calendar: { id: calendar.id }
          }
        });
        if (!subject) {
          // Asignatura no existe - reportar error
          console.warn(`[HORARIOS] Línea ${event.lineNumber}: Asignatura ${event.subjectAcronym} no encontrada`);
          groupsNotFound.push({
            row: event.lineNumber,
            groupKey,
            subjectAcronym: event.subjectAcronym,
            groupType: event.groupType,
            groupNumber: event.groupNumber,
            language: event.language,
            maxAllowed: 0,
            source: 'horarios',
            error: {
              field: 'subject',
              message: `La asignatura ${event.subjectAcronym} no existe en el calendario`
            }
          });
          eventsSkipped++;
          continue;
        }

        let group = await groupRepo.findOne({
          where: {
            calendar: { id: calendar.id },
            number: event.groupNumber,
            type: event.groupType,
            language: event.language,
            subject: { id: subject.id }
          },
          relations: ['subject', 'calendar']
        });

        // ALWAYS validate group number against maximum defined in asignaturas.txt
        // Get limit from groupLimits map (passed from asignaturas.txt processing)
        const limitKey = `${event.subjectAcronym}.${event.groupType}.${event.language}`;
        const maxGroups = groupLimits?.get(limitKey) ?? 0;

        // Validate: group number must not exceed maximum defined in asignaturas.txt
        // NOTE: maxGroups = 0 means no groups should exist for this subject/type/language
        if (event.groupNumber > maxGroups) {
          // Group exceeds maximum - record error and skip event creation
          console.warn(`[GROUP VALIDATION ERROR] ${groupKey} excede el máximo permitido (${maxGroups}) definido en asignaturas.txt`);
          groupsNotFound.push({
            row: event.lineNumber,
            groupKey,
            subjectAcronym: event.subjectAcronym,
            groupType: event.groupType,
            groupNumber: event.groupNumber,
            language: event.language,
            maxAllowed: maxGroups,
            source: 'horarios',
            error: {
              field: 'group',
              message: `El grupo ${event.groupNumber} excede el máximo de ${maxGroups} grupos definidos en asignaturas.txt`
            }
          });
          eventsSkipped++;
          continue; // Skip event creation - don't create group or event
        }

        // If group doesn't exist, create it (only after validation passes)
        if (!group) {
          // Create new group
          group = groupRepo.create({
            calendar,
            number: event.groupNumber,
            type: event.groupType,
            language: event.language,
            subject,
            planifiedHours: event.planifiedHours,
            createdBy: userEmail
          });
          await groupRepo.save(group);

          // Track auto-created group as warning
          groupsAutoCreated.push({
            row: event.lineNumber,
            groupKey,
            warning: {
              field: 'group',
              message: `Grupo creado automáticamente`
            }
          });
        }

        // Increment valid rows counter for ALL events that pass validation
        totalValidRows++;

        // Track this group for planifiedHours update (always add to ensure existing groups are updated)
        if (!groupsToUpdate.has(groupKey)) {
          groupsToUpdate.set(groupKey, { group, planifiedHours: event.planifiedHours });
        }

        let classroom = await classroomRepo.findOne({ where: { code: event.classroomCode } });
        if (!classroom) {
          // Aula no existe - reportar error
          console.warn(`[HORARIOS] Línea ${event.lineNumber}: Aula ${event.classroomCode} no encontrada`);
          groupsNotFound.push({
            row: event.lineNumber,
            groupKey,
            subjectAcronym: event.subjectAcronym,
            groupType: event.groupType,
            groupNumber: event.groupNumber,
            language: event.language,
            maxAllowed: 0,
            source: 'horarios',
            error: {
              field: 'classroom',
              message: `El aula ${event.classroomCode} no existe`
            }
          });
          eventsSkipped++;
          continue;
        }

        const existingEvent = await periodicEventRepo
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.groups', 'group')
          .leftJoinAndSelect('event.classrooms', 'classroom')
          .where('event.calendar = :calendarId', { calendarId: calendar.id })
          .andWhere('event.year = :year', { year: event.year })
          .andWhere('event.weekDay = :weekDay', { weekDay: event.weekDay })
          .andWhere('event.startTime = :startTime', { startTime: event.startTime })
          .andWhere('event.endTime = :endTime', { endTime: event.endTime })
          .andWhere('group.id = :groupId', { groupId: group.id })
          .andWhere('classroom.id = :classroomId', { classroomId: classroom.id })
          .getOne();

        if (existingEvent) {
          let hasChanges = false;
          if (existingEvent.eventCharacter !== event.eventCharacter) {
            existingEvent.eventCharacter = event.eventCharacter;
            hasChanges = true;
          }
          if (existingEvent.planifiedHours !== event.planifiedHours) {
            existingEvent.planifiedHours = event.planifiedHours;
            hasChanges = true;
          }
          if (hasChanges) {
            await periodicEventRepo.save(existingEvent);
            processedEvents.push({
              subject: event.subjectAcronym,
              groupType: event.groupType,
              groupNumber: event.groupNumber,
              language: event.language,
              action: 'updated',
              line: event.lineNumber
            });
            eventsCreated++;
          } else {
            processedEvents.push({
              subject: event.subjectAcronym,
              groupType: event.groupType,
              groupNumber: event.groupNumber,
              language: event.language,
              action: 'skipped',
              line: event.lineNumber
            });
            eventsSkipped++;
          }
        } else {
          const periodicEvent = periodicEventRepo.create({
            calendar,
            year: event.year,
            weekDay: event.weekDay,
            startTime: event.startTime,
            endTime: event.endTime,
            eventCharacter: event.eventCharacter,
            planifiedHours: event.planifiedHours,
            groups: [group],
            classrooms: [classroom],
            createdBy: userEmail
          });
          await periodicEventRepo.save(periodicEvent);
          processedEvents.push({
            subject: event.subjectAcronym,
            groupType: event.groupType,
            groupNumber: event.groupNumber,
            language: event.language,
            action: 'created',
            line: event.lineNumber
          });
          eventsCreated++;
        }
      } catch (error) {
        // Log event processing error
        console.error(`[HORARIOS EVENT ERROR] Line ${event.lineNumber}:`, error instanceof Error ? error.message : error);
        errors.push(`Línea ${event.lineNumber}: ${error instanceof Error ? error.message : String(error)}`);
        eventsSkipped++;
      }
    }

    // Update Group.planifiedHours for all affected groups
    for (const { group, planifiedHours } of groupsToUpdate.values()) {
      // Always update to ensure correct value, even if it seems the same
      group.planifiedHours = planifiedHours;
      group.updatedBy = userEmail;
      group.updatedAt = new Date();
      await groupRepo.save(group);
    }

    // Prepare group validation result
    const groupValidation = {
      hasIssues: groupsNotFound.length > 0 || groupsAutoCreated.length > 0,
      groupsNotFound,
      groupsAutoCreated,
      statistics: {
        totalRows: lines.filter(line => line.trim()).length,
        validRows: totalValidRows,
        groupsNotFoundCount: groupsNotFound.length,
        groupsAutoCreatedCount: groupsAutoCreated.length,
        eventsCreated,
        eventsSkipped
      }
    };

    if (groupsNotFound.length > 0) {
      console.warn(`[GROUP VALIDATION] Grupos con errores:`, groupsNotFound.map(g => g.groupKey));
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      events: processedEvents,
      errors,
      groupValidation
    };
  }

  /**
   * Process excepciones.txt file with optional filtering by cancelled status.
   *
   * @param content - Raw content of excepciones.txt file
   * @param courseId - ID of the course
   * @param semester - Semester number
   * @param userEmail - Email of user performing the import (for audit)
   * @param groupLimits - Map of maximum group numbers from asignaturas.txt for validation
   * @param onlyCancelled - Filter events by type: undefined=all events, true=only cancelled, false=only non-cancelled.
   *                        Used in REPLACE mode for two-pass processing (non-cancelled first, then cancelled).
   * @param validateClassrooms - When true (individual exception imports), validates that classrooms exist and reports errors.
   *                             When false (full calendar imports), auto-creates missing classrooms.
   * @param autoCreateGroups - When true (full calendar imports), auto-creates groups if they don't exist.
   *                           When false (individual exception imports), validates that groups exist.
   * @returns Processing result with statistics and validation info
   */
  private static async processExcepcionesFileFiltered(
    content: string,
    courseId: string,
    semester: number,
    userEmail: string | null,
    groupLimits?: Map<string, number>,
    onlyCancelled?: boolean,
    validateClassrooms?: boolean,
    autoCreateGroups?: boolean
  ) {
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents: any[] = [];
    const errors: string[] = [];

    // Group validation tracking
    const groupsNotFound: any[] = [];
    const groupsAutoCreated: any[] = [];
    let totalValidRows = 0;
    let eventsCreated = 0;
    let eventsSkipped = 0;

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

        // Determinar si es cancelado ANTES de cualquier procesamiento
        const cancelled = startTimeStr === '-1';

        // FILTRO: Si onlyCancelled está definido, filtrar por ese valor
        if (onlyCancelled !== undefined && cancelled !== onlyCancelled) {
          continue; // Saltar este evento, no coincide con el filtro
        }

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

        // Format group key for error reporting
        const groupKey = this.formatGroupKey(subjectAcronym, groupType, groupNumber, language);

        // ========== PHASE 1: INDEPENDENT VALIDATIONS ==========
        // These validations don't depend on each other and can be done in parallel
        let hasErrors = false;

        // Validate classroom (independent validation)
        let classroom: any = null;
        if (validateClassrooms) {
          classroom = await classroomRepo.findOne({ where: { code: classroomCode } });
          if (!classroom) {
            console.warn(`[EXCEPCIONES] Línea ${i + 1}: Aula ${classroomCode} no encontrada`);
            groupsNotFound.push({
              row: i + 1,
              groupKey,
              subjectAcronym,
              groupType,
              groupNumber,
              language,
              maxAllowed: 0,
              source: 'excepciones',
              error: {
                field: 'classroom',
                message: `El aula ${classroomCode} no existe`
              }
            });
            hasErrors = true;
          }
        }

        // Validate subject (independent validation)
        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym, calendar: { id: calendar.id } } });
        if (!subject) {
          console.warn(`[EXCEPCIONES] Línea ${i + 1}: Asignatura ${subjectAcronym} no encontrada`);
          groupsNotFound.push({
            row: i + 1,
            groupKey,
            subjectAcronym,
            groupType,
            groupNumber,
            language,
            maxAllowed: 0,
            source: 'excepciones',
            error: {
              field: 'subject',
              message: `La asignatura ${subjectAcronym} no existe en el calendario`
            }
          });
          hasErrors = true;
        }

        // If subject doesn't exist, we can't validate date/group (they depend on subject)
        if (!subject) {
          eventsSkipped++;
          continue;
        }

        // ========== PHASE 2: DEPENDENT VALIDATIONS ==========
        // These validations depend on subject existing

        // Validate day existence (depends on calendar)
        const dayEntity = await dayRepo.findOne({ where: { calendar: { id: calendar.id }, date } });
        if (!dayEntity) {
          console.warn(`[EXCEPCIONES] Línea ${i + 1}: Día no encontrado para fecha ${dateStr}`);
          groupsNotFound.push({
            row: i + 1,
            groupKey,
            subjectAcronym,
            groupType,
            groupNumber,
            language,
            maxAllowed: 0,
            source: 'excepciones',
            error: {
              field: 'date',
              message: `El día ${dateStr} no existe en el calendario`
            }
          });
          hasErrors = true;
        }

        // Validate group (depends on subject.id)
        let group = await groupRepo.findOne({
          where: {
            calendar: { id: calendar.id },
            number: groupNumber,
            type: groupType,
            language,
            subject: { id: subject.id }
          },
          relations: ['subject', 'calendar']
        });

        if (!group) {
          if (autoCreateGroups) {
            // MODE: Full calendar import - AUTO-CREATE group
            group = groupRepo.create({
              calendar,
              number: groupNumber,
              type: groupType,
              language,
              subject,
              createdBy: userEmail
            });
            await groupRepo.save(group);
            console.log(`[EXCEPCIONES] Línea ${i + 1}: Grupo ${groupKey} creado automáticamente`);
            groupsAutoCreated.push({
              row: i + 1,
              groupKey,
              warning: {
                field: 'group',
                message: `Grupo creado automáticamente`
              }
            });
          } else {
            // MODE: Individual exception import - VALIDATE group must exist
            console.warn(`[EXCEPCIONES] Línea ${i + 1}: Grupo ${groupKey} no encontrado`);
            groupsNotFound.push({
              row: i + 1,
              groupKey,
              subjectAcronym,
              groupType,
              groupNumber,
              language,
              maxAllowed: 0,
              source: 'excepciones',
              error: {
                field: 'group',
                message: `El grupo no existe en el calendario`
              }
            });
            hasErrors = true;
          }
        }

        // If any validation failed, skip this event
        if (hasErrors || !dayEntity || !group || (validateClassrooms && !classroom)) {
          eventsSkipped++;
          continue;
        }

        // Increment valid rows counter for ALL events that pass validation
        totalValidRows++;

        // Procesar hora de inicio y fin
        let startTime: string, endTime: string;

        if (cancelled) {
          // Para eventos cancelados, endTimeStr puede contener hora de INICIO o FIN del evento original
          // Necesitamos buscar el evento original para determinar ambas horas
          const normalizeTime = (time: string) => time.replace('.', ':');
          const timeFromFile = normalizeTime(endTimeStr); // No sabemos si es inicio o fin

          // Obtener día de la semana (L, M, X, J, V)
          const dayOfWeek = this.getDayLetterFromDate(date);

          // Función auxiliar para normalizar horas a formato HH:MM
          const normalizeTimeForComparison = (time: string) => time.substring(0, 5);

          // PASO 1: Buscar eventos puntuales no cancelados en esa fecha exacta
          const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
          const eventosPuntuales = await puntualEventRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.groups', 'group')
            .leftJoinAndSelect('event.day', 'day')
            .leftJoin('day.calendar', 'calendar')
            .where('calendar.id = :calendarId', { calendarId: calendar.id })
            .andWhere('day.date = :date', { date })
            .andWhere('group.id = :groupId', { groupId: group.id })
            .andWhere('event.cancelled = :cancelled', { cancelled: false })
            .getMany();

          // PASO 2: Buscar eventos periódicos que coincidan con este grupo en este día de la semana
          const eventosPeriodicos = await periodicEventRepo.find({
            where: {
              calendar: { id: calendar.id },
              weekDay: dayOfWeek
            },
            relations: ['groups']
          });

          console.log(`[CANCELADO DEBUG] Buscando evento para ${subjectAcronym}.${groupType}.${groupInfo} en ${dateStr} (${dayOfWeek})`);
          console.log(`[CANCELADO DEBUG] Eventos periódicos encontrados: ${eventosPeriodicos.length}`);
          console.log(`[CANCELADO DEBUG] Eventos puntuales encontrados: ${eventosPuntuales.length}`);

          // Filtrar eventos periódicos que pertenecen a este grupo
          const eventosPeriodicosDelGrupo = eventosPeriodicos.filter(pe =>
            pe.groups.some(g => g.id === group.id)
          );

          console.log(`[CANCELADO DEBUG] Eventos periódicos del grupo: ${eventosPeriodicosDelGrupo.length}`);

          // PASO 3: Verificar si eventos periódicos se generarían en esta fecha
          // Solo incluir eventos periódicos si el día es lectivo y cumple condiciones de dayCharacter
          const eventosPeriodicosValidos = dayEntity.lective
            ? eventosPeriodicosDelGrupo.filter(pe =>
                this.debeGenerarseEventoPeriodico(pe, dayEntity)
              )
            : [];

          console.log(`[CANCELADO DEBUG] Día lectivo: ${dayEntity.lective}, Eventos periódicos válidos: ${eventosPeriodicosValidos.length}`);
          if (eventosPeriodicosValidos.length > 0) {
            console.log(`[CANCELADO DEBUG] Horarios eventos periódicos válidos:`, eventosPeriodicosValidos.map(e => `${e.startTime}-${e.endTime}`));
          }

          // PASO 4: Combinar eventos puntuales + periódicos válidos
          const eventosCandidatos = [
            ...eventosPuntuales,
            ...eventosPeriodicosValidos
          ];

          console.log(`[CANCELADO DEBUG] Total candidatos: ${eventosCandidatos.length}, Buscando coincidencia con hora: ${timeFromFile}`);

          // PASO 5: Buscar coincidencia - primero por hora de FIN, luego por hora de INICIO
          let eventoCoincidente: any = null;
          let coincidioPor: 'endTime' | 'startTime' | null = null;

          // Intentar coincidir por hora de FIN
          eventoCoincidente = eventosCandidatos.find(e =>
            normalizeTimeForComparison(e.endTime) === timeFromFile
          );

          if (eventoCoincidente) {
            coincidioPor = 'endTime';
          } else {
            // Intentar coincidir por hora de INICIO
            eventoCoincidente = eventosCandidatos.find(e =>
              normalizeTimeForComparison(e.startTime) === timeFromFile
            );
            if (eventoCoincidente) {
              coincidioPor = 'startTime';
            }
          }

          // PASO 6: Asignar horas o ignorar evento si no hay coincidencia
          if (eventoCoincidente) {
            startTime = normalizeTimeForComparison(eventoCoincidente.startTime);
            endTime = normalizeTimeForComparison(eventoCoincidente.endTime);

            console.log(`[CANCELADO] Evento encontrado por ${coincidioPor} para ${subjectAcronym}.${groupType}.${groupInfo} en ${dateStr}: ${startTime} - ${endTime}`);
          } else {
            // NO se encontró evento coincidente → IGNORAR este evento cancelado
            console.warn(`[CANCELADO IGNORADO] No se encontró evento para ${subjectAcronym}.${groupType}.${groupInfo} en ${dateStr} con hora ${timeFromFile}. Evento no será creado.`);

            processedEvents.push({
              date: dateStr,
              subject: subjectAcronym,
              action: 'ignored_cancelled',
              line: i + 1
            });

            eventsSkipped++;
            continue; // Saltar este evento, no crearlo
          }
        } else {
          const normalizeTime = (time: string) => time.replace('.', ':');
          startTime = normalizeTime(startTimeStr);
          endTime = normalizeTime(endTimeStr);
        }

        // Handle classroom: already validated if validateClassrooms=true, need to fetch/create if false
        if (!validateClassrooms && !classroom) {
          // MODE: Full calendar import - AUTO-CREATE missing classrooms if not validated yet
          classroom = await classroomRepo.findOne({ where: { code: classroomCode } });
          if (!classroom) {
            classroom = classroomRepo.create({ code: classroomCode, gisUrl: '', createdBy: userEmail });
            await classroomRepo.save(classroom);
          }
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
            eventsCreated++;
          } else {
            processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'skipped', line: i + 1 });
            eventsSkipped++;
          }
        } else {
          const puntualEvent = puntualEventRepo.create({ day: dayEntity, startTime, endTime, cancelled, comment, groups: [group], classrooms: [classroom], createdBy: userEmail });
          await puntualEventRepo.save(puntualEvent);
          processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'created', line: i + 1 });
          eventsCreated++;
        }
      } catch (error) {
        console.error(`[EXCEPCIONES ERROR] Error procesando línea ${i + 1}: ${line}`, error);
        errors.push(`Línea ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Prepare group validation result
    const groupValidation = {
      hasIssues: groupsNotFound.length > 0 || groupsAutoCreated.length > 0,
      groupsNotFound,
      groupsAutoCreated,
      statistics: {
        totalRows: lines.filter(line => line.trim()).length,
        validRows: totalValidRows,
        groupsNotFoundCount: groupsNotFound.length,
        groupsAutoCreatedCount: groupsAutoCreated.length,
        eventsCreated,
        eventsSkipped
      }
    };

    if (groupsNotFound.length > 0) {
      console.warn(`[GROUP VALIDATION - EXCEPCIONES] Grupos con errores:`, groupsNotFound.map(g => g.groupKey));
    }

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      events: processedEvents,
      errors,
      groupValidation
    };
  }

  /**
   * Process excepciones.txt file
   * This method maintains compatibility with the full import flow (all files together)
   * It delegates to processExcepcionesFileFiltered without filtering (processes all events)
   * validateClassrooms is TRUE because in full import, classrooms must already exist from ubicaciones.txt
   * autoCreateGroups is TRUE because in full import, groups can be created for events without regular schedule
   */
  private static async processExcepcionesFile(content: string, courseId: string, semester: number, userEmail: string | null, groupLimits?: Map<string, number>) {
    return this.processExcepcionesFileFiltered(content, courseId, semester, userEmail, groupLimits, undefined, true, true);
  }

  /**
   * Obtiene la letra del día de la semana (L, M, X, J, V) a partir de una fecha
   * @param date Fecha
   * @returns 'L' | 'M' | 'X' | 'J' | 'V' | '' (vacío para sábado/domingo)
   */
  private static getDayLetterFromDate(date: Date): string {
    const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

    const dayMap: Record<number, string> = {
      1: 'L', // Lunes
      2: 'M', // Martes
      3: 'X', // Miércoles
      4: 'J', // Jueves
      5: 'V'  // Viernes
    };

    return dayMap[dayOfWeek] || '';
  }

  /**
   * Verifica si un evento periódico debe generarse en un día específico
   * según su eventCharacter y el dayCharacter del día
   *
   * Lógica basada en calendar-events.service.ts:
   * - Eventos con carácter "Normal" (N): Se generan en días lectivos (filtrado posterior por presupuesto)
   * - Eventos con otros caracteres (P, I, etc): Solo si el dayCharacter incluye el eventCharacter
   *
   * @param eventoPeriodico - El evento periódico a verificar
   * @param dia - El día del calendario
   * @returns true si el evento debe generarse en ese día
   */
  private static debeGenerarseEventoPeriodico(eventoPeriodico: any, dia: any): boolean {
    const caracterEvento = eventoPeriodico.eventCharacter?.toUpperCase() || '';
    const caracterDia = (dia.dayCharacter || '').toUpperCase();

    // Eventos con carácter Normal (N) se generan en todos los días lectivos
    if (caracterEvento === EVENT_CHARACTERS.NORMAL) {
      return true;
    }

    // Eventos con otros caracteres (P, I, F, etc) solo se generan si el dayCharacter los incluye
    return caracterDia.includes(caracterEvento);
  }

  /**
   * Import exceptions file only with support for ADD or REPLACE modes.
   *
   * MODE 'add' (merge):
   * - Does NOT delete existing puntual events
   * - Processes all events in a single pass
   * - Updates existing events or creates new ones
   * - Cancelled events can find references in existing events
   *
   * MODE 'replace' (full replacement):
   * - Deletes all existing puntual events first
   * - Processes in TWO passes to ensure cancelled events find references:
   *   - PASS 1: Delete non-cancelled events, then create non-cancelled events
   *   - PASS 2: Delete cancelled events, then create cancelled events (using Pass 1 as references)
   * - Ensures consistent state with file content
   *
   * @param file - The excepciones.txt file
   * @param calendarId - The calendar ID to import exceptions for
   * @param userEmail - User email for audit
   * @param mode - 'add' to merge with existing events, 'replace' to replace all (default: 'replace')
   * @returns Import result with statistics
   */
  static async importExceptionsOnly(
    file: Express.Multer.File,
    calendarId: string,
    userEmail: string | null,
    mode: 'add' | 'replace' = 'replace'
  ) {
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const groupRepo = AppDataSource.getRepository(Group);

    // Verify calendar exists
    const calendar = await calendarRepo.findOne({
      where: { id: calendarId },
      relations: ['course']
    });

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const courseId = calendar.course.id;
    const semester = calendar.semester;

    // Build groupLimits from existing groups in the calendar
    const groupLimits = new Map<string, number>();
    const allGroups = await groupRepo.find({
      where: { calendar: { id: calendarId } },
      relations: ['subject']
    });

    const groupsByKey = new Map<string, number[]>();
    for (const group of allGroups) {
      const limitKey = `${group.subject.acronym}.${group.type}.${group.language}`;
      if (!groupsByKey.has(limitKey)) {
        groupsByKey.set(limitKey, []);
      }
      groupsByKey.get(limitKey)!.push(group.number);
    }

    for (const [limitKey, numbers] of groupsByKey) {
      const maxNumber = Math.max(...numbers);
      groupLimits.set(limitKey, maxNumber);
      console.log(`[GROUP LIMITS] Set limit for ${limitKey}: ${maxNumber}`);
    }

    const content = this.decodeFileContent(file);
    let totalDeleted = 0;
    let totalCreated = 0;
    let combinedErrors: string[] = [];
    let combinedGroupsNotFound: any[] = [];
    let combinedGroupsAutoCreated: any[] = [];
    let totalLines = 0;
    let totalValidRows = 0;

    if (mode === 'add') {
      // ========== MODE: ADD (merge) ==========
      // Process all events in a single pass without deleting
      console.log('[Import Exceptions] MODE: ADD - Merging with existing events');

      const result = await this.processExcepcionesFileFiltered(
        content,
        courseId,
        semester,
        userEmail,
        groupLimits,
        undefined, // Process all events (no filter)
        true, // Validate classrooms (don't auto-create)
        false // Don't auto-create groups (validate they exist)
      );

      totalCreated = result.processedCount;
      combinedErrors = result.errors;
      combinedGroupsNotFound = result.groupValidation?.groupsNotFound || [];
      combinedGroupsAutoCreated = result.groupValidation?.groupsAutoCreated || [];
      totalLines = result.totalLines;
      totalValidRows = result.groupValidation?.statistics?.validRows || 0;

      console.log(`[Import Exceptions] ADD mode completed: ${totalCreated} events processed`);

    } else {
      // ========== MODE: REPLACE (two-pass) ==========
      // Pass 1: Non-cancelled events
      // Pass 2: Cancelled events (can reference Pass 1 events)
      console.log('[Import Exceptions] MODE: REPLACE - Two-pass processing');

      // PASS 1: Non-cancelled events
      console.log('[Import Exceptions] PASS 1: Processing non-cancelled events...');

      const nonCancelledEvents = await puntualEventRepo
        .createQueryBuilder('event')
        .leftJoin('event.day', 'day')
        .leftJoin('day.calendar', 'calendar')
        .where('calendar.id = :calendarId', { calendarId })
        .andWhere('event.cancelled = :cancelled', { cancelled: false })
        .getMany();

      const deletedNonCancelled = nonCancelledEvents.length;
      if (deletedNonCancelled > 0) {
        await puntualEventRepo.remove(nonCancelledEvents);
        console.log(`[Import Exceptions] Deleted ${deletedNonCancelled} non-cancelled events`);
      }

      const result1 = await this.processExcepcionesFileFiltered(
        content,
        courseId,
        semester,
        userEmail,
        groupLimits,
        false, // Only non-cancelled
        true, // Validate classrooms (don't auto-create)
        false // Don't auto-create groups (validate they exist)
      );

      console.log(`[Import Exceptions] PASS 1 completed: ${result1.processedCount} events created`);

      // PASS 2: Cancelled events
      console.log('[Import Exceptions] PASS 2: Processing cancelled events...');

      const cancelledEvents = await puntualEventRepo
        .createQueryBuilder('event')
        .leftJoin('event.day', 'day')
        .leftJoin('day.calendar', 'calendar')
        .where('calendar.id = :calendarId', { calendarId })
        .andWhere('event.cancelled = :cancelled', { cancelled: true })
        .getMany();

      const deletedCancelled = cancelledEvents.length;
      if (deletedCancelled > 0) {
        await puntualEventRepo.remove(cancelledEvents);
        console.log(`[Import Exceptions] Deleted ${deletedCancelled} cancelled events`);
      }

      const result2 = await this.processExcepcionesFileFiltered(
        content,
        courseId,
        semester,
        userEmail,
        groupLimits,
        true, // Only cancelled
        true, // Validate classrooms (don't auto-create)
        false // Don't auto-create groups (validate they exist)
      );

      console.log(`[Import Exceptions] PASS 2 completed: ${result2.processedCount} events created`);

      // Combine results
      totalDeleted = deletedNonCancelled + deletedCancelled;
      totalCreated = result1.processedCount + result2.processedCount;
      combinedErrors = [...result1.errors, ...result2.errors];
      combinedGroupsNotFound = [
        ...(result1.groupValidation?.groupsNotFound || []),
        ...(result2.groupValidation?.groupsNotFound || [])
      ];
      combinedGroupsAutoCreated = [
        ...(result1.groupValidation?.groupsAutoCreated || []),
        ...(result2.groupValidation?.groupsAutoCreated || [])
      ];
      totalLines = result1.totalLines;
      totalValidRows = (result1.groupValidation?.statistics?.validRows || 0) + (result2.groupValidation?.statistics?.validRows || 0);

      console.log(`[Import Exceptions] REPLACE mode completed: ${totalDeleted} deleted, ${totalCreated} created`);
    }

    // Build groupValidation object similar to calendar creation
    const groupValidation = {
      hasIssues: combinedGroupsNotFound.length > 0 || combinedGroupsAutoCreated.length > 0,
      groupsNotFound: combinedGroupsNotFound,
      groupsAutoCreated: combinedGroupsAutoCreated,
      statistics: {
        totalRows: totalLines,
        validRows: totalValidRows,
        groupsNotFoundCount: combinedGroupsNotFound.length,
        groupsAutoCreatedCount: combinedGroupsAutoCreated.length,
        eventsCreated: totalCreated,
        eventsSkipped: totalLines - totalValidRows
      }
    };

    console.log(`[Import Exceptions] groupValidation.hasIssues: ${groupValidation.hasIssues}`);
    console.log(`[Import Exceptions] groupsNotFound count: ${combinedGroupsNotFound.length}`);
    console.log(`[Import Exceptions] groupsAutoCreated count: ${combinedGroupsAutoCreated.length}`);

    const result = {
      status: 'success',
      message: 'Exceptions imported successfully',
      data: {
        mode,
        deletedEvents: totalDeleted,
        createdEvents: totalCreated,
        errors: combinedErrors,
        totalLines,
        errorCount: combinedErrors.length,
        groupValidation
      }
    };

    console.log(`[Import Exceptions] Returning result:`, JSON.stringify(result, null, 2));

    return result;
  }
}
