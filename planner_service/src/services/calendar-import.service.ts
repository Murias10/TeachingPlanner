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
        const groupKey = `${subjectAcronym}.${groupType}.${groupNumber}.${language}`;
        if (!groupPlanifiedHours.has(groupKey)) {
          groupPlanifiedHours.set(groupKey, { hours: [], lines: [] });
        }
        const groupData = groupPlanifiedHours.get(groupKey)!;
        groupData.hours.push(planifiedHours);
        groupData.lines.push(i + 1);
      } catch (error) {
        // Continue on error
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
            number: event.groupNumber,
            type: event.groupType,
            language: event.language,
            subject: { id: subject.id }
          },
          relations: ['subject']
        });

        const groupKey = `${event.subjectAcronym}.${event.groupType}.${event.groupNumber}.${event.language}`;

        if (!group) {
          group = groupRepo.create({
            number: event.groupNumber,
            type: event.groupType,
            language: event.language,
            subject,
            planifiedHours: event.planifiedHours,
            createdBy: userEmail
          });
          await groupRepo.save(group);
        }

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
          } else {
            processedEvents.push({
              subject: event.subjectAcronym,
              groupType: event.groupType,
              groupNumber: event.groupNumber,
              language: event.language,
              action: 'skipped',
              line: event.lineNumber
            });
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
        }
      } catch (error) {
        // Continue on error
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

    return {
      processed: true,
      totalLines: lines.filter(line => line.trim()).length,
      processedCount: processedEvents.length,
      errorCount: errors.length,
      events: processedEvents,
      errors,
      piConflictDetection: conflictReport,
      piSubstitution: substitutionResult
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

        // Obtener entidades necesarias ANTES de procesar cancelaciones
        const dayEntity = await dayRepo.findOne({ where: { calendar: { id: calendar.id }, date } });
        if (!dayEntity) continue;

        const subject = await subjectRepo.findOne({ where: { acronym: subjectAcronym } });
        if (!subject) continue;

        let group = await groupRepo.findOne({ where: { number: groupNumber, type: groupType, language, subject: { id: subject.id } }, relations: ['subject'] });
        if (!group) {
          group = groupRepo.create({ number: groupNumber, type: groupType, language, subject });
          await groupRepo.save(group);
        }

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
          } else {
            processedEvents.push({ date: dateStr, subject: subjectAcronym, action: 'skipped', line: i + 1 });
          }
        } else {
          console.log(`[EXCEPCIONES DEBUG] Creando nuevo evento - cancelled=${cancelled}, startTime=${startTime}, endTime=${endTime}`);
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
}
