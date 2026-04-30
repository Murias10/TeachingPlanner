import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Course } from '@/entities/course.entity';
import { Classroom } from '@/entities/classroom.entity';
import { In } from 'typeorm';
import multer from 'multer';
import { validate as isValidUUID } from 'uuid';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { EventRequest } from '@/entities/event-request.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';
// @ts-ignore - archiver doesn't have type definitions
import archiver from 'archiver';
import { ValidationService } from '@/services/validation.service';
import { CalendarFormattingService } from '@/services/calendar-formatting.service';
import { CalendarRepositoryService } from '@/services/calendar-repository.service';
import { CalendarImportService } from '@/services/calendar-import.service';
import { CalendarEventsService } from '@/services/calendar-events.service';
import { EVENT_CHARACTERS, DAY_CHARACTERS, AVAILABLE_CHARACTERS, MAX_EVENT_TYPES, isStandardCharacter, EVENT_TYPES, isSpecialEventType } from '@/constants/event-characters.constants';
import { esSemanaPar } from '@/utils/calendar-week.utils';
import { getActivePeriodicEventsForDay, findPeriodicEventConflicts, toConflictEntry, GeneratedCalendarEvent } from '@/utils/conflict-detection.utils';

export const getCalendars = async (_req: AuditedRequest, res: Response) => {
    try {
        const calendars = await CalendarRepositoryService.getAllCalendars();
        res.status(200).json({
            status: 'success',
            message: 'Calendars fetched successfully',
            data: { calendars }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendars',
            data: error
        });
    }
};

export const getCalendarById = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!ValidationService.validateUUID(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        const calendar = await CalendarRepositoryService.getCalendarById(id);

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Calendar fetched successfully',
            data: { calendar }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendar',
            data: error
        });
    }
};

export const getCalendarDays = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!ValidationService.validateUUID(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        const dayRepo = AppDataSource.getRepository(Day);
        const days = await dayRepo.find({
            where: { calendar: { id } },
            order: { date: 'ASC' }
        });

        res.status(200).json({
            status: 'success',
            message: 'Calendar days fetched successfully',
            data: days
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendar days',
            data: error
        });
    }
};

export const createCalendar = async (req: AuditedRequest, res: Response) => {
    const { idCourse, semester, start, end, holidays = [] } = req.body;

    // Validaciones
    if (!idCourse) {
        res.status(400).json({
            status: "error",
            message: "Course ID is required",
            data: null,
        });
        return;
    }

    if (!semester) {
        res.status(400).json({
            status: "error",
            message: "Semester is required",
            data: null,
        });
        return;
    }

    if (!start) {
        res.status(400).json({
            status: "error",
            message: "Start date is required",
            data: null,
        });
        return;
    }

    if (!end) {
        res.status(400).json({
            status: "error",
            message: "End date is required",
            data: null,
        });
        return;
    }

    // Parsear fechas en zona horaria de Madrid (Europe/Madrid)
    // Esto evita problemas de conversiÃ³n UTC que pueden cambiar el dÃ­a
    const parseSpainDate = (dateString: string): Date => {
        const parts = dateString.split(/[-T]/);
        if (parts.length >= 3) {
            // Crear fecha a mediodÃ­a en zona horaria de Madrid para evitar cambios de dÃ­a
            const year = Number.parseInt(parts[0]);
            const month = Number.parseInt(parts[1]) - 1;
            const day = Number.parseInt(parts[2]);
            const date = new Date(year, month, day, 12, 0, 0, 0);
            return date;
        }
        // Fallback: aÃ±adir hora del mediodÃ­a para evitar problemas con UTC
        return new Date(dateString + 'T12:00:00');
    };

    const startDate = parseSpainDate(start);
    const endDate = parseSpainDate(end);

    if (startDate >= endDate) {
        res.status(400).json({
            status: "error",
            message: "Start date must be before end date",
            data: null,
        });
        return;
    }

    try {
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const dayRepo = AppDataSource.getRepository(Day);

        // Verificar si ya existe un calendario para el mismo curso y semestre
        const existingCalendar = await calendarRepo.findOne({
            where: {
                course: { id: idCourse },
                semester
            }
        });

        if (existingCalendar) {
            res.status(409).json({
                status: "error",
                message: "Calendar already exists for this course and semester",
                data: {
                    existing: existingCalendar
                },
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);
        const calendar = calendarRepo.create({
            course: { id: idCourse },
            semester,
            start: startDate,
            end: endDate,
            charactersInUse: `${EVENT_CHARACTERS.NORMAL}${EVENT_CHARACTERS.PAR}${EVENT_CHARACTERS.IMPAR}`, // Inicializar con N, P, I
            createdBy: userEmail
        });

        const savedCalendar = await calendarRepo.save(calendar);

        // Crear mapa de fechas festivas con comentarios para bÃºsqueda rÃ¡pida
        const holidayMap = new Map<string, string>();
        (holidays as Array<{ date: string; comment: string }>).forEach((holiday) => {
            const date = parseSpainDate(holiday.date);
            // Formatear como YYYY-MM-DD para comparaciÃ³n
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            holidayMap.set(dateKey, holiday.comment || '');
        });

        // Crear Day records para cada dÃ­a del calendario
        const days: Day[] = [];
        // Crear copias para no modificar las fechas originales
        const startDateNormalized = new Date(startDate);
        startDateNormalized.setHours(0, 0, 0, 0);
        const currentDate = new Date(startDateNormalized);
        const endDateAdjusted = new Date(endDate);
        endDateAdjusted.setHours(0, 0, 0, 0);

        while (currentDate <= endDateAdjusted) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            const dateKey = currentDate.toISOString().split('T')[0];

            // Determinar si es dÃ­a lectivo
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidayMap.has(dateKey);
            const isLective = !isWeekend && !isHoliday;

            // Determinar el carÃ¡cter del dÃ­a
            let dayCharacter = '';
            if (isLective) {
                // DÃ­as lectivos: solo P o I segÃºn semana par/impar (sin N)
                const esPar = esSemanaPar(currentDate, startDateNormalized);
                dayCharacter = esPar ? EVENT_CHARACTERS.PAR : EVENT_CHARACTERS.IMPAR;
            } else {
                // Fines de semana y festivos usan 'F'
                dayCharacter = DAY_CHARACTERS.NON_LECTIVE;
            }

            // Obtener el comentario del dÃ­a festivo si existe
            const holidayComment = holidayMap.get(dateKey) || '';

            const day = dayRepo.create({
                calendar: savedCalendar,
                date: new Date(currentDate),
                lective: isLective,
                dayCharacter,
                comment: holidayComment,
                createdBy: userEmail
            });

            days.push(day);

            // Avanzar al siguiente dÃ­a
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Guardar todos los dÃ­as
        await dayRepo.save(days);


        res.status(201).json({
            status: "success",
            message: "Calendar created successfully",
            data: {
                calendar: savedCalendar,
                daysCreated: days.length,
                lectiveDays: days.filter(d => d.lective).length
            },
        });
    } catch (error) {
        console.error("Error creating calendar:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while creating calendar",
            data: error instanceof Error ? error.message : error,
        });
    }
};

export const deleteCalendar = async (req: AuditedRequest, res: Response) => {
    try {
        const calendarId = req.params.id?.trim();

        // Validar que el ID estÃ© presente
        if (!calendarId) {
            res.status(400).json({
                status: "error",
                message: "Calendar ID is required",
                data: null
            });
            return;
        }

        // Validar que el ID sea un UUID vÃ¡lido
        if (!isValidUUID(calendarId)) {
            res.status(400).json({
                status: "error",
                message: "Invalid UUID format for calendar ID",
                data: null
            });
            return;
        }

        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Verificar si el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id: calendarId }
        });

        if (!calendar) {
            res.status(404).json({
                status: "error",
                message: "Calendar not found",
                data: null
            });
            return;
        }

        // IMPORTANTE: Eliminar eventos ANTES que grupos
        // Las junction tables (PERIODIC_EVENTS_GROUPS, PUNTUAL_EVENTS_GROUPS) tienen
        // ON DELETE NO ACTION en las FK hacia Groups.
        // TypeORM solo limpia automÃ¡ticamente las junction tables cuando eliminas
        // desde el lado del @JoinTable (el lado que "posee" la relaciÃ³n).
        // En este caso, PeriodicEvent y PuntualEvent poseen las relaciones.

        // Paso 1: Eliminar PeriodicEvents del calendario
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const periodicEvents = await periodicEventRepo.find({
            where: { calendar: { id: calendarId } }
        });
        if (periodicEvents.length > 0) {
            await periodicEventRepo.remove(periodicEvents);
        }

        // Paso 2: Eliminar PuntualEvents del calendario (a travÃ©s de Days)
        const dayRepo = AppDataSource.getRepository(Day);
        const days = await dayRepo.find({
            where: { calendar: { id: calendarId } },
            relations: ['puntualEvents']
        });

        let totalPuntualEvents = 0;
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        for (const day of days) {
            if (day.puntualEvents && day.puntualEvents.length > 0) {
                totalPuntualEvents += day.puntualEvents.length;
                await puntualEventRepo.remove(day.puntualEvents);
            }
        }

        // Paso 3: Obtener todos los subjects y sus groups para limpiar junction tables
        const subjectRepo = AppDataSource.getRepository(Subject);
        const subjects = await subjectRepo.find({
            where: { calendar: { id: calendarId } },
            relations: ['groups'],
            select: { id: true, groups: { id: true } }
        });

        const groupIds = subjects.flatMap(s => s.groups.map(g => g.id));

        // Paso 4: Limpiar las tablas junction de los grupos (CRÃTICO)
        // TypeORM no limpia automÃ¡ticamente las junction tables cuando hay ON DELETE NO ACTION
        // Debemos limpiarlas manualmente ANTES de eliminar los groups
        if (groupIds.length > 0) {

            await AppDataSource
                .createQueryBuilder()
                .delete()
                .from('PUNTUAL_EVENTS_GROUPS')
                .where('ID_GROUP IN (:...groupIds)', { groupIds })
                .execute();

            await AppDataSource
                .createQueryBuilder()
                .delete()
                .from('PERIODIC_EVENTS_GROUPS')
                .where('ID_GROUP IN (:...groupIds)', { groupIds })
                .execute();
        }

        // Paso 5: Eliminar subjects (que eliminarÃ¡n grupos en cascada)
        if (subjects.length > 0) {
            await subjectRepo.remove(subjects);
        }

        // Paso 6: Eliminar el calendario
        // La cascada automÃ¡tica eliminarÃ¡: Day (ahora sin eventos), EventRequest, etc.
        await calendarRepo.remove(calendar);


        res.status(200).json({
            status: "success",
            message: "Calendar deleted successfully",
            data: null
        });

    } catch (error) {
        console.error("Error deleting calendar:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error deleting calendar",
            data: error instanceof Error ? error.message : error
        });
    }
};

// Configurar multer para manejar archivos
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB lÃ­mite
    }
});

// Middleware para mÃºltiples archivos
export const uploadFiles = upload.array('files', 10);

// Middleware para un solo archivo
export const uploadSingleFile = upload.single('file');

export const createCalendarWithImport = async (req: AuditedRequest, res: Response) => {
    try {
        const { courseId, semester } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!courseId || !semester) {
            res.status(400).json({
                status: 'error',
                message: 'CourseId and semester are required',
                data: null
            });
            return;
        }

        if (!files || files.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Files are required for import',
                data: null
            });
            return;
        }

        const courseRepo = AppDataSource.getRepository(Course);
        const course = await courseRepo.findOne({ where: { id: courseId } });

        if (!course) {
            res.status(404).json({
                status: 'error',
                message: 'Course not found',
                data: null
            });
            return;
        }

        const calendarFile = files.find(f => f.originalname === 'calendario.txt');

        if (!calendarFile) {
            res.status(400).json({
                status: 'error',
                message: 'calendario.txt is required to create the calendar',
                data: null
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);
        const result = await CalendarImportService.processImportedFiles(files, courseId, parseInt(semester), userEmail);
        const importResult = result.importResult;

        if (!importResult.calendario || !importResult.calendario.processed) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to process calendario.txt',
                data: importResult.calendario
            });
            return;
        }

        res.status(201).json({
            status: 'success',
            message: 'Calendar created successfully with imported data',
            data: {
                calendarId: importResult.calendario.calendarId,
                calendarAction: importResult.calendario.calendarAction,
                startDate: importResult.calendario.startDate,
                endDate: importResult.calendario.endDate,
                importResult: importResult
            }
        });

    } catch (error) {
        console.error('Error creating calendar with import:', error);
        res.status(500).json({
            status: 'error',
            message: 'Unexpected error while creating calendar',
            data: error instanceof Error ? error.message : error
        });
    }
};

export const getCalendarEvents = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidUUID(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        const calendar = await CalendarRepositoryService.getCalendarById(id);

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Obtener dÃ­as lectivos
        const dayRepo = AppDataSource.getRepository(Day);
        const lectiveDays = await dayRepo.find({
            where: { calendar: { id }, lective: true }
        });

        const lectiveDates = lectiveDays.map(day =>
            day.date.toISOString().split('T')[0]
        );

        const allEvents = await CalendarEventsService.generateCalendarEvents(id);

        allEvents.sort((a, b) => {
            const dateCompare = new Date(a.start).getTime() - new Date(b.start).getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });

        res.status(200).json({
            status: 'success',
            message: 'Calendar events fetched successfully',
            data: {
                calendarId: calendar.id,
                semester: calendar.semester,
                startDate: calendar.start.toISOString(),
                endDate: calendar.end.toISOString(),
                totalEvents: allEvents.length,
                events: allEvents,
                lectiveDates: lectiveDates
            }
        });

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendar events',
            data: error instanceof Error ? error.message : error
        });
    }
}

/**
 * Obtiene las solicitudes pendientes de eventos para un calendario como eventos "preview"
 * GET /calendar/:id/pending-requests
 */
