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
    const charactersInUse = Array.from(allCharactersSet).sort().join('');
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

        // Log para depuración
        console.log(`[GROUP VALIDATION] ${groupKey} - maxGroups from asignaturas.txt: ${maxGroups}, requested: ${event.groupNumber}, groupExists: ${!!group}`);

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
          console.log(`[GROUP VALIDATION WARNING] ${groupKey} fue creado automáticamente (dentro del límite permitido)`);
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

    // Log final validation summary
    console.log(`[GROUP VALIDATION SUMMARY - HORARIOS]`, {
      hasIssues: groupValidation.hasIssues,
      errorsCount: groupsNotFound.length,
      warningsCount: groupsAutoCreated.length,
      eventsCreated,
      eventsSkipped
    });

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
   * Process excepciones.txt file
   */
  private static async processExcepcionesFile(content: string, courseId: string, semester: number, userEmail: string | null, groupLimits?: Map<string, number>) {
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

        // Obtener entidades necesarias ANTES de procesar cancelaciones
        const dayEntity = await dayRepo.findOne({ where: { calendar: { id: calendar.id }, date } });
        if (!dayEntity) continue;

        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym } });
        if (!subject) continue;

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

        const groupKey = this.formatGroupKey(subjectAcronym, groupType, groupNumber, language);

        // ALWAYS validate group number against maximum defined in asignaturas.txt
        // This validation runs whether the group exists or not
        // Use groupLimits from asignaturas.txt instead of counting database groups
        const limitKey = `${subjectAcronym}.${groupType}.${language}`;
        const maxGroups = groupLimits?.get(limitKey) ?? 0;

        // Log para depuración
        console.log(`[GROUP VALIDATION - EXCEPCIONES] ${groupKey} - limitKey: ${limitKey}, maxGroups from asignaturas.txt: ${maxGroups}, requested: ${groupNumber}, groupExists: ${!!group}`);

        // Validate: group number must not exceed maximum (no condition on maxGroups > 0)
        // This ensures validation works even on first import with empty database
        if (groupNumber > maxGroups) {
          // Group exceeds maximum - record error and skip event creation
          console.warn(`[GROUP VALIDATION ERROR - EXCEPCIONES] ${groupKey} excede el máximo permitido (${maxGroups}) definido en asignaturas.txt`);
          groupsNotFound.push({
            row: i + 1,
            groupKey,
            subjectAcronym,
            groupType,
            groupNumber,
            language,
            maxAllowed: maxGroups,
            source: 'excepciones',
            error: {
              field: 'group',
              message: `El grupo ${groupNumber} excede el máximo de ${maxGroups} grupos definidos en asignaturas.txt`
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
            number: groupNumber,
            type: groupType,
            language,
            subject,
            createdBy: userEmail
          });
          await groupRepo.save(group);

          // Track auto-created group as warning (only if maxGroups > 0, meaning this wasn't expected)
          if (maxGroups > 0) {
            console.log(`[GROUP VALIDATION WARNING - EXCEPCIONES] ${groupKey} fue creado automáticamente`);
            groupsAutoCreated.push({
              row: i + 1,
              groupKey,
              warning: {
                field: 'group',
                message: `Grupo creado automáticamente`
              }
            });
          }
        }

        // Increment valid rows counter for ALL events that pass validation
        totalValidRows++;

        // Procesar hora de inicio y fin
        const cancelled = startTimeStr === '-1';
        let startTime: string, endTime: string;

        // Debug log
        if (cancelled) {
          console.log(`[EXCEPCIONES DEBUG] Evento cancelado detectado: ${dateStr} - ${subjectAcronym}.${groupType}.${groupInfo} - startTimeStr="${startTimeStr}" endTimeStr="${endTimeStr}"`);
        }

        if (cancelled) {
          // Para eventos cancelados, endTimeStr contiene la hora de FIN del evento original
          // Necesitamos obtener la hora de INICIO para que la cancelación funcione correctamente
          const normalizeTime = (time: string) => time.replace('.', ':');
          const endTimeNormalized = normalizeTime(endTimeStr);

          // Obtener día de la semana (L, M, X, J, V)
          const dayOfWeek = this.getDayLetterFromDate(date);

          console.log(`[EXCEPCIONES DEBUG] Buscando evento para cancelar: día=${dayOfWeek}, grupo=${group.id}, endTime=${endTimeNormalized}`);

          // CASO 1: Buscar evento puntual existente en esa fecha exacta (prioridad)
          // Esto cubre el caso de querer cancelar un evento puntual de reemplazo
          const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
          const existingPuntualEvent = await puntualEventRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.groups', 'group')
            .leftJoinAndSelect('event.day', 'day')
            .leftJoin('day.calendar', 'calendar')
            .where('calendar.id = :calendarId', { calendarId: calendar.id })
            .andWhere('day.date = :date', { date })
            .andWhere('group.id = :groupId', { groupId: group.id })
            .andWhere('event.endTime = :endTime', { endTime: endTimeNormalized })
            .andWhere('event.cancelled = :cancelled', { cancelled: false })
            .getOne();

          if (existingPuntualEvent) {
            // Encontramos un evento puntual con la misma hora de fin
            // Normalizar startTime para remover segundos (ej: "18:00:00" -> "18:00")
            const normalizeTimeForComparison = (time: string) => time.substring(0, 5);
            startTime = normalizeTimeForComparison(existingPuntualEvent.startTime);
            endTime = endTimeNormalized;
            console.log(`[EXCEPCIONES DEBUG] Encontrado evento puntual: startTime=${startTime}, endTime=${endTime}`);
          } else {
            // CASO 2: Buscar evento periódico que coincida con este grupo en este día de la semana
            const periodicEvents = await periodicEventRepo.find({
              where: {
                calendar: { id: calendar.id },
                weekDay: dayOfWeek
              },
              relations: ['groups']
            });

            console.log(`[EXCEPCIONES DEBUG] Eventos periódicos encontrados para día ${dayOfWeek}:`, periodicEvents.map(pe => ({
              id: pe.id,
              startTime: pe.startTime,
              endTime: pe.endTime,
              grupos: pe.groups.map(g => g.id)
            })));

            // Encontrar el evento periódico que pertenece a este grupo y termina a esta hora
            // Normalizar ambas horas para comparación (remover segundos si existen)
            const normalizeTimeForComparison = (time: string) => time.substring(0, 5); // "18:00:00" -> "18:00"
            const matchingPeriodicEvent = periodicEvents.find(pe =>
              pe.groups.some(g => g.id === group.id) &&
              normalizeTimeForComparison(pe.endTime) === endTimeNormalized
            );

            if (matchingPeriodicEvent) {
              // Encontramos el evento periódico - usar su startTime (también normalizado)
              startTime = normalizeTimeForComparison(matchingPeriodicEvent.startTime);
              endTime = endTimeNormalized;
              console.log(`[EXCEPCIONES DEBUG] Encontrado evento periódico: startTime=${startTime}, endTime=${endTime}`);
            } else {
              // CASO 3: Fallback - asumir duración de 1 hora
              const [hours, mins] = endTimeNormalized.split(':').map(Number);
              const startHour = hours - 1;
              startTime = `${String(startHour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
              endTime = endTimeNormalized;

              console.warn(`[EXCEPCIONES] No se encontró evento periódico ni puntual para ${subjectAcronym}.${groupType}.${groupInfo} en ${dateStr}. Asumiendo duración de 1 hora: ${startTime} - ${endTime}`);
            }
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
          console.log(`[EXCEPCIONES DEBUG] Creando nuevo evento - cancelled=${cancelled}, startTime=${startTime}, endTime=${endTime}`);
          const puntualEvent = puntualEventRepo.create({ day: dayEntity, startTime, endTime, cancelled, comment, groups: [group], classrooms: [classroom], createdBy: userEmail });
          await puntualEventRepo.save(puntualEvent);
          processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'created', line: i + 1 });
          eventsCreated++;
        }
      } catch (error) {
        // Continue on error
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

    // Log final validation summary
    console.log(`[GROUP VALIDATION SUMMARY - EXCEPCIONES]`, {
      hasIssues: groupValidation.hasIssues,
      errorsCount: groupsNotFound.length,
      warningsCount: groupsAutoCreated.length,
      eventsCreated,
      eventsSkipped
    });

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
   * Import exceptions file only - replaces all puntual events for a calendar
   * @param file - The excepciones.txt file
   * @param calendarId - The calendar ID to import exceptions for
   * @param userEmail - User email for audit
   * @returns Import result with statistics
   */
  static async importExceptionsOnly(
    file: Express.Multer.File,
    calendarId: string,
    userEmail: string | null
  ) {
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);

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

    // Delete all existing puntual events for this calendar
    const existingEvents = await puntualEventRepo
      .createQueryBuilder('event')
      .leftJoin('event.day', 'day')
      .leftJoin('day.calendar', 'calendar')
      .where('calendar.id = :calendarId', { calendarId })
      .getMany();

    const deletedCount = existingEvents.length;

    if (deletedCount > 0) {
      await puntualEventRepo.remove(existingEvents);
      console.log(`[Import Exceptions] Deleted ${deletedCount} existing puntual events`);
    }

    // Process the exceptions file
    const content = this.decodeFileContent(file);
    const result = await this.processExcepcionesFile(content, courseId, semester, userEmail);

    // Count groups not found
    const groupsNotFound: string[] = [];

    // Re-process to validate groups
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const parts = line.split(':');
        if (parts.length !== 6) continue;

        const [, subjectGroupInfo] = parts.map(p => p.trim());
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

        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym } });
        if (!subject) {
          const groupKey = this.formatGroupKey(subjectAcronym, groupType, groupNumber, language);
          if (!groupsNotFound.includes(groupKey)) {
            groupsNotFound.push(groupKey);
          }
          continue;
        }

        const group = await groupRepo.findOne({
          where: {
            calendar: { id: calendarId },
            number: groupNumber,
            type: groupType,
            language,
            subject: { id: subject.id }
          }
        });

        if (!group) {
          const groupKey = this.formatGroupKey(subjectAcronym, groupType, groupNumber, language);
          if (!groupsNotFound.includes(groupKey)) {
            groupsNotFound.push(groupKey);
          }
        }
      } catch (error) {
        // Continue on error
      }
    }

    return {
      status: 'success',
      message: 'Exceptions imported successfully',
      data: {
        deletedEvents: deletedCount,
        createdEvents: result.processedCount,
        errors: result.errors,
        groupsNotFound,
        totalLines: result.totalLines,
        errorCount: result.errorCount
      }
    };
  }
}
