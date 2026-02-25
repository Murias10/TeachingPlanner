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
 * Interface for P/I conflict detection results
 */
interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType: 'none' | 'P_only' | 'I_only' | 'both_PI' | 'irregular';
  conflicts: Array<{
    character: 'P' | 'I';
    expectedCharacter: 'P' | 'I' | 'F';
    affectedDays: Array<{
      date: Date;
      actualCharacter: string;
      expectedCharacter: string;
      weekNumber: number;
    }>;
  }>;
  statistics: {
    totalDays: number;
    lectiveDays: number;
    daysWithP: number;
    daysWithI: number;
    expectedPDays: number;
    expectedIDays: number;
    conflictingDays: number;
  };
  recommendation: string;
}

/**
 * Interface for character substitution results
 */
interface SubstitutionResult {
  performed: boolean;
  substitutions: Array<{
    oldCharacter: string;
    newCharacter: string;
    reason: string;
    daysUpdated: number;
    eventsUpdated: number;
  }>;
  updatedCharactersInUse: string;
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
          { number: Number.parseInt(groupsTeoriaES, 10), type: 'T', language: 'ES' },
          { number: Number.parseInt(groupsSeminarioES, 10), type: 'S', language: 'ES' },
          { number: Number.parseInt(groupsLaboratorioES, 10), type: 'L', language: 'ES' },
          { number: Number.parseInt(groupsTeoriaEN, 10), type: 'T', language: 'EN' },
          { number: Number.parseInt(groupsSeminarioEN, 10), type: 'S', language: 'EN' },
          { number: Number.parseInt(groupsLaboratorioEN, 10), type: 'L', language: 'EN' },
          { number: Number.parseInt(groupsTutoriaGrupalES, 10), type: 'TG', language: 'ES' },
          { number: Number.parseInt(groupsTutoriaGrupalEN, 10), type: 'TG', language: 'EN' }
        ];

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
        const dayCharacter = parts[1].trim();
        const comment = parts.slice(2).join(':').trim();

        if (!dayCharacter) continue;

        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const dateMatch = dateRegex.exec(dateStr);
        if (!dateMatch) continue;

        const [, day, month, year] = dateMatch;
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));

        if (Number.isNaN(date.getTime())) continue;

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
   * Detects P/I character conflicts between imported TXT and our week parity system
   * @param calendar - The calendar entity with start date
   * @param days - All days from calendario.txt import
   * @returns ConflictDetectionResult with analysis and recommendations
   */
  private static detectPIConflicts(calendar: Calendar, days: Day[]): ConflictDetectionResult {
    const pConflicts: Array<{
      date: Date;
      actualCharacter: string;
      expectedCharacter: string;
      weekNumber: number;
    }> = [];

    const iConflicts: Array<{
      date: Date;
      actualCharacter: string;
      expectedCharacter: string;
      weekNumber: number;
    }> = [];

    let totalDays = 0;
    let lectiveDays = 0;
    let daysWithP = 0;
    let daysWithI = 0;
    let expectedPDays = 0;
    let expectedIDays = 0;

    // Analyze each day
    for (const day of days) {
      totalDays++;

      if (!day.lective) {
        // Non-lective days should always be 'F'
        if (day.dayCharacter === EVENT_CHARACTERS.PAR || day.dayCharacter === EVENT_CHARACTERS.IMPAR) {
          console.warn(`[P/I Detection] Non-lective day ${day.date} has character '${day.dayCharacter}'`);
        }
        continue;
      }

      lectiveDays++;

      // Calculate expected character based on week parity
      const isPar = esSemanaPar(day.date, calendar.start);
      const expectedChar = isPar ? EVENT_CHARACTERS.PAR : EVENT_CHARACTERS.IMPAR;
      const weekNumber = calcularNumeroSemanaDesdeInicio(day.date, calendar.start);

      // Track expected counts
      if (expectedChar === EVENT_CHARACTERS.PAR) {
        expectedPDays++;
      }
      if (expectedChar === EVENT_CHARACTERS.IMPAR) {
        expectedIDays++;
      }

      // Track actual counts
      if (day.dayCharacter === EVENT_CHARACTERS.PAR) {
        daysWithP++;
      }
      if (day.dayCharacter === EVENT_CHARACTERS.IMPAR) {
        daysWithI++;
      }

      // Detect conflicts
      if (day.dayCharacter === EVENT_CHARACTERS.PAR && expectedChar !== EVENT_CHARACTERS.PAR) {
        pConflicts.push({
          date: day.date,
          actualCharacter: day.dayCharacter,
          expectedCharacter: expectedChar,
          weekNumber
        });
      }

      if (day.dayCharacter === EVENT_CHARACTERS.IMPAR && expectedChar !== EVENT_CHARACTERS.IMPAR) {
        iConflicts.push({
          date: day.date,
          actualCharacter: day.dayCharacter,
          expectedCharacter: expectedChar,
          weekNumber
        });
      }
    }

    // Determine conflict type
    let conflictType: 'none' | 'P_only' | 'I_only' | 'both_PI' | 'irregular' = 'none';
    let hasConflict = false;

    if (pConflicts.length > 0 || iConflicts.length > 0) {
      hasConflict = true;

      if (pConflicts.length > 0 && iConflicts.length > 0) {
        conflictType = 'both_PI';
      } else if (pConflicts.length > 0) {
        conflictType = 'P_only';
      } else {
        conflictType = 'I_only';
      }

      // Check for irregular patterns (not a clean biweekly split)
      // If total conflicts is not close to half of lective days, it's irregular
      const totalConflicts = pConflicts.length + iConflicts.length;
      const expectedConflicts = Math.floor(lectiveDays / 2);

      if (Math.abs(totalConflicts - expectedConflicts) > lectiveDays * 0.2) {
        conflictType = 'irregular';
      }
    }

    // Generate recommendation
    let recommendation = '';
    if (!hasConflict) {
      recommendation = 'No P/I conflicts detected. Imported calendar uses standard week parity.';
    } else if (conflictType === 'irregular') {
      recommendation = `IRREGULAR PATTERN: P/I characters do not follow a biweekly pattern. Manual review required. Found ${pConflicts.length + iConflicts.length} conflicts across ${lectiveDays} lective days.`;
    } else if (conflictType === 'both_PI') {
      recommendation = `FULL CONFLICT: Both P and I characters conflict with expected week parity. P conflicts: ${pConflicts.length}, I conflicts: ${iConflicts.length}. Substitution recommended for both characters.`;
    } else if (conflictType === 'P_only') {
      recommendation = `PARTIAL CONFLICT: P character conflicts with expected pattern (${pConflicts.length} days affected). I character is not used or matches. Substitution recommended for P.`;
    } else {
      recommendation = `PARTIAL CONFLICT: I character conflicts with expected pattern (${iConflicts.length} days affected). P character is not used or matches. Substitution recommended for I.`;
    }

    return {
      hasConflict,
      conflictType,
      conflicts: [
        ...(pConflicts.length > 0 ? [{
          character: EVENT_CHARACTERS.PAR,
          expectedCharacter: EVENT_CHARACTERS.IMPAR,
          affectedDays: pConflicts
        }] : []),
        ...(iConflicts.length > 0 ? [{
          character: EVENT_CHARACTERS.IMPAR,
          expectedCharacter: EVENT_CHARACTERS.PAR,
          affectedDays: iConflicts
        }] : [])
      ],
      statistics: {
        totalDays,
        lectiveDays,
        daysWithP,
        daysWithI,
        expectedPDays,
        expectedIDays,
        conflictingDays: pConflicts.length + iConflicts.length
      },
      recommendation
    };
  }

  /**
   * Performs character substitution for conflicting P/I characters
   * @param calendar - The calendar entity to update
   * @param conflictDetection - The conflict detection results
   * @param days - All days that may need character updates
   * @returns SubstitutionResult with details of performed substitutions
   */
  private static async performCharacterSubstitution(
    calendar: Calendar,
    conflictDetection: ConflictDetectionResult,
    days: Day[]
  ): Promise<SubstitutionResult> {
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const substitutions: Array<{
      oldCharacter: string;
      newCharacter: string;
      reason: string;
      daysUpdated: number;
      eventsUpdated: number;
    }> = [];

    // If no conflicts or irregular pattern, skip substitution
    if (!conflictDetection.hasConflict || conflictDetection.conflictType === 'irregular') {
      return {
        performed: false,
        substitutions: [],
        updatedCharactersInUse: calendar.charactersInUse,
        summary: conflictDetection.conflictType === 'irregular'
          ? 'Substitution skipped: Irregular pattern detected. Manual review required.'
          : 'No substitution needed: No P/I conflicts detected.'
      };
    }

    // Build substitution map
    const substitutionMap = new Map<string, string>();
    let currentCharactersInUse = calendar.charactersInUse;

    for (const conflict of conflictDetection.conflicts) {
      const oldChar = conflict.character;

      try {
        // Find available character
        const newChar = findAvailableCharacter(currentCharactersInUse);
        substitutionMap.set(oldChar, newChar);

        // Add new character to charactersInUse (remove old one and add new one)
        currentCharactersInUse = currentCharactersInUse.replace(oldChar, '') + newChar;

        console.log(`[Character Substitution] Will substitute '${oldChar}' → '${newChar}'`);
      } catch (error) {
        // Character limit exceeded
        throw new Error(`Cannot perform substitution: ${(error as Error).message}`);
      }
    }

    // Perform substitutions in database
    for (const [oldChar, newChar] of substitutionMap.entries()) {
      let daysUpdated = 0;
      let reason = '';

      // Find the conflict details for this character
      const conflictDetail = conflictDetection.conflicts.find(c => c.character === oldChar);
      if (conflictDetail) {
        reason = `Character '${oldChar}' conflicts with expected week parity pattern (${conflictDetail.affectedDays.length} days affected)`;
      }

      // Update all days with this character
      const daysToUpdate = days.filter(day => day.dayCharacter === oldChar);
      for (const day of daysToUpdate) {
        day.dayCharacter = newChar;
        await dayRepo.save(day);
        daysUpdated++;
      }

      substitutions.push({
        oldCharacter: oldChar,
        newCharacter: newChar,
        reason,
        daysUpdated,
        eventsUpdated: 0 // Events will be created later with correct character
      });

      console.log(`[Character Substitution] Updated ${daysUpdated} days: '${oldChar}' → '${newChar}'`);
    }

    // Update calendar's charactersInUse
    calendar.charactersInUse = currentCharactersInUse;
    await calendarRepo.save(calendar);

    // Generate summary
    const totalDaysUpdated = substitutions.reduce((sum, s) => sum + s.daysUpdated, 0);
    const summary = `Successfully substituted ${substitutions.length} character(s): ${substitutions.map(s => `'${s.oldCharacter}'→'${s.newCharacter}'`).join(', ')}. Total days updated: ${totalDaysUpdated}.`;

    console.log(`[Character Substitution] ${summary}`);

    return {
      performed: true,
      substitutions,
      updatedCharactersInUse: currentCharactersInUse,
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

    // Detect P/I conflicts before processing events
    const dayRepo = AppDataSource.getRepository(Day);
    const allDays = await dayRepo.find({
      where: { calendar: { id: calendar.id } },
      order: { date: 'ASC' }
    });

    const conflictDetection = this.detectPIConflicts(calendar, allDays);

    const conflictReport = {
      detected: conflictDetection.hasConflict,
      type: conflictDetection.conflictType,
      summary: conflictDetection.recommendation,
      details: conflictDetection.conflicts,
      statistics: conflictDetection.statistics
    };

    console.log('[P/I Conflict Detection] Analysis complete:', {
      hasConflict: conflictReport.detected,
      type: conflictReport.type
    });

    if (conflictReport.detected) {
      console.warn('[P/I Conflict Detection] CONFLICTS DETECTED:', conflictReport);
    }

    // Perform character substitution if conflicts detected
    const substitutionResult = await this.performCharacterSubstitution(
      calendar,
      conflictDetection,
      allDays
    );

    if (substitutionResult.performed) {
      console.log('[Character Substitution] Substitution performed:', substitutionResult.summary);
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
        const subject = await subjectRepo.findOne({ where: { acronym: event.subjectAcronym } });
        if (!subject) continue;

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

        // Build group key for tracking and logging
        const groupKey = this.formatGroupKey(event.subjectAcronym, event.groupType, event.groupNumber, event.language);

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
          classroom = classroomRepo.create({ code: event.classroomCode, gisUrl: '', createdBy: userEmail });
          await classroomRepo.save(classroom);
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
      piConflictDetection: conflictReport,
      piSubstitution: substitutionResult,
      groupValidation
    };
  }

  /**
   * Process excepciones.txt file with optional filtering by cancelled status.
   *
   * This method processes puntual events from the exceptions file. Each line can represent
   * either a normal event (with specific time) or a cancelled event (startTime=-1).
   *
   * The onlyCancelled parameter enables selective processing:
   * - undefined: processes all events (both cancelled and non-cancelled)
   * - true: processes ONLY cancelled events, skipping non-cancelled ones
   * - false: processes ONLY non-cancelled events, skipping cancelled ones
   *
   * This filtering capability is essential for the two-pass import strategy in replace mode,
   * which ensures cancelled events can find their reference events (created in the first pass).
   *
   * @param content - Raw content of excepciones.txt file
   * @param courseId - ID of the course
   * @param semester - Semester number
   * @param userEmail - Email of user performing the import (for audit)
   * @param groupLimits - Map of maximum group numbers from asignaturas.txt for validation
   * @param onlyCancelled - Filter: undefined=all, true=only cancelled, false=only non-cancelled
   * @returns Processing result with statistics and validation info
   */
  private static async processExcepcionesFileFiltered(
    content: string,
    courseId: string,
    semester: number,
    userEmail: string | null,
    groupLimits?: Map<string, number>,
    onlyCancelled?: boolean
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

        // Validate subject first (before checking day existence)
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
          eventsSkipped++;
          continue;
        }

        // Validate day existence (after subject validation)
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
          eventsSkipped++;
          continue;
        }

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

        // For exceptions import: groups MUST exist, do not create them automatically
        if (!group) {
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
   */
  private static async processExcepcionesFile(content: string, courseId: string, semester: number, userEmail: string | null, groupLimits?: Map<string, number>) {
    return this.processExcepcionesFileFiltered(content, courseId, semester, userEmail, groupLimits, undefined);
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
        undefined // Process all events (no filter)
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
        false // Only non-cancelled
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
        true // Only cancelled
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