export const getPendingRequestsAsEvents = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea un UUID vÃ¡lido
        if (!isValidUUID(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        const calendarRepo = AppDataSource.getRepository(Calendar);
        const eventRequestRepo = AppDataSource.getRepository(EventRequest);
        const dayRepo = AppDataSource.getRepository(Day);

        // Verificar que el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Obtener todas las solicitudes pendientes para este calendario
        const pendingRequests = await eventRequestRepo.find({
            where: {
                calendarId: id,
                status: 'PENDING'
            },
            order: { createdAt: 'DESC' }
        });


        const pendingEvents: any[] = [];

        // Procesar cada solicitud pendiente
        for (const request of pendingRequests) {
            const eventData = request.eventData;

            // --- Solicitudes EDIT / CANCEL / REPLACE: buscar el evento original ---
            if (request.requestType && request.requestType !== 'CREATE' && request.originalEventId) {
                const puntualRepo = AppDataSource.getRepository(PuntualEvent);
                const periodicRepo = AppDataSource.getRepository(PeriodicEvent);

                if (request.eventType === 'PUNTUAL') {
                    const originalEvent = await puntualRepo.findOne({
                        where: { id: request.originalEventId },
                        relations: ['day', 'groups', 'groups.subject', 'classrooms']
                    });

                    if (originalEvent && originalEvent.day) {
                        let displayDate: string;
                        let displayStartTime = originalEvent.startTime;
                        let displayEndTime = originalEvent.endTime;

                        if (request.requestType === 'REPLACE') {
                            displayDate = eventData.newEventDate;
                            displayStartTime = eventData.startTime || displayStartTime;
                            displayEndTime = eventData.endTime || displayEndTime;
                        } else if (request.requestType === 'EDIT') {
                            displayDate = eventData.eventDate || originalEvent.day.date.toISOString().split('T')[0];
                            displayStartTime = eventData.startTime || displayStartTime;
                            displayEndTime = eventData.endTime || displayEndTime;
                        } else {
                            // CANCEL: mostrar en la fecha original
                            displayDate = originalEvent.day.date.toISOString().split('T')[0];
                        }

                        pendingEvents.push({
                            id: `request-${request.id}`,
                            type: 'puntual',
                            comment: eventData.comment || null,
                            ...CalendarFormattingService.formatEventData(
                                originalEvent.groups,
                                originalEvent.classrooms,
                                request,
                                displayStartTime,
                                displayEndTime,
                                new Date(displayDate).toISOString()
                            )
                        });
                    }
                } else if (request.eventType === 'PERIODIC') {
                    const originalEvent = await periodicRepo.findOne({
                        where: { id: request.originalEventId },
                        relations: ['groups', 'groups.subject', 'classrooms']
                    });

                    if (originalEvent) {
                        let displayDate: string | null = null;
                        let displayStartTime = originalEvent.startTime;
                        let displayEndTime = originalEvent.endTime;

                        if (request.requestType === 'REPLACE') {
                            // REPLACE periÃ³dico: mostrar en la nueva fecha
                            displayDate = eventData.newEventDate;
                            displayStartTime = eventData.startTime || displayStartTime;
                            displayEndTime = eventData.endTime || displayEndTime;
                        } else {
                            // EDIT o CANCEL periÃ³dico: mostrar en la primera ocurrencia lectiva del dÃ­a de la semana
                            const targetWeekDay = (request.requestType === 'EDIT' && eventData.weekDay)
                                ? eventData.weekDay
                                : originalEvent.weekDay;

                            if (request.requestType === 'EDIT') {
                                displayStartTime = eventData.startTime || displayStartTime;
                                displayEndTime = eventData.endTime || displayEndTime;
                            }

                            const weekDayMap: { [key: string]: number } = {
                                'D': 0, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6
                            };
                            const targetDayNum = weekDayMap[targetWeekDay?.toUpperCase()];

                            const days = await dayRepo.find({
                                where: { calendar: { id } },
                                order: { date: 'ASC' }
                            });

                            // Encontrar la primera ocurrencia lectiva del dÃ­a objetivo
                            const matchingDay = days.find(day =>
                                day.lective && day.date.getDay() === targetDayNum
                            );

                            if (matchingDay) {
                                displayDate = matchingDay.date.toISOString().split('T')[0];
                            }
                        }

                        if (displayDate) {
                            pendingEvents.push({
                                id: `request-${request.id}`,
                                type: 'periodic',
                                comment: eventData.comment || null,
                                ...CalendarFormattingService.formatEventData(
                                    originalEvent.groups,
                                    originalEvent.classrooms,
                                    request,
                                    displayStartTime,
                                    displayEndTime,
                                    new Date(displayDate).toISOString()
                                )
                            });
                        }
                    }
                }

                continue; // No procesar como CREATE
            }

            // Procesar solicitudes PUNTUALES (CREATE)
            if (request.eventType === 'PUNTUAL') {
                const { eventDate, startTime, endTime, groupIds, classroomIds, comment } = eventData;

                const { groups, classrooms } = await CalendarRepositoryService.fetchGroupsAndClassrooms(groupIds, classroomIds);

                pendingEvents.push({
                    id: `request-${request.id}`,
                    type: 'puntual',
                    comment: comment || null,
                    ...CalendarFormattingService.formatEventData(groups, classrooms, request, startTime, endTime, new Date(eventDate).toISOString())
                });
            }

            // Procesar solicitudes PERIÃ“DICAS
            if (request.eventType === 'PERIODIC') {
                const { startTime, endTime, groupIds, classroomIds, weekDays, frequency, affectedDates } = eventData;

                const { groups, classrooms } = await CalendarRepositoryService.fetchGroupsAndClassrooms(groupIds, classroomIds);

                // Handle custom frequency events (use pre-calculated affectedDates)
                if (frequency === 'custom' && affectedDates && affectedDates.length > 0) {
                    for (const dateStr of affectedDates) {
                        const day = await dayRepo.findOne({
                            where: {
                                date: new Date(dateStr),
                                calendar: { id }
                            }
                        });

                        if (day && day.lective) {
                            pendingEvents.push({
                                id: `request-${request.id}-${dateStr}`,
                                type: 'periodic',
                                ...CalendarFormattingService.formatEventData(groups, classrooms, request, startTime, endTime, day.date.toISOString())
                            });
                        }
                    }
                } else {
                    // Handle standard periodic events (weekly, biweekly-even, biweekly-odd)
                    const days = await dayRepo.find({
                        where: { calendar: { id } },
                        order: { date: 'ASC' }
                    });

                    // Map weekDay letters (L, M, X, J, V, S, D) to JavaScript day numbers
                    const weekDayMap: { [key: string]: number } = {
                        'D': 0, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6
                    };

                    for (const day of days) {
                        if (!day.lective) continue;

                        const dayOfWeek = day.date.getDay(); // 0 = Sunday, 1 = Monday, etc.
                        const matchesWeekDay = weekDays?.some((wd: string) => weekDayMap[wd.toUpperCase()] === dayOfWeek);

                        if (matchesWeekDay) {
                            // For biweekly events, check week parity
                            if (frequency === 'biweekly-even' || frequency === 'biweekly-odd') {
                                const { calcularNumeroSemanaDesdeInicio } = await import('@/utils/calendar-week.utils');
                                const weekNumber = calcularNumeroSemanaDesdeInicio(day.date, calendar.start);
                                const isEvenWeek = weekNumber % 2 === 0;

                                if (frequency === 'biweekly-even' && !isEvenWeek) continue;
                                if (frequency === 'biweekly-odd' && isEvenWeek) continue;
                            }

                            pendingEvents.push({
                                id: `request-${request.id}-${day.date.toISOString().split('T')[0]}`,
                                type: 'periodic',
                                ...CalendarFormattingService.formatEventData(groups, classrooms, request, startTime, endTime, day.date.toISOString())
                            });
                        }
                    }
                }
            }
        }

        // Ordenar eventos por fecha y hora
        pendingEvents.sort((a, b) => {
            const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });


        res.status(200).json({
            status: 'success',
            message: 'Pending request events fetched successfully',
            data: {
                calendarId: calendar.id,
                totalRequests: pendingRequests.length,
                totalEvents: pendingEvents.length,
                events: pendingEvents
            }
        });

    } catch (error) {
        console.error('Error fetching pending request events:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching pending request events',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Convierte formato de hora HH:MM a H.MM (sin ceros a la izquierda en las horas)
 * Ejemplo: "09:30" -> "9.30", "10:00" -> "10.00"
 */
const formatTimeForExport = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hoursInt = parseInt(hours, 10);
    return `${hoursInt}.${minutes}`;
};

/**
 * Exporta un calendario a formato ZIP con archivos TXT
 * GET /calendar/:id/export
 */
export const exportCalendar = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea un UUID vÃ¡lido
        if (!isValidUUID(id)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        const calendarRepo = AppDataSource.getRepository(Calendar);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const classroomRepo = AppDataSource.getRepository(Classroom);
        const subjectRepo = AppDataSource.getRepository(Subject);
        const groupRepo = AppDataSource.getRepository(Group);
        const dayRepo = AppDataSource.getRepository(Day);

        // Obtener el calendario con sus relaciones
        const calendar = await calendarRepo.findOne({
            where: { id },
            relations: ['course', 'course.degree']
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }


        // Obtener todos los eventos periÃ³dicos y puntuales para saber quÃ© aulas se usan
        const periodicEvents = await periodicEventRepo.find({
            where: { calendar: { id } },
            relations: ['classrooms', 'groups', 'groups.subject']
        });

        const puntualEvents = await puntualEventRepo.find({
            where: { day: { calendar: { id } } },
            relations: ['classrooms', 'groups', 'groups.subject', 'day']
        });

        // Recopilar todas las classrooms Ãºnicas usadas en este calendario
        const classroomIds = new Set<string>();

        periodicEvents.forEach(event => {
            event.classrooms.forEach(classroom => {
                classroomIds.add(classroom.id);
            });
        });

        puntualEvents.forEach(event => {
            event.classrooms.forEach(classroom => {
                classroomIds.add(classroom.id);
            });
        });

        // Recopilar todos los IDs de grupos Ãºnicos usados en este calendario
        const groupIds = new Set<string>();

        periodicEvents.forEach(event => {
            event.groups.forEach(group => {
                groupIds.add(group.id);
            });
        });

        puntualEvents.forEach(event => {
            event.groups.forEach(group => {
                groupIds.add(group.id);
            });
        });

        // Obtener los grupos con sus asignaturas para extraer los subject IDs
        let groups: Group[] = [];
        if (groupIds.size > 0) {
            groups = await groupRepo.find({
                where: { id: In(Array.from(groupIds)) },
                relations: ['subject']
            });
        }

        // Recopilar todas las asignaturas Ãºnicas
        const subjectIds = new Set<string>();
        groups.forEach(group => {
            if (group.subject) {
                subjectIds.add(group.subject.id);
            }
        });

        // Obtener las classrooms completas con sus datos
        const classrooms = await classroomRepo.findByIds(Array.from(classroomIds));

        // Obtener TODAS las asignaturas del calendario
        const allSubjectsOfCalendar = await subjectRepo.find({
            where: { calendar: { id: calendar.id } }
        });


        // Generar contenido de ubicaciones.txt
        // Formato: "CÃ³digoAula:URL_GIS" (sin https://, ordenado en orden ascendente por cÃ³digo)
        const ubicacionesContent = classrooms
            .sort((a, b) => a.code.localeCompare(b.code)) // Ordenar ascendente
            .map(classroom => {
                // Remover https:// si existe
                const urlWithoutProtocol = classroom.gisUrl.replace(/^https?:\/\//, '');
                return `${classroom.code}:${urlWithoutProtocol}`;
            })
            .join('\n');

        // Generar contenido de asignaturas.txt
        // Formato: "AcrÃ³nimo:Nombre:AÃ±o:GruposTeoriaES:GruposSeminarioES:GruposLaboratorioES:GruposTeoriaEN:GruposSeminarioEN:GruposLaboratorioEN:GruposTutoriaGrupalES:GruposTutoriaGrupalEN:CÃ³digoSIES"
        // (12 campos, ordenado por acrÃ³nimo ascendente)
        // Contar solo los grupos que participan en eventos del calendario actual
        const asignaturasContent = allSubjectsOfCalendar
            .sort((a: Subject, b: Subject) => a.acronym.localeCompare(b.acronym)) // Ordenar ascendente por acrÃ³nimo
            .map((subject: Subject) => {
                // Obtener los grupos de esta asignatura que participan en eventos del calendario
                const subjectGroups = groups.filter(g => g.subject && g.subject.id === subject.id);

                // Contar grupos Ãºnicos (por nÃºmero) por tipo y lenguaje
                const countByTypeAndLanguage = (type: string, language: string) => {
                    return new Set(
                        subjectGroups
                            .filter(g => g.type === type && g.language === language)
                            .map(g => g.number)
                    ).size;
                };

                const gruposTeoriaES = countByTypeAndLanguage('T', 'ES');
                const gruposSeminarioES = countByTypeAndLanguage('S', 'ES');
                const gruposLaboratorioES = countByTypeAndLanguage('L', 'ES');
                const gruposTeoriaEN = countByTypeAndLanguage('T', 'EN');
                const gruposSeminarioEN = countByTypeAndLanguage('S', 'EN');
                const gruposLaboratorioEN = countByTypeAndLanguage('L', 'EN');
                const gruposTutoriaGrupalES = countByTypeAndLanguage('TG', 'ES');
                const gruposTutoriaGrupalEN = countByTypeAndLanguage('TG', 'EN');

                return `${subject.acronym}:${subject.name}:${subject.year}:${gruposTeoriaES}:${gruposSeminarioES}:${gruposLaboratorioES}:${gruposTeoriaEN}:${gruposSeminarioEN}:${gruposLaboratorioEN}:${gruposTutoriaGrupalES}:${gruposTutoriaGrupalEN}:${subject.siesCode}`;
            })
            .join('\n');

        // Obtener todos los dÃ­as del calendario ordenados por fecha
        const days = await dayRepo.find({
            where: { calendar: { id } },
            order: { date: 'ASC' }
        });

        // Generar contenido de calendario.txt
        // Formato: "DD/MM/YYYY:dayCharacter:comment"
        const calendarioContent = days
            .map(day => {
                // Convertir la fecha a formato DD/MM/YYYY
                const date = new Date(day.date);
                const dayStr = String(date.getDate()).padStart(2, '0');
                const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                const yearStr = date.getFullYear();
                const dateFormatted = `${dayStr}/${monthStr}/${yearStr}`;

                return `${dateFormatted}:${day.dayCharacter}:${day.comment}`;
            })
            .join('\n');

        // Generar contenido de horarios.txt
        // Formato: "Curso:Asignatura.Tipo.Grupo:DÃ­aSemana:HoraComienzo:HoraFin:Aula:SemanasConClase:NÃºmeroTotalHoras"
        // Ordenado primero por year ascendente, luego por acrÃ³nimo de asignatura
        const horariosContent = periodicEvents
            .filter(event => event.eventType === EVENT_TYPES.NORMAL)
            .sort((a, b) => {
                // Primero ordenar por year ascendente
                if (a.year !== b.year) {
                    return a.year - b.year;
                }
                // Dentro del mismo year, ordenar por acrÃ³nimo de asignatura
                // Obtener el primer acrÃ³nimo de cada evento (si tiene grupos)
                const acronymA = a.groups.length > 0 && a.groups[0].subject ? a.groups[0].subject.acronym : '';
                const acronymB = b.groups.length > 0 && b.groups[0].subject ? b.groups[0].subject.acronym : '';
                return acronymA.localeCompare(acronymB);
            })
            .map(event => {
                // Obtener informaciÃ³n de los grupos y aulas asociadas
                const groupsInfo = event.groups.map(group => {
                    const subject = group.subject;
                    const groupTypeMapping: Record<string, string> = {
                        'T': 'T',   // TeorÃ­a
                        'S': 'S',   // Seminario
                        'L': 'L',   // Laboratorio
                        'TG': 'TG'  // TutorÃ­a Grupal
                    };
                    const groupType = groupTypeMapping[group.type] || group.type;
                    const groupNumber = group.language === 'EN' ? `I-${group.number}` : `${group.number}`;
                    return `${subject.acronym}.${groupType}.${groupNumber}`;
                }).join(',');

                // Obtener informaciÃ³n de aulas
                const classroomsInfo = event.classrooms.map(classroom => classroom.code).join(',');

                // Convertir startTime y endTime a formato H.MM (sin ceros a la izquierda)
                const startTimeStr = formatTimeForExport(event.startTime.substring(0, 5));
                const endTimeStr = formatTimeForExport(event.endTime.substring(0, 5));

                // Usar el cÃ³digo del dÃ­a directamente (L, M, X, J, V)
                const dayCode = event.weekDay;

                return `${event.year}:${groupsInfo}:${dayCode}:${startTimeStr}:${endTimeStr}:${classroomsInfo}:${event.eventCharacter}:${event.planifiedHours}`;
            })
            .join('\n');

        // Generar contenido de excepciones.txt
        // Formato: "Fecha:Asignatura.Tipo.Grupo:HoraInicio:HoraFin:Aula:Comentarios"
        // Para cancelados: HoraInicio=-1, HoraFin=HoraReal
        // Organizadas por asignatura (orden alfabÃ©tico), dentro de cada asignatura por fecha ascendente
        // Con lÃ­neas vacÃ­as entre grupos de asignaturas

        // Primero, procesar los eventos en lÃ­neas
        const excepcionesLines = puntualEvents.filter(event => event.eventType === EVENT_TYPES.NORMAL).map(event => {
            // Convertir fecha a formato DD/MM/YYYY
            const date = new Date(event.day.date);
            const dayStr = String(date.getDate()).padStart(2, '0');
            const monthStr = String(date.getMonth() + 1).padStart(2, '0');
            const yearStr = date.getFullYear();
            const dateFormatted = `${dayStr}/${monthStr}/${yearStr}`;

            // Obtener informaciÃ³n de los grupos
            const groupsInfo = event.groups.map(group => {
                const subject = group.subject;
                const groupTypeMapping: Record<string, string> = {
                    'T': 'T',   // TeorÃ­a
                    'S': 'S',   // Seminario
                    'L': 'L',   // Laboratorio
                    'TG': 'TG'  // TutorÃ­a Grupal
                };
                const groupType = groupTypeMapping[group.type] || group.type;
                const groupNumber = group.language === 'EN' ? `I-${group.number}` : `${group.number}`;
                return `${subject.acronym}.${groupType}.${groupNumber}`;
            }).join(',');

            // Obtener informaciÃ³n de aulas
            const classroomsInfo = event.classrooms.map(classroom => classroom.code).join(',');

            // Convertir startTime y endTime a formato H.MM (sin ceros a la izquierda)
            const startTimeStr = formatTimeForExport(event.startTime.substring(0, 5));
            const endTimeStr = formatTimeForExport(event.endTime.substring(0, 5));

            // Determinar formato basado en si estÃ¡ cancelado o no
            let horaInicio: string;
            let horaFin: string;

            if (event.cancelled) {
                // Evento cancelado: HoraInicio=-1, HoraFin=startTime (hora real de inicio)
                horaInicio = '-1';
                horaFin = startTimeStr;
            } else {
                // Evento modificado: HoraInicio y HoraFin normales
                horaInicio = startTimeStr;
                horaFin = endTimeStr;
            }

            // Obtener acrÃ³nimo de asignatura para ordenamiento
            const acronym = event.groups.length > 0 && event.groups[0].subject ? event.groups[0].subject.acronym : '';
            const dateTimestamp = new Date(event.day.date).getTime();

            return {
                acronym,
                dateTimestamp,
                line: `${dateFormatted}:${groupsInfo}:${horaInicio}:${horaFin}:${classroomsInfo}:${event.comment}`
            };
        });

        // Ordenar por acrÃ³nimo de asignatura, luego por fecha
        excepcionesLines.sort((a, b) => {
            const acronymCompare = a.acronym.localeCompare(b.acronym);
            if (acronymCompare !== 0) {
                return acronymCompare;
            }
            return a.dateTimestamp - b.dateTimestamp;
        });

        // Agrupar por acrÃ³nimo y agregar lÃ­neas vacÃ­as entre grupos
        const excepcionesContent = excepcionesLines
            .reduce((acc: string[], current, index) => {
                if (index > 0 && excepcionesLines[index - 1].acronym !== current.acronym) {
                    // Agregar lÃ­nea vacÃ­a al cambiar de asignatura
                    acc.push('');
                }
                acc.push(current.line);
                return acc;
            }, [])
            .join('\n');

        // Crear nombre del archivo ZIP
        // Formato: "degreeAcronym courseStartYear-courseEndYear scalendarSemester"
        const degreeAcronym = calendar.course.degree.acronym;
        const courseStartYear = calendar.course.startYear;
        const courseEndYear = calendar.course.endYear;
        const semester = calendar.semester;
        const zipFilename = `${degreeAcronym} ${courseStartYear}-${courseEndYear} s${semester}.zip`;


        // Configurar headers para la descarga
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

        // Crear el archivo ZIP
        const archive = archiver('zip', {
            zlib: { level: 9 } // Nivel mÃ¡ximo de compresiÃ³n
        });

        // Manejar errores del archiver
        archive.on('error', (err: any) => {
            console.error('Error creating archive:', err);
            res.status(500).json({
                status: 'error',
                message: 'Error creating export file',
                data: err.message
            });
        });

        // Pipe del archive a la response
        archive.pipe(res);

        // Agregar ubicaciones.txt al ZIP (UTF-8)
        archive.append(ubicacionesContent, { name: 'ubicaciones.txt' });

        // Agregar asignaturas.txt al ZIP (UTF-8)
        archive.append(asignaturasContent, { name: 'asignaturas.txt' });

        // Agregar calendario.txt al ZIP (UTF-8)
        archive.append(calendarioContent, { name: 'calendario.txt' });

        // Agregar horarios.txt al ZIP (UTF-8)
        archive.append(horariosContent, { name: 'horarios.txt' });

        // Agregar excepciones.txt al ZIP (UTF-8)
        archive.append(excepcionesContent, { name: 'excepciones.txt' });

        // Finalizar el archivo
        await archive.finalize();


    } catch (error) {
        console.error('Error exporting calendar:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error exporting calendar',
            data: error instanceof Error ? error.message : error
        });
    }
};


/**
 * Helper function to build a cancellation index from cancelled puntual events
 * This follows the same logic as CalendarEventsService.construirIndiceCanceladosEventos
 * @param cancelledEvents - Array of cancelled puntual events
 * @param eventDate - The date to create keys for
 * @returns Set of cancellation keys
 */
function buildCancellationIndex(cancelledEvents: PuntualEvent[], eventDate: Date): Set<string> {
    const index = new Set<string>();
    const dateStr = eventDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    for (const cancelledEvent of cancelledEvents) {
        if (cancelledEvent.eventType === EVENT_TYPES.BLOCKER) {
            // BLOCKER events are indexed by classroom
            for (const classroom of cancelledEvent.classrooms || []) {
                const key = `aula_${classroom.id}_${dateStr}_${cancelledEvent.startTime}`;
                index.add(key);
            }
        } else {
            // Other events are indexed by group
            for (const group of cancelledEvent.groups || []) {
                const key = `${group.id}_${dateStr}_${cancelledEvent.startTime}`;
                index.add(key);
            }
        }
    }

    return index;
}

/**
 * Helper function to check if a periodic event is cancelled by a puntual event
 * This follows the same logic as CalendarEventsService.tieneConflictoCancelacion
 * @param periodicEvent - The periodic event to check
 * @param cancellationIndex - Index of cancelled event keys
 * @param eventDate - The date to check
 * @returns true if the periodic event is cancelled
 */
function isPeriodicEventCancelled(
    periodicEvent: PeriodicEvent,
    cancellationIndex: Set<string>,
    eventDate: Date
): boolean {
    const dateStr = eventDate.toISOString().split('T')[0];

    if (periodicEvent.eventType === EVENT_TYPES.BLOCKER) {
        // BLOCKER events are checked by classroom
        return periodicEvent.classrooms?.some(classroom => {
            const key = `aula_${classroom.id}_${dateStr}_${periodicEvent.startTime}`;
            return cancellationIndex.has(key);
        }) || false;
    }

    // Other events are checked by group
    return periodicEvent.groups?.some(group => {
        const key = `${group.id}_${dateStr}_${periodicEvent.startTime}`;
        return cancellationIndex.has(key);
    }) || false;
}

/**
 * Returns the periodic events that actually materialize on a specific day,
 * delegating entirely to CalendarEventsService.generateCalendarEvents which
 * already handles N (round-robin), non-N (character matching), hour budgets,
 * and cancellations correctly.
 */

export const createPuntualEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId, eventDate, startTime, endTime, subjectId, groupIds = [], classroomIds = [], comment = '', cancelled = false, eventType = EVENT_TYPES.NORMAL, periodicEventSourceId = null } = req.body;

        // Validaciones
        if (!calendarId || !eventDate || !startTime || !endTime) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: calendarId, eventDate, startTime, endTime',
                data: null
            });
            return;
        }

        const dayRepo = AppDataSource.getRepository(Day);
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const groupRepo = AppDataSource.getRepository(Group);
        const classroomRepo = AppDataSource.getRepository(Classroom);

        // Verificar que el calendario existe
        const calendar = await AppDataSource.getRepository(Calendar).findOne({
            where: { id: calendarId }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Validar que la fecha estÃ© dentro del rango del calendario
        // Normalizar todas las fechas a medianoche para comparaciÃ³n justa
        const eventDateObj = new Date(eventDate);
        eventDateObj.setHours(0, 0, 0, 0);

        const calendarStartDate = new Date(calendar.start);
        calendarStartDate.setHours(0, 0, 0, 0);

        const calendarEndDate = new Date(calendar.end);
        calendarEndDate.setHours(0, 0, 0, 0);

        if (eventDateObj < calendarStartDate || eventDateObj > calendarEndDate) {
            res.status(400).json({
                status: 'error',
                message: `Event date must be between ${calendar.start.toISOString().split('T')[0]} and ${calendar.end.toISOString().split('T')[0]}`,
                data: null
            });
            return;
        }

        // Buscar el dÃ­a (no crear uno nuevo)
        let day = await dayRepo.findOne({
            where: {
                date: eventDateObj,
                calendar: { id: calendarId }
            },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.groups.subject', 'puntualEvents.classrooms']
        });

        // Si el dÃ­a no existe, no se puede crear el evento
        if (!day) {
            res.status(400).json({
                status: 'error',
                message: 'The selected date does not exist in the calendar. Events can only be created on existing calendar days.',
                data: null
            });
            return;
        }

        // Validar que el dÃ­a sea un dÃ­a lectivo
        if (!day.lective) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot create events on non-lective days. Please select a lective day.',
                data: null
            });
            return;
        }

        // Skip conflict detection for cancelled puntual events.
        // A cancelled puntual event is just a "blocker" for a periodic event on that day;
        // it does not occupy any active slot, so it cannot conflict with anything.
        if (!cancelled) {
            // ValidaciÃ³n de conflictos: verificar si hay eventos en el mismo horario con el mismo grupo o aula

            // Helper to normalize time format (HH:mm:ss -> HH:mm or HH:mm -> HH:mm)
            const normalizeTime = (time: string) => time.substring(0, 5);

            // Check conflicts with puntual events (excluding cancelled events)
            const conflictingPuntualEvents = day.puntualEvents?.filter(event => {
                // Skip cancelled events - they block periodic events but don't block new puntual events
                if (event.cancelled) return false;

                // Normalize times to HH:mm format for proper comparison
                const eventStart = normalizeTime(event.startTime);
                const eventEnd = normalizeTime(event.endTime);
                const newStart = normalizeTime(startTime);
                const newEnd = normalizeTime(endTime);

                const hasTimeOverlap = newStart < eventEnd && newEnd > eventStart;

                if (!hasTimeOverlap) return false;

                // Verificar si comparte grupo (solo si ambos lados tienen grupo; BLOCKER no tiene grupo)
                const sharesGroup = eventType !== EVENT_TYPES.BLOCKER && event.eventType !== EVENT_TYPES.BLOCKER && event.groups?.some(g => groupIds.includes(g.id));
                // Verificar si comparte aula
                const sharesClassroom = event.classrooms?.some(c => classroomIds.includes(c.id));

                // Conflicto si comparte grupo O aula (no necesita compartir ambos)
                return sharesGroup || sharesClassroom;
            });


            // Check conflicts with active periodic events (excluding cancelled ones)
            const periodicEvents = await getActivePeriodicEventsForDay(calendarId, day.id, eventDateObj, day.dayCharacter);

            const conflictingPeriodicEvents = findPeriodicEventConflicts(
                startTime,
                endTime,
                groupIds,
                classroomIds,
                periodicEvents,
                eventType
            );


            // Combine all conflicts
            const totalConflicts = (conflictingPuntualEvents?.length || 0) + conflictingPeriodicEvents.length;

            if (totalConflicts > 0) {
                // Determine the type of conflict from the first one found
                const firstConflict = conflictingPuntualEvents && conflictingPuntualEvents.length > 0
                    ? conflictingPuntualEvents[0]
                    : conflictingPeriodicEvents[0];

                const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                                   firstConflict.eventType !== EVENT_TYPES.BLOCKER &&
                                   firstConflict.groups?.some(g => groupIds.includes(g.id));
                const sharesClassroom = firstConflict.classrooms?.some(c => classroomIds.includes(c.id));

                let conflictMessage = 'alerts.puntualEvent.error.shared_both';
                if (sharesGroup && !sharesClassroom) {
                    conflictMessage = 'alerts.puntualEvent.error.shared_group';
                } else if (!sharesGroup && sharesClassroom) {
                    conflictMessage = 'alerts.puntualEvent.error.shared_classroom';
                }

                res.status(409).json({
                    status: 'error',
                    message: conflictMessage,
                    data: {
                        conflicts: [
                            ...(conflictingPuntualEvents?.map(e => ({
                                id: e.id,
                                startTime: e.startTime,
                                endTime: e.endTime,
                                type: 'puntual',
                                groupNames: e.groups?.filter(g => groupIds.includes(g.id)).map(g => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                                classroomNames: e.classrooms?.filter(c => classroomIds.includes(c.id)).map(c => c.code) ?? []
                            })) || []),
                            ...conflictingPeriodicEvents.map(e => ({
                                id: e.id,
                                startTime: e.startTime,
                                endTime: e.endTime,
                                type: 'periodic' as const,
                                groupNames: e.groups?.filter(g => groupIds.includes(g.id)).map(g => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                                classroomNames: e.classrooms?.filter(c => classroomIds.includes(c.id)).map(c => c.code) ?? []
                            }))
                        ]
                    }
                });
                return;
            }
        }

        // Obtener los grupos y validar que pertenezcan al calendario
        const groups = groupIds.length > 0
            ? await groupRepo.find({
                where: {
                    id: In(groupIds),
                    calendar: { id: calendarId }
                }
            })
            : [];

        // Validar que se encontraron todos los grupos solicitados
        if (groupIds.length > 0 && groups.length !== groupIds.length) {
            res.status(400).json({
                status: 'error',
                message: 'Some groups do not belong to this calendar or do not exist',
                data: null
            });
            return;
        }

        // Obtener las aulas
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // Crear el evento puntual
        const puntualEvent = puntualEventRepo.create({
            day: day,
            startTime: startTime,
            endTime: endTime,
            cancelled: cancelled,
            comment: comment || '',
            eventType: eventType,
            groups: groups,
            classrooms: classrooms,
            createdBy: userEmail,
            periodicEventSourceId: cancelled ? (periodicEventSourceId ?? null) : null,
        });

        const savedEvent = await puntualEventRepo.save(puntualEvent);

        res.status(201).json({
            status: 'success',
            message: 'Puntual event created successfully',
            data: {
                event: savedEvent
            }
        });

    } catch (error) {
        console.error('Error creating puntual event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating puntual event',
            data: error instanceof Error ? error.message : error
        });
    }
};

