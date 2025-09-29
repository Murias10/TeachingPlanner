import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Course } from '@/entities/course.entity';
import { Classroom } from '@/entities/classroom.entity';
import multer from 'multer';
import { validate as isValidUUID } from 'uuid';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';

export const getCalendars = async (_req: Request, res: Response) => {
    try {
        const calendars = await AppDataSource.getRepository(Calendar).find();
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

export const getCalendarById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const calendar = await AppDataSource.getRepository(Calendar).findOne({
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

export const createCalendar = async (req: Request, res: Response) => {
    const { idCourse, semester, start, end } = req.body;

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

    // Validar que la fecha de inicio sea anterior a la de fin
    const startDate = new Date(start);
    const endDate = new Date(end);

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

        const calendar = calendarRepo.create({
            course: { id: idCourse },
            semester,
            start: startDate,
            end: endDate
        });

        const savedCalendar = await calendarRepo.save(calendar);

        res.status(201).json({
            status: "success",
            message: "Calendar created successfully",
            data: {
                calendar: savedCalendar,
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

export const deleteCalendar = async (req: Request, res: Response) => {
    try {
        const calendarId = req.params.id?.trim();

        // Validar que el ID esté presente
        if (!calendarId) {
            res.status(400).json({
                status: "error",
                message: "Calendar ID is required",
                data: null
            });
            return;
        }

        // Validar que el ID sea un UUID válido
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

        // Eliminar el calendario
        // Las entidades relacionadas se eliminarán automáticamente por CASCADE
        await calendarRepo.delete(calendarId);

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
        fileSize: 5 * 1024 * 1024 // 5MB límite
    }
});

// Middleware para múltiples archivos
export const uploadFiles = upload.array('files', 10);

// Nueva función para crear calendario con importación
export const createCalendarWithImport = async (req: Request, res: Response) => {
    try {
        const { courseId, semester } = req.body;
        const files = req.files as Express.Multer.File[];

        console.log('CourseId:', courseId);
        console.log('Semester:', semester);
        console.log('Files received:', files?.length || 0);

        // Validaciones básicas
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

        // Verificar que el curso existe
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

        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Verificar si ya existe un calendario para este curso y semestre
        const existingCalendar = await calendarRepo.findOne({
            where: {
                course: { id: courseId },
                semester: parseInt(semester)
            }
        });

        if (existingCalendar) {
            res.status(409).json({
                status: 'error',
                message: 'Calendar already exists for this course and semester',
                data: { existingCalendar }
            });
            return;
        }

        // Procesar archivos importados
        const result = await processImportedFiles(files, courseId, semester);
        const importResult = result.importResult;

        // Crear el calendario
        const calendar = calendarRepo.create({
            course,
            semester: parseInt(semester),
            start: new Date(),
            end: new Date(),
        });

        const savedCalendar = await calendarRepo.save(calendar);

        console.log('Calendar created successfully:', savedCalendar.id);

        res.status(201).json({
            status: 'success',
            message: 'Calendar created successfully',
            data: {
                calendar: savedCalendar,
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

// Función para detectar y decodificar contenido según el archivo
const decodeFileContent = (file: Express.Multer.File): string => {
    const fileName = file.originalname;

    // Archivos con codificación ANSI (Windows-1252)
    const ansiFiles = ['excepciones.txt', 'asignaturas.txt'];
    // Archivos con codificación UTF-8
    const utf8Files = ['ubicaciones.txt', 'horarios.txt', 'calendario.txt'];

    if (ansiFiles.includes(fileName)) {
        // Decodificar ANSI (Windows-1252) - necesitarás iconv-lite
        const iconv = require('iconv-lite');
        return iconv.decode(file.buffer, 'windows-1252');
    } else if (utf8Files.includes(fileName)) {
        // Decodificar UTF-8 (por defecto)
        return file.buffer.toString('utf-8');
    } else {
        // Por defecto usar UTF-8
        console.warn(`Unknown file encoding for: ${fileName}, using UTF-8`);
        return file.buffer.toString('utf-8');
    }
};

// Función para procesar archivos importados
const processImportedFiles = async (files: Express.Multer.File[], courseId: string, semester: number) => {
    const importResult: any = {};

    for (const file of files) {

        // Decodificar contenido con la codificación correcta
        const content = decodeFileContent(file);
        console.log(`Processing file: ${file.originalname} (detected encoding applied)`);

        switch (file.originalname) {
            case 'ubicaciones.txt':
                const classroomsResult = await processUbicacionesFile(content);
                importResult.classrooms = classroomsResult;
                break;

            case 'asignaturas.txt':
                const subjectsResult = await processAsignaturasFile(content, courseId, semester);
                importResult.asignaturas = subjectsResult;
                break;

            // En processImportedFiles, actualiza el case para calendario.txt:
            case 'calendario.txt':
                const calendarResult = await processCalendarioFile(content, calendarId); // Necesitarás pasar el calendarId
                importResult.calendario = calendarResult;
                break;

            case 'horarios.txt':
                // Almacenar para procesamiento futuro
                importResult.horarios = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length,
                    encoding: 'UTF-8'
                };
                break;

            case 'excepciones.txt':
                // Almacenar para procesamiento futuro
                importResult.excepciones = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length,
                    encoding: 'ANSI'
                };
                break;

            default:
                console.warn(`Unknown file: ${file.originalname}`);
                break;
        }
    }

    return { importResult };
};

// Procesar archivo ubicaciones.txt línea por línea
const processUbicacionesFile = async (content: string) => {
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const lines = content.split('\n');
    const processedClassrooms = [];
    const errors = [];

    console.log(`Processing ubicaciones.txt with ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: Aula : URL del GIS
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

            // Asegurar que la URL tiene protocolo
            const gisUrl = gisUrlRaw.startsWith('http') ? gisUrlRaw : `https://${gisUrlRaw}`;

            console.log(`Processing classroom: ${code} -> ${gisUrl}`);

            // Verificar si el aula ya existe
            let classroom = await classroomRepo.findOne({ where: { code } });

            if (classroom) {
                // Actualizar URL si es diferente
                if (classroom.gisUrl !== gisUrl) {
                    classroom.gisUrl = gisUrl;
                    await classroomRepo.save(classroom);
                    processedClassrooms.push({
                        code,
                        action: 'updated',
                        gisUrl,
                        line: i + 1
                    });
                    console.log(`Updated classroom: ${code}`);
                } else {
                    processedClassrooms.push({
                        code,
                        action: 'skipped',
                        reason: 'already exists with same URL',
                        line: i + 1
                    });
                    console.log(`Skipped classroom: ${code} (already exists)`);
                }
            } else {
                // Crear nueva aula
                classroom = classroomRepo.create({ code, gisUrl });
                await classroomRepo.save(classroom);
                processedClassrooms.push({
                    code,
                    action: 'created',
                    gisUrl,
                    line: i + 1
                });
                console.log(`Created classroom: ${code}`);
            }

        } catch (error) {
            const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
        }
    }

    const result = {
        processed: true,
        totalLines: lines.filter(line => line.trim()).length,
        processedCount: processedClassrooms.length,
        errorCount: errors.length,
        classrooms: processedClassrooms,
        errors: errors
    };

    console.log(`Ubicaciones processing completed:`, result);
    return result;
};
// Procesar archivo asignaturas.txt línea por línea
const processAsignaturasFile = async (content: string, courseId: string, semester: number) => {
    const subjectRepo = AppDataSource.getRepository(Subject);
    const courseRepo = AppDataSource.getRepository(Course);
    const groupRepo = AppDataSource.getRepository(Group);
    const lines = content.split('\n');
    const processedSubjects = [];
    const errors = [];

    console.log(`Processing asignaturas.txt with ${lines.length} lines`);

    // Obtener el curso y su degreeId
    let course;
    try {
        course = await courseRepo.findOne({
            where: { id: courseId },
            relations: ['degree']
        });

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
    } catch (error) {
        return {
            processed: false,
            error: `Error fetching course: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            subjects: [],
            errors: [`Error fetching course: ${error instanceof Error ? error.message : error}`]
        };
    }

    const degreeId = course.degree.id;
    console.log(`Found course ${courseId} with degreeId: ${degreeId}`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: Acrónimo : Nombre : Año : Grupos...
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

            // Validaciones básicas
            if (!acronym || !name || !yearStr || !siesCode) {
                errors.push(`Línea ${i + 1}: Campos obligatorios vacíos (acrónimo, nombre, año o código SIES)`);
                continue;
            }

            // Validar año
            const year = parseInt(yearStr, 10);
            if (isNaN(year) || year < 1 || year > 6) {
                errors.push(`Línea ${i + 1}: Año inválido '${yearStr}' - debe ser un número entre 1 y 6`);
                continue;
            }

            // Validar números de grupos
            const groups = [
                { number: parseInt(groupsTeoriaES, 10), type: 'T', language: 'ES' },
                { number: parseInt(groupsSeminarioES, 10), type: 'S', language: 'ES' },
                { number: parseInt(groupsLaboratorioES, 10), type: 'L', language: 'ES' },
                { number: parseInt(groupsTeoriaEN, 10), type: 'T', language: 'EN' },
                { number: parseInt(groupsSeminarioEN, 10), type: 'S', language: 'EN' },
                { number: parseInt(groupsLaboratorioEN, 10), type: 'L', language: 'EN' },
                { number: parseInt(groupsTutoriaGrupalES, 10), type: 'TG', language: 'ES' },
                { number: parseInt(groupsTutoriaGrupalEN, 10), type: 'TG', language: 'EN' }
            ];

            // Validar que todos los números sean válidos
            for (const group of groups) {
                if (isNaN(group.number) || group.number < 0) {
                    errors.push(`Línea ${i + 1}: Número de grupos inválido para ${group.type}-${group.language}`);
                    continue;
                }
            }

            console.log(`Processing subject: ${acronym} -> ${name} (Year ${year})`);

            // Verificar si la asignatura ya existe para este degree
            let subject = await subjectRepo.findOne({
                where: {
                    acronym,
                    degree: { id: degreeId }
                }
            });

            let isNewSubject = false;
            if (subject) {
                // Actualizar si hay cambios
                let hasChanges = false;
                const changes = [];

                if (subject.name !== name) {
                    subject.name = name;
                    hasChanges = true;
                    changes.push(`name: ${subject.name} -> ${name}`);
                }

                if (subject.year !== year) {
                    subject.year = year;
                    hasChanges = true;
                    changes.push(`year: ${subject.year} -> ${year}`);
                }

                if (subject.siesCode !== siesCode) {
                    subject.siesCode = siesCode;
                    hasChanges = true;
                    changes.push(`siesCode: ${subject.siesCode} -> ${siesCode}`);
                }

                if (hasChanges) {
                    await subjectRepo.save(subject);
                }
            } else {
                // Crear nueva asignatura
                subject = subjectRepo.create({
                    acronym,
                    name,
                    year,
                    degree: course.degree,
                    semester: semester,
                    siesCode: siesCode
                });
                await subjectRepo.save(subject);
                isNewSubject = true;
            }

            // Crear grupos para esta asignatura con manejo de duplicados
            let totalGroupsCreated = 0;
            let totalGroupsSkipped = 0;
            const groupActions = [];

            for (const groupConfig of groups) {
                for (let groupNumber = 1; groupNumber <= groupConfig.number; groupNumber++) {
                    try {
                        // Intentar verificar si el grupo ya existe
                        const existingGroup = await groupRepo.findOne({
                            where: {
                                subject: { id: subject.id },
                                number: groupNumber,
                                type: groupConfig.type,
                                language: groupConfig.language
                            }
                        });

                        if (existingGroup) {
                            // El grupo ya existe, no crear
                            totalGroupsSkipped++;
                            groupActions.push(`${groupConfig.type}-${groupConfig.language}-${groupNumber}: skipped (exists)`);
                            console.log(`Skipped group: ${groupConfig.type}-${groupConfig.language}-${groupNumber} (already exists)`);
                        } else {
                            // Crear nuevo grupo
                            const group = groupRepo.create({
                                number: groupNumber,
                                type: groupConfig.type,
                                language: groupConfig.language,
                                subject: subject
                            });
                            await groupRepo.save(group);
                            totalGroupsCreated++;
                            groupActions.push(`${groupConfig.type}-${groupConfig.language}-${groupNumber}: created`);
                            console.log(`Created group: ${groupConfig.type}-${groupConfig.language}-${groupNumber}`);
                        }
                    } catch (groupError) {
                        // Si hay error al crear el grupo (ej: duplicado), continuar
                        if (groupError instanceof Error && groupError.message.includes('ER_DUP_ENTRY')) {
                            totalGroupsSkipped++;
                            groupActions.push(`${groupConfig.type}-${groupConfig.language}-${groupNumber}: skipped (duplicate)`);
                            console.log(`Skipped duplicate group: ${groupConfig.type}-${groupConfig.language}-${groupNumber}`);
                        } else {
                            // Error diferente, re-lanzar
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
                groupActions,
                groupBreakdown: groups.map(g => `${g.type}-${g.language}: ${g.number}`).join(', '),
                action: isNewSubject ? 'created' : 'updated',
                line: i + 1
            });

            console.log(`Processed subject: ${acronym} - Created: ${totalGroupsCreated}, Skipped: ${totalGroupsSkipped} groups`);

        } catch (error) {
            const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
        }
    }

    const result = {
        processed: true,
        totalLines: lines.filter(line => line.trim()).length,
        processedCount: processedSubjects.length,
        errorCount: errors.length,
        subjects: processedSubjects,
        errors: errors
    };

    console.log(`Asignaturas processing completed:`, result);
    return result;
};

// Procesar archivo calendario.txt línea por línea
const processCalendarioFile = async (content: string, calendarId: string) => {
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedDays = [];
    const errors = [];

    console.log(`Processing calendario.txt with ${lines.length} lines`);

    // Verificar que el calendario existe
    let calendar;
    try {
        calendar = await calendarRepo.findOne({ where: { id: calendarId } });

        if (!calendar) {
            return {
                processed: false,
                error: `Calendar with ID ${calendarId} not found`,
                totalLines: 0,
                processedCount: 0,
                errorCount: 1,
                days: [],
                errors: [`Calendar with ID ${calendarId} not found`]
            };
        }
    } catch (error) {
        return {
            processed: false,
            error: `Error fetching calendar: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            days: [],
            errors: [`Error fetching calendar: ${error instanceof Error ? error.message : error}`]
        };
    }

    console.log(`Found calendar ${calendarId}`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: Fecha : [Tipo de fecha] : texto libre
            const parts = line.split(':');

            if (parts.length < 3) {
                errors.push(`Línea ${i + 1}: Formato inválido - debe tener al menos 3 campos separados por ':'`);
                continue;
            }

            const dateStr = parts[0].trim();
            const dayType = parts[1].trim();
            const description = parts.slice(2).join(':').trim(); // Unir el resto como descripción

            // Validar fecha (formato DD/MM/YYYY)
            const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!dateMatch) {
                errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}' - debe tener formato DD/MM/YYYY`);
                continue;
            }

            const [, day, month, year] = dateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            // Verificar que la fecha es válida
            if (isNaN(date.getTime()) ||
                date.getDate() !== parseInt(day) ||
                date.getMonth() !== parseInt(month) - 1 ||
                date.getFullYear() !== parseInt(year)) {
                errors.push(`Línea ${i + 1}: Fecha inválida '${dateStr}'`);
                continue;
            }

            // Determinar el tipo de día
            let isHoliday = false;
            let isLectiveDay = true;
            let eventType = null;

            // Si el tipo contiene 'F' es festivo
            if (dayType.includes('F')) {
                isHoliday = true;
                isLectiveDay = false;
            }

            // Si el tipo contiene letras del alfabeto (que no sean F), es un evento etiquetado
            const eventMatch = dayType.match(/[A-EG-Z]/); // Cualquier letra excepto F
            if (eventMatch) {
                eventType = eventMatch[0];
            }

            console.log(`Processing day: ${dateStr} -> Type: ${dayType}, Holiday: ${isHoliday}, Event: ${eventType}`);

            // Verificar si el día ya existe para este calendario
            const existingDay = await dayRepo.findOne({
                where: {
                    calendar: { id: calendarId },
                    date: date
                }
            });

            if (existingDay) {
                // Actualizar si hay cambios
                let hasChanges = false;
                const changes = [];

                if (existingDay.isHoliday !== isHoliday) {
                    existingDay.isHoliday = isHoliday;
                    hasChanges = true;
                    changes.push(`isHoliday: ${existingDay.isHoliday} -> ${isHoliday}`);
                }

                if (existingDay.isLectiveDay !== isLectiveDay) {
                    existingDay.isLectiveDay = isLectiveDay;
                    hasChanges = true;
                    changes.push(`isLectiveDay: ${existingDay.isLectiveDay} -> ${isLectiveDay}`);
                }

                if (existingDay.eventType !== eventType) {
                    existingDay.eventType = eventType;
                    hasChanges = true;
                    changes.push(`eventType: ${existingDay.eventType} -> ${eventType}`);
                }

                if (existingDay.description !== description) {
                    existingDay.description = description;
                    hasChanges = true;
                    changes.push(`description updated`);
                }

                if (hasChanges) {
                    await dayRepo.save(existingDay);
                    processedDays.push({
                        date: dateStr,
                        dayType,
                        isHoliday,
                        isLectiveDay,
                        eventType,
                        description,
                        action: 'updated',
                        changes,
                        line: i + 1
                    });
                    console.log(`Updated day: ${dateStr} (${changes.join(', ')})`);
                } else {
                    processedDays.push({
                        date: dateStr,
                        dayType,
                        isHoliday,
                        isLectiveDay,
                        eventType,
                        description,
                        action: 'skipped',
                        reason: 'already exists with same data',
                        line: i + 1
                    });
                    console.log(`Skipped day: ${dateStr} (already exists)`);
                }
            } else {
                // Crear nuevo día
                const day = dayRepo.create({
                    date,
                    isHoliday,
                    isLectiveDay,
                    eventType,
                    description,
                    calendar
                });
                await dayRepo.save(day);
                processedDays.push({
                    date: dateStr,
                    dayType,
                    isHoliday,
                    isLectiveDay,
                    eventType,
                    description,
                    action: 'created',
                    line: i + 1
                });
                console.log(`Created day: ${dateStr}`);
            }

        } catch (error) {
            const errorMsg = `Línea ${i + 1}: Error procesando - ${error instanceof Error ? error.message : error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
        }
    }

    const result = {
        processed: true,
        totalLines: lines.filter(line => line.trim()).length,
        processedCount: processedDays.length,
        errorCount: errors.length,
        days: processedDays,
        errors: errors
    };

    console.log(`Calendario processing completed:`, result);
    return result;
};