export const deletePuntualEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { eventId } = req.params;

        // Validaciones
        if (!eventId) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required field: eventId',
                data: null
            });
            return;
        }

        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const dayRepo = AppDataSource.getRepository(Day);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

        // Buscar el evento puntual cancelado con sus relaciones usando QueryBuilder para asegurar las relaciones
        const puntualEvent = await puntualEventRepo
            .createQueryBuilder('pe')
            .leftJoinAndSelect('pe.day', 'day')
            .leftJoinAndSelect('day.calendar', 'calendar')
            .leftJoinAndSelect('pe.groups', 'groups')
            .leftJoinAndSelect('groups.subject', 'subject')
            .leftJoinAndSelect('pe.classrooms', 'classrooms')
            .where('pe.id = :eventId', { eventId })
            .getOne();

        if (!puntualEvent) {
            res.status(404).json({
                status: 'error',
                message: 'Puntual event not found',
                data: null
            });
            return;
        }

        // VALIDACIÃ“N: Si es un evento cancelado simple, verificar que revertirlo no cause conflictos
        // Al eliminar el evento cancelado, podrÃ­a reaparecer un evento periÃ³dico en su lugar.
        // Debemos validar que no exista otro evento puntual con el mismo grupo/aula en ese horario.
        if (puntualEvent.cancelled && !puntualEvent.replacementEventId) {

            // Cargar el dÃ­a con todos sus eventos puntuales
            const day = await dayRepo
                .createQueryBuilder('day')
                .leftJoinAndSelect('day.puntualEvents', 'pe')
                .leftJoinAndSelect('pe.groups', 'groups')
                .leftJoinAndSelect('groups.subject', 'subject')
                .leftJoinAndSelect('pe.classrooms', 'classrooms')
                .where('day.id = :dayId', { dayId: puntualEvent.day.id })
                .getOne();

            if (day) {

                const normalizeTime = (time: string) => time.substring(0, 5);
                const cancelledStart = normalizeTime(puntualEvent.startTime);
                const cancelledEnd = normalizeTime(puntualEvent.endTime);

                // Buscar eventos puntuales no cancelados que tendrÃ­an conflicto
                const conflictingEvents = day.puntualEvents?.filter(pe => {
                    // Excluir el evento cancelado que estamos por eliminar
                    if (pe.id === eventId) {
                        return false;
                    }
                    // Solo eventos normales (no cancelados)
                    if (pe.cancelled) {
                        return false;
                    }

                    // Verificar solapamiento de tiempo
                    const peStart = normalizeTime(pe.startTime);
                    const peEnd = normalizeTime(pe.endTime);
                    const hasTimeOverlap = peStart < cancelledEnd && peEnd > cancelledStart;

                    if (!hasTimeOverlap) {
                        return false;
                    }

                    // Verificar si comparte grupo
                    const sharedGroups = pe.groups?.filter(peg =>
                        puntualEvent.groups?.some(cg => cg.id === peg.id)
                    );
                    const sharesGroup = (sharedGroups?.length || 0) > 0;

                    // Verificar si comparte aula
                    const sharedClassrooms = pe.classrooms?.filter(pec =>
                        puntualEvent.classrooms?.some(cc => cc.id === pec.id)
                    );
                    const sharesClassroom = (sharedClassrooms?.length || 0) > 0;

                    if (sharesGroup) {
                    }
                    if (sharesClassroom) {
                    }

                    return sharesGroup || sharesClassroom;
                });

                if (conflictingEvents && conflictingEvents.length > 0) {

                    const firstConflict = conflictingEvents[0];
                    const conflictGroups = puntualEvent.groups?.filter(cg =>
                        firstConflict.groups?.some(fg => fg.id === cg.id)
                    ).map(g => `${g.subject.acronym}.${g.type}.${g.number}`) || [];

                    const conflictClassrooms = puntualEvent.classrooms?.filter(cc =>
                        firstConflict.classrooms?.some(fc => fc.id === cc.id)
                    ).map(c => c.code) || [];

                    // Determinar el tipo de conflicto y enviar datos para i18n
                    let messageKey: string;
                    let conflictData: { groups?: string; classrooms?: string };

                    if (conflictGroups.length > 0) {
                        messageKey = 'calendar.alerts.revert.error.groupConflict';
                        conflictData = { groups: conflictGroups.join(', ') };
                    } else {
                        messageKey = 'calendar.alerts.revert.error.classroomConflict';
                        conflictData = { classrooms: conflictClassrooms.join(', ') };
                    }


                    res.status(409).json({
                        status: 'error',
                        message: messageKey,
                        data: conflictData
                    });
                    return;
                }

                // Check conflicts with active periodic events on that day
                const calendarId = puntualEvent.day.calendar.id;
                const eventDateObj = new Date(day.date);
                const cancelledGroupIds = puntualEvent.groups?.map(g => g.id) || [];
                const cancelledClassroomIds = puntualEvent.classrooms?.map(c => c.id) || [];

                const activePeriodicEvents = await getActivePeriodicEventsForDay(
                    calendarId,
                    day.id,
                    eventDateObj,
                    day.dayCharacter
                );

                const conflictingPeriodicEvents = findPeriodicEventConflicts(
                    puntualEvent.startTime,
                    puntualEvent.endTime,
                    cancelledGroupIds,
                    cancelledClassroomIds,
                    activePeriodicEvents,
                    puntualEvent.eventType
                );

                if (conflictingPeriodicEvents.length > 0) {

                    const firstPeriodicConflict = conflictingPeriodicEvents[0];
                    const conflictPeriodicGroups = puntualEvent.groups?.filter(cg =>
                        firstPeriodicConflict.groups?.some(fg => fg.id === cg.id)
                    ).map(g => `${g.subject.acronym}.${g.type}.${g.number}`) || [];

                    const conflictPeriodicClassrooms = puntualEvent.classrooms?.filter(cc =>
                        firstPeriodicConflict.classrooms?.some(fc => fc.id === cc.id)
                    ).map(c => c.code) || [];

                    let periodicMessageKey: string;
                    let periodicConflictData: { groups?: string; classrooms?: string };

                    if (conflictPeriodicGroups.length > 0) {
                        periodicMessageKey = 'calendar.alerts.revert.error.groupConflict';
                        periodicConflictData = { groups: conflictPeriodicGroups.join(', ') };
                    } else {
                        periodicMessageKey = 'calendar.alerts.revert.error.classroomConflict';
                        periodicConflictData = { classrooms: conflictPeriodicClassrooms.join(', ') };
                    }


                    res.status(409).json({
                        status: 'error',
                        message: periodicMessageKey,
                        data: periodicConflictData
                    });
                    return;
                }

            }
        }

        // Verificar si tiene evento de reemplazo vinculado
        const hasReplacement = puntualEvent.replacementEventId !== null
                            && puntualEvent.replacementEventId !== undefined;

        if (hasReplacement) {
            // CASO 2: Evento cancelado con reemplazo - borrar ambos eventos

            // Buscar el evento de reemplazo
            const replacementEvent = await puntualEventRepo.findOne({
                where: { id: puntualEvent.replacementEventId! }
            });

            if (!replacementEvent) {
                console.warn(`[Revert Cancellation] Replacement event ${puntualEvent.replacementEventId} not found, deleting cancelled event only`);
            }

            // Usar transacciÃ³n para borrar ambos eventos atÃ³micamente
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // Auto-reject pending requests referencing this event
                const eventRequestRepo = queryRunner.manager.getRepository(EventRequest);
                const pendingRequests = await eventRequestRepo.find({
                    where: { originalEventId: eventId, status: 'PENDING' },
                });
                const userEmailForReject = getUserEmailFromRequest(req);
                for (const request of pendingRequests) {
                    request.status = 'REJECTED';
                    request.reviewedBy = userEmailForReject;
                    request.reviewedAt = new Date();
                    request.comments = 'El evento original fue eliminado por el administrador';
                    request.updatedBy = userEmailForReject;
                    request.updatedAt = new Date();
                    await queryRunner.manager.save(request);
                }

                // Borrar evento cancelado
                await queryRunner.manager.remove(puntualEvent);

                // Borrar evento de reemplazo (si existe)
                if (replacementEvent) {
                    await queryRunner.manager.remove(replacementEvent);
                }

                await queryRunner.commitTransaction();

                res.status(200).json({
                    status: 'success',
                    message: 'Cancelled event and replacement reverted successfully',
                    data: {
                        deletedCancelledEventId: eventId,
                        deletedReplacementEventId: puntualEvent.replacementEventId
                    }
                });

            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }

        } else {
            // CASO 1: Evento cancelado aislado (sin reemplazo) - borrar solo el cancelado

            const userEmail = getUserEmailFromRequest(req);

            await AppDataSource.transaction(async (manager) => {
                // Auto-reject pending requests referencing this event
                const eventRequestRepo = manager.getRepository(EventRequest);
                const pendingRequests = await eventRequestRepo.find({
                    where: { originalEventId: eventId, status: 'PENDING' },
                });
                for (const request of pendingRequests) {
                    request.status = 'REJECTED';
                    request.reviewedBy = userEmail;
                    request.reviewedAt = new Date();
                    request.comments = 'El evento original fue eliminado por el administrador';
                    request.updatedBy = userEmail;
                    request.updatedAt = new Date();
                    await manager.save(request);
                }

                puntualEvent.updatedBy = userEmail;
                puntualEvent.updatedAt = new Date();
                await manager.save(puntualEvent);

                await manager.remove(puntualEvent);
            });


            res.status(200).json({
                status: 'success',
                message: 'Standalone cancelled event deleted successfully',
                data: {
                    deletedCancelledEventId: eventId
                }
            });
        }

    } catch (error) {
        console.error('Error reverting cancellation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error reverting cancellation',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Delete a periodic event series
 * Deletes the PeriodicEvent record from the database
 */
export const deletePeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { eventId } = req.params;

        // Validations
        if (!eventId) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required field: eventId',
                data: null
            });
            return;
        }

        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

        // Find the periodic event with calendar relation
        const periodicEvent = await periodicEventRepo.findOne({
            where: { id: eventId },
            relations: ['groups', 'calendar']
        });

        if (!periodicEvent) {
            res.status(404).json({
                status: 'error',
                message: 'Periodic event not found',
                data: null
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);

        // Use transaction to ensure atomicity
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            // Set updatedBy and updatedAt before deleting
            periodicEvent.updatedBy = userEmail;
            periodicEvent.updatedAt = new Date();
            await transactionalEntityManager.save(periodicEvent);

            // Get data before deleting
            const groupsToCheck = periodicEvent.groups;
            const eventCharacter = periodicEvent.eventCharacter;
            const calendarId = periodicEvent.calendar.id;

            // Auto-reject pending requests referencing this event
            const eventRequestRepo = transactionalEntityManager.getRepository(EventRequest);
            const pendingRequests = await eventRequestRepo.find({
                where: { originalEventId: eventId, status: 'PENDING' },
            });
            for (const request of pendingRequests) {
                request.status = 'REJECTED';
                request.reviewedBy = userEmail;
                request.reviewedAt = new Date();
                request.comments = 'El evento original fue eliminado por el administrador';
                request.updatedBy = userEmail;
                request.updatedAt = new Date();
                await transactionalEntityManager.save(request);
            }

            // Delete the periodic event
            await transactionalEntityManager.remove(periodicEvent);

            // Check if this was the last PeriodicEvent for each group (solo NORMAL actualiza planifiedHours)
            if (periodicEvent.eventType === EVENT_TYPES.NORMAL) for (const group of groupsToCheck) {
                const remainingPeriodicEvents = await transactionalEntityManager
                    .createQueryBuilder(PeriodicEvent, 'event')
                    .leftJoinAndSelect('event.groups', 'group')
                    .where('group.id = :groupId', { groupId: group.id })
                    .getCount();

                // If no more PeriodicEvents exist for this group, set planifiedHours to 0
                if (remainingPeriodicEvents === 0) {
                    group.planifiedHours = 0;
                    group.updatedBy = userEmail;
                    group.updatedAt = new Date();
                    await transactionalEntityManager.save(group);
                }
            }

            // CHARACTER CLEANUP: Only for custom periodic events (not N, P, I, F)
            if (eventCharacter && !isStandardCharacter(eventCharacter) && eventCharacter !== DAY_CHARACTERS.NON_LECTIVE) {
                // Check if there are any remaining events with the same character
                const remainingEventsWithCharacter = await transactionalEntityManager
                    .createQueryBuilder(PeriodicEvent, 'event')
                    .leftJoin('event.calendar', 'calendar')
                    .where('calendar.id = :calendarId', { calendarId })
                    .andWhere('event.eventCharacter = :eventCharacter', { eventCharacter })
                    .getCount();

                // If this was the last event using this character, clean it up
                if (remainingEventsWithCharacter === 0) {

                    // 1. Remove character from Calendar.charactersInUse
                    const calendar = await transactionalEntityManager.findOne(Calendar, {
                        where: { id: calendarId }
                    });

                    if (calendar && calendar.charactersInUse) {
                        const updatedCharactersInUse = calendar.charactersInUse
                            .split('')
                            .filter(char => char !== eventCharacter)
                            .join('');

                        calendar.charactersInUse = updatedCharactersInUse;
                        calendar.updatedBy = userEmail;
                        calendar.updatedAt = new Date();
                        await transactionalEntityManager.save(calendar);

                    }

                    // 2. Remove character from Day.dayCharacter for all days in this calendar
                    const daysWithCharacter = await transactionalEntityManager
                        .createQueryBuilder(Day, 'day')
                        .leftJoin('day.calendar', 'calendar')
                        .where('calendar.id = :calendarId', { calendarId })
                        .andWhere('day.dayCharacter LIKE :pattern', { pattern: `%${eventCharacter}%` })
                        .getMany();

                    for (const day of daysWithCharacter) {
                        const updatedDayCharacter = day.dayCharacter
                            .split('')
                            .filter(char => char !== eventCharacter)
                            .join('');

                        day.dayCharacter = updatedDayCharacter;
                        day.updatedBy = userEmail;
                        day.updatedAt = new Date();
                        await transactionalEntityManager.save(day);
                    }

                }
            }
        });


        res.status(200).json({
            status: 'success',
            message: 'Periodic event series deleted successfully',
            data: null
        });

    } catch (error) {
        console.error('Error deleting periodic event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting periodic event',
            data: error instanceof Error ? error.message : error
        });
    }
};

export const updatePuntualEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { eventId } = req.params;
        const { eventDate, startTime, endTime, subjectId, groupIds = [], classroomIds = [], comment = '', eventType = EVENT_TYPES.NORMAL } = req.body;

        // Validaciones
        if (!eventId || !eventDate || !startTime || !endTime) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: eventId, eventDate, startTime, endTime',
                data: null
            });
            return;
        }

        const dayRepo = AppDataSource.getRepository(Day);
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const groupRepo = AppDataSource.getRepository(Group);
        const classroomRepo = AppDataSource.getRepository(Classroom);

        // Buscar el evento puntual existente
        const puntualEvent = await puntualEventRepo.findOne({
            where: { id: eventId },
            relations: ['day', 'day.calendar', 'groups', 'classrooms']
        });

        if (!puntualEvent) {
            res.status(404).json({
                status: 'error',
                message: 'Puntual event not found',
                data: null
            });
            return;
        }

        const calendar = puntualEvent.day.calendar;
        const eventDateObj = new Date(eventDate);
        eventDateObj.setHours(0, 0, 0, 0);

        // Validar que la nueva fecha estÃ© dentro del rango del calendario
        const calendarStartDate = new Date(calendar.start);
        calendarStartDate.setHours(0, 0, 0, 0);

        const calendarEndDate = new Date(calendar.end);
        calendarEndDate.setHours(0, 0, 0, 0);

        if (eventDateObj < calendarStartDate || eventDateObj > calendarEndDate) {
            res.status(400).json({
                status: 'error',
                message: `Event date must be between ${calendar.start.toISOString().split('T')[0]} and ${calendar.end.toISOString().split('T')[0]}`,
                data: null
            });
            return;
        }

        // Buscar el dÃ­a de la nueva fecha
        let newDay = await dayRepo.findOne({
            where: {
                date: eventDateObj,
                calendar: { id: calendar.id }
            },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.groups.subject', 'puntualEvents.classrooms']
        });

        if (!newDay) {
            res.status(400).json({
                status: 'error',
                message: 'The selected date does not exist in the calendar',
                data: null
            });
            return;
        }

        // Validar que el dÃ­a sea lectivo
        if (!newDay.lective) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot update event to a non-lective day',
                data: null
            });
            return;
        }

        // ValidaciÃ³n de conflictos (excluyendo el evento actual)

        // Helper to normalize time format (HH:mm:ss -> HH:mm or HH:mm -> HH:mm)
        const normalizeTime = (time: string) => time.substring(0, 5);

        // Check conflicts with other puntual events (excluding the event being updated and cancelled events)
        const conflictingPuntualEvents = newDay.puntualEvents?.filter(event => {
            if (event.id === eventId) return false; // Excluir el evento actual
            if (event.cancelled) return false; // Excluir eventos cancelados

            // Normalize times to HH:mm format for proper comparison
            const eventStart = normalizeTime(event.startTime);
            const eventEnd = normalizeTime(event.endTime);
            const newStart = normalizeTime(startTime);
            const newEnd = normalizeTime(endTime);

            const hasTimeOverlap = newStart < eventEnd && newEnd > eventStart;

            if (!hasTimeOverlap) return false;

            const sharesGroup = eventType !== EVENT_TYPES.BLOCKER && event.eventType !== EVENT_TYPES.BLOCKER && event.groups?.some(g => groupIds.includes(g.id));
            const sharesClassroom = event.classrooms?.some(c => classroomIds.includes(c.id));

            // Conflicto si comparte grupo O aula (no necesita compartir ambos)
            return sharesGroup || sharesClassroom;
        });


        // Check conflicts with active periodic events (excluding cancelled ones)
        const periodicEvents = await getActivePeriodicEventsForDay(calendar.id, newDay.id, eventDateObj, newDay.dayCharacter);

        const conflictingPeriodicEvents = findPeriodicEventConflicts(
            startTime,
            endTime,
            groupIds,
            classroomIds,
            periodicEvents,
            eventType
        );


        // Combine all conflicts
        const totalConflicts = (conflictingPuntualEvents?.length || 0) + conflictingPeriodicEvents.length;

        if (totalConflicts > 0) {
            // Determine the type of conflict from the first one found
            const firstConflict = conflictingPuntualEvents && conflictingPuntualEvents.length > 0
                ? conflictingPuntualEvents[0]
                : conflictingPeriodicEvents[0];

            const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                               firstConflict.eventType !== EVENT_TYPES.BLOCKER &&
                               firstConflict.groups?.some(g => groupIds.includes(g.id));
            const sharesClassroom = firstConflict.classrooms?.some(c => classroomIds.includes(c.id));

            let conflictMessage = 'alerts.puntualEvent.error.shared_both';
            if (sharesGroup && !sharesClassroom) {
                conflictMessage = 'alerts.puntualEvent.error.shared_group';
            } else if (!sharesGroup && sharesClassroom) {
                conflictMessage = 'alerts.puntualEvent.error.shared_classroom';
            }

            res.status(409).json({
                status: 'error',
                message: conflictMessage,
                data: {
                    conflicts: [
                        ...(conflictingPuntualEvents?.map(e => ({
                            id: e.id,
                            startTime: e.startTime,
                            endTime: e.endTime,
                            type: 'puntual',
                            groupNames: e.groups?.filter(g => groupIds.includes(g.id)).map(g => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                            classroomNames: e.classrooms?.filter(c => classroomIds.includes(c.id)).map(c => c.code) ?? []
                        })) || []),
                        ...conflictingPeriodicEvents.map(e => ({
                            id: e.id,
                            startTime: e.startTime,
                            endTime: e.endTime,
                            type: 'periodic',
                            groupNames: e.groups?.filter((g: any) => groupIds.includes(g.id)).map((g: any) => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                            classroomNames: e.classrooms?.filter((c: any) => classroomIds.includes(c.id)).map((c: any) => c.code) ?? []
                        }))
                    ]
                }
            });
            return;
        }

        // Obtener los nuevos grupos y validar que pertenezcan al calendario
        const groups = groupIds.length > 0
            ? await groupRepo.find({
                where: {
                    id: In(groupIds),
                    calendar: { id: calendar.id }
                }
            })
            : [];

        // Validar que se encontraron todos los grupos solicitados
        if (groupIds.length > 0 && groups.length !== groupIds.length) {
            res.status(400).json({
                status: 'error',
                message: 'Some groups do not belong to this calendar or do not exist',
                data: null
            });
            return;
        }

        // Obtener las nuevas aulas
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // Actualizar el evento puntual
        puntualEvent.day = newDay;
        puntualEvent.startTime = startTime;
        puntualEvent.endTime = endTime;
        puntualEvent.comment = comment || '';
        puntualEvent.groups = groups;
        puntualEvent.classrooms = classrooms;
        puntualEvent.eventType = eventType;
        puntualEvent.updatedBy = userEmail;
        puntualEvent.updatedAt = new Date();

        const savedEvent = await puntualEventRepo.save(puntualEvent);

        res.status(200).json({
            status: 'success',
            message: 'Puntual event updated successfully',
            data: {
                event: savedEvent
            }
        });

    } catch (error) {
        console.error('Error updating puntual event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating puntual event',
            data: error instanceof Error ? error.message : error
        });
    }
};

export const createPeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId, weekDay, startTime, endTime, planifiedHours, eventCharacter, groupIds = [], classroomIds = [], eventType = EVENT_TYPES.NORMAL } = req.body;
        const isSpecial = isSpecialEventType(eventType);

        // Validaciones
        if (!calendarId || !weekDay || !startTime || !endTime || (!planifiedHours && !isSpecial)) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: calendarId, weekDay, startTime, endTime, planifiedHours',
                data: null
            });
            return;
        }

        const calendarRepo = AppDataSource.getRepository(Calendar);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const groupRepo = AppDataSource.getRepository(Group);
        const classroomRepo = AppDataSource.getRepository(Classroom);

        // Verificar que el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id: calendarId }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Determinar el eventCharacter a usar (del request o por defecto 'N')
        const finalEventCharacter = eventCharacter || EVENT_CHARACTERS.NORMAL;

        // Validar que el eventCharacter sea vÃ¡lido del pool disponible
        const allValidCharacters = AVAILABLE_CHARACTERS + EVENT_CHARACTERS.NORMAL + EVENT_CHARACTERS.PAR + EVENT_CHARACTERS.IMPAR;
        if (!allValidCharacters.includes(finalEventCharacter)) {
            res.status(400).json({
                status: 'error',
                message: `Invalid eventCharacter: '${finalEventCharacter}'. Must be one of the supported characters.`,
                data: null
            });
            return;
        }

        // Verificar si se ha alcanzado el lÃ­mite de caracteres
        if (!calendar.charactersInUse.includes(finalEventCharacter) && calendar.charactersInUse.length >= MAX_EVENT_TYPES) {
            res.status(400).json({
                status: 'error',
                message: `Calendar has reached the maximum limit of ${MAX_EVENT_TYPES} different event types.`,
                data: null
            });
            return;
        }

        // Si el carÃ¡cter no estÃ¡ en uso, agregarlo
        if (!calendar.charactersInUse.includes(finalEventCharacter)) {
            calendar.charactersInUse += finalEventCharacter;
            calendar.updatedBy = getUserEmailFromRequest(req);
            calendar.updatedAt = new Date();
            await calendarRepo.save(calendar);
        }

        // Obtener los grupos con su relaciÃ³n de subject y validar que pertenezcan al calendario
        const groups = groupIds.length > 0
            ? await groupRepo.find({
                where: {
                    id: In(groupIds),
                    calendar: { id: calendarId }
                },
                relations: ['subject']
            })
            : [];

        // Validar que se encontraron todos los grupos solicitados
        if (groupIds.length > 0 && groups.length !== groupIds.length) {
            res.status(400).json({
                status: 'error',
                message: 'Some groups do not belong to this calendar or do not exist',
                data: null
            });
            return;
        }

        // Obtener las aulas
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // Verificar conflictos: generar todos los eventos actuales del calendario y comprobar
        // si el nuevo evento periÃ³dico colisionarÃ­a con alguno (puntual o periÃ³dico generado)
        const allGeneratedEvents = await CalendarEventsService.generateCalendarEvents(calendarId);

        const normalizeTimeStr = (t: string) => t.substring(0, 5);
        const newStart = normalizeTimeStr(startTime);
        const newEnd = normalizeTimeStr(endTime);
        const dayNumToCode: Record<number, string> = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };

        const conflictos = allGeneratedEvents.filter((event: GeneratedCalendarEvent) => {
            if (event.cancelled) return false;

            // Derivar el dÃ­a de semana: los periÃ³dicos ya tienen weekDay, los puntuales no
            const eventWeekDay = event.weekDay ?? dayNumToCode[new Date(event.date).getDay()];
            if (eventWeekDay !== weekDay) return false;

            // Solapamiento de tiempo
            const eStart = normalizeTimeStr(event.startTime);
            const eEnd = normalizeTimeStr(event.endTime);
            if (newStart >= eEnd || newEnd <= eStart) return false;

            // Conflicto de grupo
            const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                event.eventType !== EVENT_TYPES.BLOCKER &&
                event.groups.some(g => groupIds.includes(g.id));

            // Conflicto de aula
            const sharesClassroom = event.classrooms.some(c => classroomIds.includes(c.id));

            return sharesGroup || sharesClassroom;
        });

        if (conflictos.length > 0) {
            const first = conflictos[0];
            const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                first.eventType !== EVENT_TYPES.BLOCKER &&
                first.groups.some(g => groupIds.includes(g.id));
            const sharesClassroom = first.classrooms.some(c => classroomIds.includes(c.id));
            const bothShare = sharesGroup && sharesClassroom;

            const messageKey = bothShare
                ? 'alerts.puntualEvent.error.shared_both'
                : sharesGroup
                    ? 'alerts.puntualEvent.error.shared_group'
                    : 'alerts.puntualEvent.error.shared_classroom';

            res.status(409).json({
                status: 'error',
                message: messageKey,
                data: { conflicts: conflictos.slice(0, 5).map(e => toConflictEntry(e, groupIds, classroomIds)) }
            });
            return;
        }

        // Obtener el aÃ±o del primer grupo (ya que todos pertenecen a la misma asignatura/aÃ±o)
        const groupYear = groups.length > 0 && groups[0].subject ? groups[0].subject.year : new Date(calendar.start).getFullYear();

        // Crear el evento periÃ³dico
        const periodicEvent = periodicEventRepo.create({
            calendar: calendar,
            weekDay: weekDay,
            startTime: startTime,
            endTime: endTime,
            planifiedHours: isSpecial ? 0 : planifiedHours,
            eventCharacter: finalEventCharacter,
            eventType: eventType,
            year: groupYear,
            groups: groups,
            classrooms: classrooms,
            createdBy: userEmail
        });

        const savedEvent = await periodicEventRepo.save(periodicEvent);

        // Update Group.planifiedHours for all groups in this event (solo NORMAL actualiza planifiedHours)
        if (!isSpecial) for (const group of groups) {
            if (group.planifiedHours !== planifiedHours) {
                group.planifiedHours = planifiedHours;
                group.updatedBy = userEmail;
                group.updatedAt = new Date();
                await groupRepo.save(group);

                // Update ALL PeriodicEvents associated with this group
                const allPeriodicEventsForGroup = await periodicEventRepo
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.groups', 'group')
                    .where('group.id = :groupId', { groupId: group.id })
                    .getMany();

                for (const event of allPeriodicEventsForGroup) {
                    if (event.planifiedHours !== planifiedHours) {
                        event.planifiedHours = planifiedHours;
                        event.updatedBy = userEmail;
                        event.updatedAt = new Date();
                        await periodicEventRepo.save(event);
                    }
                }

            }
        }

        res.status(201).json({
            status: 'success',
            message: 'Periodic event created successfully',
            data: {
                event: savedEvent
            }
        });

    } catch (error) {
        console.error('Error creating periodic event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating periodic event',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Create a custom periodic event with specific affected dates
 * Updates Days.dayCharacter for each affected date
 * Creates PeriodicEvent records for each unique weekDay
 */
export const createCustomPeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const {
            calendarId,
            affectedDates, // Array de fechas YYYY-MM-DD
            startTime,
            endTime,
            planifiedHours,
            eventCharacter,
            groupIds = [],
            classroomIds = [],
            eventType = EVENT_TYPES.NORMAL
        } = req.body;
        const isSpecial = isSpecialEventType(eventType);

        // Validaciones
        if (!calendarId || !affectedDates || !Array.isArray(affectedDates) || affectedDates.length === 0) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: calendarId, affectedDates (must be non-empty array)',
                data: null
            });
            return;
        }

        if (!startTime || !endTime || (!planifiedHours && !isSpecial)) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: startTime, endTime, planifiedHours',
                data: null
            });
            return;
        }

        const calendarRepo = AppDataSource.getRepository(Calendar);
        const dayRepo = AppDataSource.getRepository(Day);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const groupRepo = AppDataSource.getRepository(Group);
        const classroomRepo = AppDataSource.getRepository(Classroom);

        // Verificar que el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id: calendarId }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Determinar el eventCharacter a usar
        const finalEventCharacter = eventCharacter || (await import('@/constants/event-characters.constants').then(m => m.findAvailableCharacter(calendar.charactersInUse)));

        // Validar que el eventCharacter sea vÃ¡lido del pool disponible
        const allValidCharacters = AVAILABLE_CHARACTERS + EVENT_CHARACTERS.NORMAL + EVENT_CHARACTERS.PAR + EVENT_CHARACTERS.IMPAR;
        if (!allValidCharacters.includes(finalEventCharacter)) {
            res.status(400).json({
                status: 'error',
                message: `Invalid eventCharacter: '${finalEventCharacter}'. Must be one of the supported characters.`,
                data: null
            });
            return;
        }

        // Verificar si se ha alcanzado el lÃ­mite de caracteres
        if (!calendar.charactersInUse.includes(finalEventCharacter) && calendar.charactersInUse.length >= MAX_EVENT_TYPES) {
            res.status(400).json({
                status: 'error',
                message: `Calendar has reached the maximum limit of ${MAX_EVENT_TYPES} different event types.`,
                data: null
            });
            return;
        }

        // Verificar conflictos antes de realizar cambios
        {
            const allGeneratedEvents = await CalendarEventsService.generateCalendarEvents(calendarId);
            const normalizeTimeStr = (t: string) => t.substring(0, 5);
            const newStart = normalizeTimeStr(startTime);
            const newEnd = normalizeTimeStr(endTime);

            const allConflicts: GeneratedCalendarEvent[] = [];

            for (const dateStr of affectedDates) {
                const targetDateStr = new Date(dateStr).toISOString().split('T')[0];
                const eventsOnDate = allGeneratedEvents.filter((e: GeneratedCalendarEvent) =>
                    !e.cancelled && e.date.startsWith(targetDateStr)
                );
                const conflicts = eventsOnDate.filter((event: GeneratedCalendarEvent) => {
                    const eStart = normalizeTimeStr(event.startTime);
                    const eEnd = normalizeTimeStr(event.endTime);
                    if (newStart >= eEnd || newEnd <= eStart) return false;

                    const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                        event.eventType !== EVENT_TYPES.BLOCKER &&
                        event.groups.some(g => groupIds.includes(g.id));
                    const sharesClassroom = event.classrooms.some(c => classroomIds.includes(c.id));

                    return sharesGroup || sharesClassroom;
                });
                allConflicts.push(...conflicts);
            }

            if (allConflicts.length > 0) {
                const first = allConflicts[0];
                const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                    first.eventType !== EVENT_TYPES.BLOCKER &&
                    first.groups.some(g => groupIds.includes(g.id));
                const sharesClassroom = first.classrooms.some(c => classroomIds.includes(c.id));
                const bothShare = sharesGroup && sharesClassroom;

                const messageKey = bothShare
                    ? 'alerts.puntualEvent.error.shared_both'
                    : sharesGroup
                        ? 'alerts.puntualEvent.error.shared_group'
                        : 'alerts.puntualEvent.error.shared_classroom';

                res.status(409).json({
                    status: 'error',
                    message: messageKey,
                    data: { conflicts: allConflicts.slice(0, 5).map(e => toConflictEntry(e, groupIds, classroomIds)) }
                });
                return;
            }
        }

        // Si el carÃ¡cter no estÃ¡ en uso, agregarlo
        if (!calendar.charactersInUse.includes(finalEventCharacter)) {
            calendar.charactersInUse += finalEventCharacter;
            calendar.updatedBy = getUserEmailFromRequest(req);
            calendar.updatedAt = new Date();
            await calendarRepo.save(calendar);
        }

        // Actualizar Days.dayCharacter para cada fecha afectada
        let daysUpdated = 0;
        const weekDaysSet = new Set<string>();

        for (const dateStr of affectedDates) {
            const date = new Date(dateStr + 'T00:00:00'); // Medianoche para coincidir con formato de BD
            const day = await dayRepo.findOne({
                where: {
                    date: date,
                    calendar: { id: calendarId }
                }
            });

            if (day && day.lective) {
                // Agregar el nuevo carÃ¡cter al dayCharacter existente si no estÃ¡ ya
                if (!day.dayCharacter.includes(finalEventCharacter)) {
                    day.dayCharacter += finalEventCharacter;
                    day.updatedBy = getUserEmailFromRequest(req);
                    day.updatedAt = new Date();
                    await dayRepo.save(day);
                    daysUpdated++;
                }

                // Registrar el dÃ­a de la semana
                const dayOfWeek = date.getDay();
                const weekDayLetter = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][dayOfWeek];
                weekDaysSet.add(weekDayLetter);
            }
        }


        // Obtener los grupos con su relaciÃ³n de subject y validar que pertenezcan al calendario
        const groups = groupIds.length > 0
            ? await groupRepo.find({
                where: {
                    id: In(groupIds),
                    calendar: { id: calendarId }
                },
                relations: ['subject']
            })
            : [];

        // Validar que se encontraron todos los grupos solicitados
        if (groupIds.length > 0 && groups.length !== groupIds.length) {
            res.status(400).json({
                status: 'error',
                message: 'Some groups do not belong to this calendar or do not exist',
                data: null
            });
            return;
        }

        // Obtener las aulas
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // Obtener el aÃ±o del primer grupo
        const groupYear = groups.length > 0 && groups[0].subject ? groups[0].subject.year : new Date(calendar.start).getFullYear();

        // Crear PeriodicEvent para cada dÃ­a de la semana Ãºnico
        const createdEvents = [];
        for (const weekDay of Array.from(weekDaysSet)) {
            const periodicEvent = periodicEventRepo.create({
                calendar: calendar,
                weekDay: weekDay,
                startTime: startTime,
                endTime: endTime,
                planifiedHours: isSpecial ? 0 : planifiedHours,
                eventCharacter: finalEventCharacter,
                eventType: eventType,
                year: groupYear,
                groups: groups,
                classrooms: classrooms,
                createdBy: userEmail
            });

            const savedEvent = await periodicEventRepo.save(periodicEvent);
            createdEvents.push(savedEvent);
        }


        // Update Group.planifiedHours for all groups in this event (solo NORMAL actualiza planifiedHours)
        if (!isSpecial) for (const group of groups) {
            if (group.planifiedHours !== planifiedHours) {
                group.planifiedHours = planifiedHours;
                group.updatedBy = userEmail;
                group.updatedAt = new Date();
                await groupRepo.save(group);

                // Update ALL PeriodicEvents associated with this group
                const allPeriodicEventsForGroup = await periodicEventRepo
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.groups', 'group')
                    .where('group.id = :groupId', { groupId: group.id })
                    .getMany();

                for (const event of allPeriodicEventsForGroup) {
                    if (event.planifiedHours !== planifiedHours) {
                        event.planifiedHours = planifiedHours;
                        event.updatedBy = userEmail;
                        event.updatedAt = new Date();
                        await periodicEventRepo.save(event);
                    }
                }

            }
        }

        res.status(201).json({
            status: 'success',
            message: 'Custom periodic events created successfully',
            data: {
                events: createdEvents,
                eventCharacter: finalEventCharacter,
                affectedDatesCount: affectedDates.length,
                daysUpdated: daysUpdated,
                weekDays: Array.from(weekDaysSet)
            }
        });

    } catch (error) {
        console.error('Error creating custom periodic event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating custom periodic event',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Update a periodic event
 * Only updates the base PeriodicEvent record
 * Does not validate future conflicts or modify existing PuntualEvents
 * Allows editing: startTime, endTime, classrooms, and planifiedHours
 */
export const updatePeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { eventId } = req.params;
        const { startTime, endTime, classroomIds = [], planifiedHours, weekDay, eventType = EVENT_TYPES.NORMAL, groupIds: bodyGroupIds } = req.body;

        // Validaciones
        if (!eventId) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required field: eventId',
                data: null
            });
            return;
        }

        if (!startTime || !endTime) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: startTime, endTime',
                data: null
            });
            return;
        }

        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const classroomRepo = AppDataSource.getRepository(Classroom);
        const groupRepo = AppDataSource.getRepository(Group);

        // Buscar el evento periÃ³dico con sus relaciones
        const periodicEvent = await periodicEventRepo.findOne({
            where: { id: eventId },
            relations: ['groups', 'classrooms', 'calendar']
        });

        if (!periodicEvent) {
            res.status(404).json({
                status: 'error',
                message: 'Periodic event not found',
                data: null
            });
            return;
        }

        // Obtener las nuevas aulas si se proporcionaron
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // ValidaciÃ³n de conflictos antes de actualizar
        {
            const calendarId = periodicEvent.calendar.id;
            const newWeekDay = (weekDay !== undefined && weekDay !== null) ? weekDay : periodicEvent.weekDay;
            const groupIds = bodyGroupIds !== undefined ? bodyGroupIds : periodicEvent.groups.map((g: any) => g.id);
            const normalizeTimeStr = (t: string) => t.substring(0, 5);
            const newStart = normalizeTimeStr(startTime);
            const newEnd = normalizeTimeStr(endTime);
            const dayNumToCode: Record<number, string> = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };

            const allGeneratedEvents = await CalendarEventsService.generateCalendarEvents(calendarId);

            const conflictos = allGeneratedEvents.filter((event: GeneratedCalendarEvent) => {
                if (event.cancelled) return false;
                // Excluir el propio evento
                if (event.type === 'periodic' && event.periodicEventId === eventId) return false;

                const eventWeekDay = event.weekDay ?? dayNumToCode[new Date(event.date).getDay()];
                if (eventWeekDay !== newWeekDay) return false;

                const eStart = normalizeTimeStr(event.startTime);
                const eEnd = normalizeTimeStr(event.endTime);
                if (newStart >= eEnd || newEnd <= eStart) return false;

                const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                    event.eventType !== EVENT_TYPES.BLOCKER &&
                    event.groups.some(g => groupIds.includes(g.id));
                const sharesClassroom = event.classrooms.some(c => classroomIds.includes(c.id));

                return sharesGroup || sharesClassroom;
            });

            if (conflictos.length > 0) {
                const first = conflictos[0];
                const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                    first.eventType !== EVENT_TYPES.BLOCKER &&
                    first.groups.some(g => groupIds.includes(g.id));
                const sharesClassroom = first.classrooms.some(c => classroomIds.includes(c.id));
                const bothShare = sharesGroup && sharesClassroom;

                const messageKey = bothShare
                    ? 'alerts.puntualEvent.error.shared_both'
                    : sharesGroup
                        ? 'alerts.puntualEvent.error.shared_group'
                        : 'alerts.puntualEvent.error.shared_classroom';

                res.status(409).json({
                    status: 'error',
                    message: messageKey,
                    data: { conflicts: conflictos.slice(0, 5).map(e => toConflictEntry(e, groupIds, classroomIds)) }
                });
                return;
            }
        }

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // Actualizar el evento periÃ³dico
        periodicEvent.startTime = startTime;
        periodicEvent.endTime = endTime;
        periodicEvent.classrooms = classrooms;
        periodicEvent.eventType = eventType;
        if (weekDay !== undefined && weekDay !== null) {
            periodicEvent.weekDay = weekDay;
        }
        if (bodyGroupIds !== undefined) {
            periodicEvent.groups = bodyGroupIds.length > 0
                ? await groupRepo.find({ where: { id: In(bodyGroupIds) } })
                : [];
        }
        periodicEvent.updatedBy = userEmail;
        periodicEvent.updatedAt = new Date();

        // Si se proporcionaron horas planificadas, actualizarlas (solo NORMAL actualiza planifiedHours)
        if (planifiedHours !== undefined && planifiedHours !== null && periodicEvent.eventType === EVENT_TYPES.NORMAL) {
            periodicEvent.planifiedHours = planifiedHours;

            // Update Group.planifiedHours for all groups in this event
            for (const group of periodicEvent.groups) {
                if (group.planifiedHours !== planifiedHours) {
                    group.planifiedHours = planifiedHours;
                    group.updatedBy = userEmail;
                    group.updatedAt = new Date();
                    await groupRepo.save(group);

                    // Update ALL PeriodicEvents associated with this group
                    const allPeriodicEventsForGroup = await periodicEventRepo
                        .createQueryBuilder('event')
                        .leftJoinAndSelect('event.groups', 'group')
                        .where('group.id = :groupId', { groupId: group.id })
                        .getMany();

                    for (const event of allPeriodicEventsForGroup) {
                        if (event.planifiedHours !== planifiedHours) {
                            event.planifiedHours = planifiedHours;
                            event.updatedBy = userEmail;
                            event.updatedAt = new Date();
                            await periodicEventRepo.save(event);
                        }
                    }

                }
            }
        }

        const savedEvent = await periodicEventRepo.save(periodicEvent);

        res.status(200).json({
            status: 'success',
            message: 'Periodic event updated successfully',
            data: {
                event: savedEvent
            }
        });

    } catch (error) {
        console.error('Error updating periodic event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating periodic event',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Update all custom periodic events with the same character in a calendar
 * Updates ALL PeriodicEvent records that share the same eventCharacter
 * Used for editing custom frequency periodic events created via pattern
 */
export const updateCustomPeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const { eventCharacter, calendarId, startTime, endTime, classroomIds = [], planifiedHours, eventType = EVENT_TYPES.NORMAL } = req.body;

        // Validaciones
        if (!eventCharacter || !calendarId) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: eventCharacter, calendarId',
                data: null
            });
            return;
        }

        if (!startTime || !endTime) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: startTime, endTime',
                data: null
            });
            return;
        }

        // Validate eventCharacter is not a standard character (N, P, I, F)
        const standardCharacters = ['N', 'P', 'I', 'F'];
        if (standardCharacters.includes(eventCharacter)) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot update standard periodic events using this endpoint',
                data: null
            });
            return;
        }

        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const classroomRepo = AppDataSource.getRepository(Classroom);
        const groupRepo = AppDataSource.getRepository(Group);
        const dayRepo = AppDataSource.getRepository(Day);

        // Find all PeriodicEvents with this character in this calendar
        const periodicEvents = await periodicEventRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.groups', 'group')
            .leftJoinAndSelect('event.classrooms', 'classroom')
            .leftJoin('event.calendar', 'calendar')
            .where('calendar.id = :calendarId', { calendarId })
            .andWhere('event.eventCharacter = :eventCharacter', { eventCharacter })
            .getMany();

        if (periodicEvents.length === 0) {
            res.status(404).json({
                status: 'error',
                message: 'No periodic events found with this character in the calendar',
                data: null
            });
            return;
        }

        // Get classrooms if provided
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // ValidaciÃ³n de conflictos antes de actualizar
        {
            const editingIds = new Set(periodicEvents.map((e: any) => e.id));
            const normalizeTimeStr = (t: string) => t.substring(0, 5);
            const newStart = normalizeTimeStr(startTime);
            const newEnd = normalizeTimeStr(endTime);
            const dayNumToCode: Record<number, string> = { 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };

            const allGeneratedEvents = await CalendarEventsService.generateCalendarEvents(calendarId);

            for (const periodicEvent of periodicEvents) {
                const eventWeekDay = periodicEvent.weekDay;
                const groupIds = periodicEvent.groups.map((g: any) => g.id);

                const conflictos = allGeneratedEvents.filter((event: GeneratedCalendarEvent) => {
                    if (event.cancelled) return false;
                    // Excluir los eventos que se estÃ¡n editando
                    if (event.type === 'periodic' && editingIds.has(event.periodicEventId ?? '')) return false;

                    const evWeekDay = event.weekDay ?? dayNumToCode[new Date(event.date).getDay()];
                    if (evWeekDay !== eventWeekDay) return false;

                    const eStart = normalizeTimeStr(event.startTime);
                    const eEnd = normalizeTimeStr(event.endTime);
                    if (newStart >= eEnd || newEnd <= eStart) return false;

                    const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                        event.eventType !== EVENT_TYPES.BLOCKER &&
                        event.groups.some(g => groupIds.includes(g.id));
                    const sharesClassroom = event.classrooms.some(c => classroomIds.includes(c.id));

                    return sharesGroup || sharesClassroom;
                });

                if (conflictos.length > 0) {
                    const first = conflictos[0];
                    const sharesGroup = eventType !== EVENT_TYPES.BLOCKER &&
                        first.eventType !== EVENT_TYPES.BLOCKER &&
                        first.groups.some(g => groupIds.includes(g.id));
                    const sharesClassroom = first.classrooms.some(c => classroomIds.includes(c.id));
                    const bothShare = sharesGroup && sharesClassroom;

                    const messageKey = bothShare
                        ? 'alerts.puntualEvent.error.shared_both'
                        : sharesGroup
                            ? 'alerts.puntualEvent.error.shared_group'
                            : 'alerts.puntualEvent.error.shared_classroom';

                    res.status(409).json({
                        status: 'error',
                        message: messageKey,
                        data: { conflicts: conflictos.slice(0, 5).map(e => toConflictEntry(e, groupIds, classroomIds)) }
                    });
                    return;
                }
            }
        }

        // Get user email for audit
        const userEmail = getUserEmailFromRequest(req);

        // Update all events
        let updatedCount = 0;
        for (const event of periodicEvents) {
            event.startTime = startTime;
            event.endTime = endTime;
            event.classrooms = classrooms;
            event.eventType = eventType;
            event.updatedBy = userEmail;
            event.updatedAt = new Date();

            // Update planified hours if provided (solo NORMAL actualiza planifiedHours)
            if (planifiedHours !== undefined && planifiedHours !== null && event.eventType === EVENT_TYPES.NORMAL) {
                event.planifiedHours = planifiedHours;

                // Update Group.planifiedHours for all groups in this event
                for (const group of event.groups) {
                    if (group.planifiedHours !== planifiedHours) {
                        group.planifiedHours = planifiedHours;
                        group.updatedBy = userEmail;
                        group.updatedAt = new Date();
                        await groupRepo.save(group);

                        // Update ALL PeriodicEvents associated with this group
                        const allPeriodicEventsForGroup = await periodicEventRepo
                            .createQueryBuilder('event')
                            .leftJoinAndSelect('event.groups', 'group')
                            .where('group.id = :groupId', { groupId: group.id })
                            .getMany();

                        for (const groupEvent of allPeriodicEventsForGroup) {
                            if (groupEvent.planifiedHours !== planifiedHours) {
                                groupEvent.planifiedHours = planifiedHours;
                                groupEvent.updatedBy = userEmail;
                                groupEvent.updatedAt = new Date();
                                await periodicEventRepo.save(groupEvent);
                            }
                        }

                    }
                }
            }

            await periodicEventRepo.save(event);
            updatedCount++;
        }


        res.status(200).json({
            status: 'success',
            message: 'Custom periodic events updated successfully',
            data: {
                updatedCount,
                eventCharacter
            }
        });

    } catch (error) {
        console.error('Error updating custom periodic events:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating custom periodic events',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Replace a periodic event occurrence with a new puntual event
 * Creates two puntual events atomically:
 * 1. A cancelled event at the original date/time
 * 2. A replacement event at the new date/time
 */
export const replacePeriodicEvent = async (req: AuditedRequest, res: Response) => {
    try {
        const {
            calendarId,
            originalDate,
            originalStartTime,
            originalEndTime,
            newEventDate,
            newStartTime,
            newEndTime,
            groupIds = [],
            classroomIds = [],
            comment = '',
            periodicEventSourceId = null
        } = req.body;

        // Validaciones
        if (!calendarId || !originalDate || !originalStartTime || !originalEndTime || !newEventDate || !newStartTime || !newEndTime) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: calendarId, originalDate, originalStartTime, originalEndTime, newEventDate, newStartTime, newEndTime',
                data: null
            });
            return;
        }

        const dayRepo = AppDataSource.getRepository(Day);
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const groupRepo = AppDataSource.getRepository(Group);
        const classroomRepo = AppDataSource.getRepository(Classroom);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Verificar que el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id: calendarId }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        // Obtener los grupos y validar que pertenezcan al calendario
        const groups = groupIds.length > 0
            ? await groupRepo.find({
                where: {
                    id: In(groupIds),
                    calendar: { id: calendarId }
                }
            })
            : [];

        // Validar que se encontraron todos los grupos solicitados
        if (groupIds.length > 0 && groups.length !== groupIds.length) {
            res.status(400).json({
                status: 'error',
                message: 'Some groups do not belong to this calendar or do not exist',
                data: null
            });
            return;
        }

        // Obtener las aulas
        const classrooms = classroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(classroomIds) } })
            : [];

        // Obtener usuario autenticado
        const userEmail = getUserEmailFromRequest(req);

        // PASO 1: Buscar el dÃ­a original
        const originalDateObj = new Date(originalDate);
        originalDateObj.setHours(0, 0, 0, 0);

        const originalDay = await dayRepo.findOne({
            where: {
                date: originalDateObj,
                calendar: { id: calendarId }
            },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.classrooms']
        });

        if (!originalDay) {
            res.status(400).json({
                status: 'error',
                message: 'The original date does not exist in the calendar',
                data: null
            });
            return;
        }

        // PASO 2: Buscar el dÃ­a del nuevo evento
        const newEventDateObj = new Date(newEventDate);
        newEventDateObj.setHours(0, 0, 0, 0);

        // Validar que la fecha estÃ© dentro del rango del calendario
        const calendarStartDate = new Date(calendar.start);
        calendarStartDate.setHours(0, 0, 0, 0);

        const calendarEndDate = new Date(calendar.end);
        calendarEndDate.setHours(0, 0, 0, 0);

        if (newEventDateObj < calendarStartDate || newEventDateObj > calendarEndDate) {
            res.status(400).json({
                status: 'error',
                message: `New event date must be between ${calendar.start.toISOString().split('T')[0]} and ${calendar.end.toISOString().split('T')[0]}`,
                data: null
            });
            return;
        }

        const newDay = await dayRepo.findOne({
            where: {
                date: newEventDateObj,
                calendar: { id: calendarId }
            },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.groups.subject', 'puntualEvents.classrooms']
        });

        if (!newDay) {
            res.status(400).json({
                status: 'error',
                message: 'The new event date does not exist in the calendar',
                data: null
            });
            return;
        }

        // Validar que el dÃ­a sea lectivo
        if (!newDay.lective) {
            res.status(400).json({
                status: 'error',
                message: 'Cannot create events on non-lective days',
                data: null
            });
            return;
        }

        // PASO 3: Verificar conflictos en la nueva fecha/hora
        const normalizeTime = (t: string) => t.substring(0, 5);
        const newStart = normalizeTime(newStartTime);
        const newEnd = normalizeTime(newEndTime);

        const conflictingPuntualEvents = newDay.puntualEvents?.filter(event => {
            if (event.cancelled) return false;

            const eStart = normalizeTime(event.startTime);
            const eEnd = normalizeTime(event.endTime);
            if (newStart >= eEnd || newEnd <= eStart) return false;

            const sharesGroup = groupIds.length > 0 &&
                event.groups?.some(g => groupIds.includes(g.id));
            const sharesClassroom = classroomIds.length > 0 &&
                event.classrooms?.some(c => classroomIds.includes(c.id));

            return sharesGroup || sharesClassroom;
        }) ?? [];

        const newEventDateForConflict = new Date(newEventDate + 'T00:00:00');
        newEventDateForConflict.setHours(0, 0, 0, 0);
        const activePeriodicEvents = await getActivePeriodicEventsForDay(
            calendarId, newDay.id, newEventDateForConflict, newDay.dayCharacter
        );
        const conflictingPeriodicEvents = findPeriodicEventConflicts(
            newStartTime, newEndTime, groupIds, classroomIds, activePeriodicEvents, EVENT_TYPES.NORMAL
        );

        const allReplaceConflicts = [
            ...conflictingPuntualEvents.map(e => ({
                id: e.id,
                startTime: e.startTime,
                endTime: e.endTime,
                type: 'puntual' as const,
                groupNames: e.groups?.filter(g => groupIds.includes(g.id)).map(g => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                classroomNames: e.classrooms?.filter(c => classroomIds.includes(c.id)).map(c => c.code) ?? []
            })),
            ...conflictingPeriodicEvents.map(e => ({
                id: e.id,
                startTime: e.startTime,
                endTime: e.endTime,
                type: 'periodic' as const,
                groupNames: e.groups?.filter(g => groupIds.includes(g.id)).map(g => `${g.subject?.acronym}.${g.type}.${g.number}`) ?? [],
                classroomNames: e.classrooms?.filter(c => classroomIds.includes(c.id)).map(c => c.code) ?? []
            }))
        ];

        if (allReplaceConflicts.length > 0) {
            const first = allReplaceConflicts[0];
            const hasGroup = first.groupNames.length > 0;
            const hasClassroom = first.classroomNames.length > 0;

            const messageKey = hasGroup && hasClassroom
                ? 'alerts.puntualEvent.error.shared_both'
                : hasGroup
                    ? 'alerts.puntualEvent.error.shared_group'
                    : 'alerts.puntualEvent.error.shared_classroom';

            res.status(409).json({
                status: 'error',
                message: messageKey,
                data: { conflicts: allReplaceConflicts.slice(0, 5) }
            });
            return;
        }

        // Obtener los datos originales del evento periÃ³dico para usarlos en el evento cancelado
        let originalGroups = groups;
        let originalClassrooms = classrooms;

        if (periodicEventSourceId) {
            const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
            const originalPeriodicEvent = await periodicEventRepo.findOne({
                where: { id: periodicEventSourceId },
                relations: ['groups', 'classrooms']
            });
            if (originalPeriodicEvent) {
                originalGroups = originalPeriodicEvent.groups ?? [];
                originalClassrooms = originalPeriodicEvent.classrooms ?? [];
            }
        }

        // PASO 4: Crear transacciÃ³n para ambas operaciones atÃ³micas
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // PASO 1: Crear evento de reemplazo en la nueva fecha (primero para obtener su ID)
            const replacementEvent = puntualEventRepo.create({
                day: newDay,
                startTime: newStartTime,
                endTime: newEndTime,
                cancelled: false,
                comment: comment || '',
                groups: groups,
                classrooms: classrooms,
                createdBy: userEmail
            });

            await queryRunner.manager.save(replacementEvent);


            // PASO 2: Crear evento cancelado en la fecha original vinculado al reemplazo
            // Usar los datos originales del evento periÃ³dico (no los nuevos del reemplazo)
            const cancelledEvent = puntualEventRepo.create({
                day: originalDay,
                startTime: originalStartTime,
                endTime: originalEndTime,
                cancelled: true,
                comment: `Evento reemplazado - ${comment}`,
                groups: originalGroups,
                classrooms: originalClassrooms,
                createdBy: userEmail,
                replacementEventId: replacementEvent.id,
                periodicEventSourceId: periodicEventSourceId ?? null,
            });

            await queryRunner.manager.save(cancelledEvent);


            // Commit de la transacciÃ³n
            await queryRunner.commitTransaction();

            res.status(201).json({
                status: 'success',
                message: 'Event replaced successfully',
                data: {
                    cancelledEvent,
                    replacementEvent
                }
            });

        } catch (error) {
            // Rollback en caso de error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Liberar el queryRunner
            await queryRunner.release();
        }

    } catch (error) {
        console.error('Error replacing periodic event:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error replacing periodic event',
            data: error instanceof Error ? error.message : error
        });
    }
};

/**
 * Import exceptions file only with support for ADD or REPLACE modes
 * Only accessible by ADMIN
 */
export const importExceptions = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId } = req.params;
        const { mode } = req.body; // 'add' or 'replace'
        const file = req.file as Express.Multer.File;

        if (!calendarId) {
            res.status(400).json({
                status: 'error',
                message: 'Calendar ID is required',
                data: null
            });
            return;
        }

        if (!ValidationService.validateUUID(calendarId)) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid UUID format for calendar ID',
                data: null
            });
            return;
        }

        if (!file || !file.originalname.endsWith('.txt')) {
            res.status(400).json({
                status: 'error',
                message: 'A .txt file is required',
                data: null
            });
            return;
        }

        // Validate mode parameter
        if (mode && mode !== 'add' && mode !== 'replace') {
            res.status(400).json({
                status: 'error',
                message: 'Invalid mode. Must be "add" or "replace"',
                data: null
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);
        const importMode = mode as 'add' | 'replace' | undefined;
        const result = await CalendarImportService.importExceptionsOnly(file, calendarId, userEmail, importMode);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error importing exceptions:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Error importing exceptions',
            data: null
        });
    }
};

/**
 * Duplicates a calendar from a source course to a target course
 * Only copies N, I, P periodic events and adjusts festivos
 */
export const duplicateCalendar = async (req: AuditedRequest, res: Response) => {
    const { sourceCalendarId, targetCourseId, semester, start, end, holidays = [] } = req.body;

    // Validaciones
    if (!sourceCalendarId) {
        res.status(400).json({
            status: "error",
            message: "Source calendar ID is required",
            data: null,
        });
        return;
    }

    if (!ValidationService.validateUUID(sourceCalendarId)) {
        res.status(400).json({
            status: "error",
            message: "Invalid UUID format for source calendar ID",
            data: null,
        });
        return;
    }

    if (!targetCourseId) {
        res.status(400).json({
            status: "error",
            message: "Target course ID is required",
            data: null,
        });
        return;
    }

    if (!ValidationService.validateUUID(targetCourseId)) {
        res.status(400).json({
            status: "error",
            message: "Invalid UUID format for target course ID",
            data: null,
        });
        return;
    }

    if (!semester) {
        res.status(400).json({
            status: "error",
            message: "Semester is required",
            data: null,
        });
        return;
    }

    if (!start) {
        res.status(400).json({
            status: "error",
            message: "Start date is required",
            data: null,
        });
        return;
    }

    if (!end) {
        res.status(400).json({
            status: "error",
            message: "End date is required",
            data: null,
        });
        return;
    }

    // Parsear fechas en zona horaria de Madrid (Europe/Madrid)
    const parseSpainDate = (dateString: string): Date => {
        const parts = dateString.split(/[-T]/);
        if (parts.length >= 3) {
            const year = Number.parseInt(parts[0]);
            const month = Number.parseInt(parts[1]) - 1;
            const day = Number.parseInt(parts[2]);
            const date = new Date(year, month, day, 12, 0, 0, 0);
            return date;
        }
        return new Date(dateString + 'T12:00:00');
    };

    const startDate = parseSpainDate(start);
    const endDate = parseSpainDate(end);

    if (startDate >= endDate) {
        res.status(400).json({
            status: "error",
            message: "Start date must be before end date",
            data: null,
        });
        return;
    }

    try {
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
        const dayRepo = AppDataSource.getRepository(Day);
        const groupRepo = AppDataSource.getRepository(Group);

        // Verificar que el calendario fuente existe
        const sourceCalendar = await calendarRepo.findOne({
            where: { id: sourceCalendarId },
            relations: ['course', 'periodicEvents', 'periodicEvents.groups', 'periodicEvents.classrooms']
        });

        if (!sourceCalendar) {
            res.status(404).json({
                status: "error",
                message: "Source calendar not found",
                data: null,
            });
            return;
        }

        // Verificar si ya existe un calendario para el curso objetivo y semestre
        const existingCalendar = await calendarRepo.findOne({
            where: {
                course: { id: targetCourseId },
                semester
            }
        });

        if (existingCalendar) {
            res.status(409).json({
                status: "error",
                message: "Calendar already exists for this course and semester",
                data: {
                    existing: existingCalendar
                },
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);

        // Crear el nuevo calendario
        const newCalendar = calendarRepo.create({
            course: { id: targetCourseId },
            semester,
            start: startDate,
            end: endDate,
            charactersInUse: `${EVENT_CHARACTERS.NORMAL}${EVENT_CHARACTERS.PAR}${EVENT_CHARACTERS.IMPAR}`, // Reset to NPI
            createdBy: userEmail
        });

        const savedCalendar = await calendarRepo.save(newCalendar);

        // Crear mapa de fechas festivas con comentarios
        const holidayMap = new Map<string, string>();
        (holidays as Array<{ date: string; comment: string }>).forEach((holiday) => {
            const date = parseSpainDate(holiday.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            holidayMap.set(dateKey, holiday.comment || '');
        });

        // Crear Day records para cada dÃ­a del calendario
        const days: Day[] = [];
        const startDateNormalized = new Date(startDate);
        startDateNormalized.setHours(0, 0, 0, 0);
        const currentDate = new Date(startDateNormalized);
        const endDateAdjusted = new Date(endDate);
        endDateAdjusted.setHours(0, 0, 0, 0);

        while (currentDate <= endDateAdjusted) {
            const dayOfWeek = currentDate.getDay();
            const dateKey = currentDate.toISOString().split('T')[0];

            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidayMap.has(dateKey);
            const isLective = !isWeekend && !isHoliday;

            let dayCharacter = '';
            if (isLective) {
                const esPar = esSemanaPar(currentDate, startDateNormalized);
                dayCharacter = esPar ? EVENT_CHARACTERS.PAR : EVENT_CHARACTERS.IMPAR;
            } else {
                dayCharacter = DAY_CHARACTERS.NON_LECTIVE;
            }

            const holidayComment = holidayMap.get(dateKey) || '';

            const day = dayRepo.create({
                calendar: savedCalendar,
                date: new Date(currentDate),
                lective: isLective,
                dayCharacter,
                comment: holidayComment,
                createdBy: userEmail
            });

            days.push(day);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        await dayRepo.save(days);

        // PASO 0: Duplicar asignaturas del calendario origen al calendario destino
        const subjectRepo = AppDataSource.getRepository(Subject);
        const sourceSubjects = await subjectRepo.find({
            where: { calendar: { id: sourceCalendarId } }
        });

        const subjectMap = new Map<string, Subject>(); // oldSubjectId -> newSubject
        for (const sourceSubject of sourceSubjects) {
            const newSubject = subjectRepo.create({
                calendar: savedCalendar, // Vinculado al nuevo calendario
                acronym: sourceSubject.acronym,
                semester: sourceSubject.semester,
                year: sourceSubject.year,
                name: sourceSubject.name,
                siesCode: sourceSubject.siesCode,
                createdBy: userEmail
            });
            const savedSubject = await subjectRepo.save(newSubject);
            subjectMap.set(sourceSubject.id, savedSubject);
        }


        // PASO 1: Duplicar grupos del calendario origen al calendario destino
        // Los grupos ahora estÃ¡n relacionados con cada calendario especÃ­fico
        const sourceGroups = await groupRepo.find({
            where: { calendar: { id: sourceCalendarId } },
            relations: ['subject']
        });

        const groupMap = new Map<string, Group>(); // oldGroupId -> newGroup
        for (const sourceGroup of sourceGroups) {
            // Mapear el subject viejo al nuevo subject duplicado
            const newSubject = subjectMap.get(sourceGroup.subject.id);

            if (!newSubject) {
                console.warn(`[Calendar Duplication] Subject ${sourceGroup.subject.id} not found in subject map for group ${sourceGroup.id}`);
                continue;
            }

            const newGroup = groupRepo.create({
                calendar: savedCalendar, // Vinculado al nuevo calendario
                subject: newSubject, // Usar el nuevo subject, no el viejo
                number: sourceGroup.number,
                type: sourceGroup.type,
                language: sourceGroup.language,
                planifiedHours: sourceGroup.planifiedHours,
                createdBy: userEmail
            });
            const savedGroup = await groupRepo.save(newGroup);
            groupMap.set(sourceGroup.id, savedGroup);
        }


        // PASO 2: Copiar solo eventos periÃ³dicos N, I, P del calendario fuente
        const eventsToClone = sourceCalendar.periodicEvents.filter(event =>
            event.eventCharacter === EVENT_CHARACTERS.NORMAL ||
            event.eventCharacter === EVENT_CHARACTERS.PAR ||
            event.eventCharacter === EVENT_CHARACTERS.IMPAR
        );

        const clonedEvents: PeriodicEvent[] = [];
        for (const sourceEvent of eventsToClone) {
            // Get the target course year for the cloned event
            const targetCourse = await AppDataSource.getRepository(Course).findOne({
                where: { id: targetCourseId }
            });

            if (!targetCourse) continue;

            // Mapear grupos del calendario origen a grupos del calendario destino
            const mappedGroups = sourceEvent.groups
                .map(oldGroup => groupMap.get(oldGroup.id))
                .filter((g): g is Group => g !== undefined);

            if (mappedGroups.length !== sourceEvent.groups.length) {
                console.warn(`[Calendar Duplication] Some groups were not found in map for event ${sourceEvent.id}`);
            }

            const clonedEvent = periodicEventRepo.create({
                calendar: savedCalendar,
                year: targetCourse.startYear, // Use target course's start year
                weekDay: sourceEvent.weekDay,
                startTime: sourceEvent.startTime,
                endTime: sourceEvent.endTime,
                eventCharacter: sourceEvent.eventCharacter,
                planifiedHours: sourceEvent.planifiedHours,
                groups: mappedGroups, // Usar grupos del calendario destino
                classrooms: sourceEvent.classrooms, // Copy classrooms relationship
                createdBy: userEmail
            });

            clonedEvents.push(clonedEvent);
        }

        await periodicEventRepo.save(clonedEvents);


        res.status(201).json({
            status: "success",
            message: "Calendar duplicated successfully",
            data: {
                calendar: savedCalendar,
                daysCreated: days.length,
                lectiveDays: days.filter(d => d.lective).length,
                subjectsDuplicated: sourceSubjects.length,
                groupsDuplicated: sourceGroups.length,
                eventsCloned: clonedEvents.length
            },
        });
    } catch (error) {
        console.error("Error duplicating calendar:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while duplicating calendar",
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Get all active calendars (calendars that cover the current date)
 * Returns all calendars where start <= today <= end
 * Includes full information about the calendar, course, and degree
 */
export const getActiveCalendars = async (_req: AuditedRequest, res: Response) => {
    try {
        // Query to get all calendars from active courses
        const calendars = await AppDataSource.getRepository(Calendar)
            .createQueryBuilder('calendar')
            .leftJoinAndSelect('calendar.course', 'course')
            .leftJoinAndSelect('course.degree', 'degree')
            .where('course.state = :courseState', { courseState: 'ACTIVO' })
            .orderBy('degree.acronym', 'ASC')
            .addOrderBy('course.startYear', 'DESC')
            .addOrderBy('calendar.semester', 'ASC')
            .getMany();

        // Format response with all calendar information
        const activeCalendars = calendars.map(calendar => ({
            id: calendar.id,
            start: calendar.start,
            end: calendar.end,
            semester: calendar.semester,
            courseId: calendar.course.id,
            courseStartYear: calendar.course.startYear,
            courseEndYear: calendar.course.endYear,
            degreeId: calendar.course.degree.id,
            degreeName: calendar.course.degree.name,
            degreeAcronym: calendar.course.degree.acronym
        }));

        res.status(200).json({
            status: 'success',
            message: 'Active calendars fetched successfully',
            data: {
                calendars: activeCalendars
            }
        });
    } catch (error) {
        console.error("Error fetching active calendars:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching active calendars',
            data: error instanceof Error ? error.message : error
        });
    }
};
