import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Course } from '@/entities/course.entity';
import { Classroom } from '@/entities/classroom.entity';
import multer from 'multer';
import { validate as isValidUUID } from 'uuid';
import { Subject } from '@/entities/subject.entity';
import { Group } from '@/entities/group.entity';
import { Day } from '@/entities/day.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';

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

        // Verificar si el archivo calendario.txt está presente
        const calendarFile = files.find(f => f.originalname === 'calendario.txt');

        if (!calendarFile) {
            res.status(400).json({
                status: 'error',
                message: 'calendario.txt is required to create the calendar',
                data: null
            });
            return;
        }

        // Procesar archivos importados
        // El calendario se creará automáticamente en processCalendarioFile
        const result = await processImportedFiles(files, courseId, parseInt(semester));
        const importResult = result.importResult;

        // Verificar si el calendario fue creado exitosamente
        if (!importResult.calendario || !importResult.calendario.processed) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to process calendario.txt',
                data: importResult.calendario
            });
            return;
        }

        console.log('Calendar created/updated successfully:', importResult.calendario.calendarId);

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

    // Definir el orden de procesamiento
    const processingOrder = [
        'ubicaciones.txt',
        'asignaturas.txt',
        'calendario.txt',  // Debe procesarse antes de horarios.txt
        'horarios.txt',
        'excepciones.txt'
    ];

    // Procesar archivos en el orden definido
    for (const fileName of processingOrder) {
        const file = files.find(f => f.originalname === fileName);

        if (!file) {
            // Si el archivo no está presente, continuar con el siguiente
            continue;
        }

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

            case 'calendario.txt':
                const calendarResult = await processCalendarioFile(content, courseId, semester);
                importResult.calendario = calendarResult;
                break;

            case 'horarios.txt':
                const horariosResult = await processHorariosFile(content, courseId, semester);
                importResult.horarios = horariosResult;
                break;

            case 'excepciones.txt':
                const excepcionesResult = await processExcepcionesFile(content, courseId, semester);
                importResult.excepciones = excepcionesResult;
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
const processCalendarioFile = async (content: string, courseId: string, semester: number) => {
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const courseRepo = AppDataSource.getRepository(Course);
    const lines = content.split('\n');
    const processedDays = [];
    const errors = [];
    const dates: Date[] = [];

    console.log(`Processing calendario.txt with ${lines.length} lines`);

    // Verificar que el curso existe
    let course;
    try {
        course = await courseRepo.findOne({ where: { id: courseId } });

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
    } catch (error) {
        return {
            processed: false,
            error: `Error fetching course: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            days: [],
            errors: [`Error fetching course: ${error instanceof Error ? error.message : error}`]
        };
    }

    console.log(`Found course ${courseId}`);

    // Primera pasada: validar todas las líneas y recolectar fechas válidas
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: date:dayCharacter:comment
            const parts = line.split(':');

            if (parts.length < 3) {
                errors.push(`Línea ${i + 1}: Formato inválido - debe tener exactamente 3 campos separados por ':' (date:dayCharacter:comment)`);
                continue;
            }

            const dateStr = parts[0].trim();

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

            // Agregar fecha válida al array
            dates.push(date);

        } catch (error) {
            const errorMsg = `Línea ${i + 1}: Error validando fecha - ${error instanceof Error ? error.message : error}`;
            errors.push(errorMsg);
            console.error(errorMsg);
        }
    }

    // Verificar que tenemos al menos una fecha válida
    if (dates.length === 0) {
        return {
            processed: false,
            error: 'No valid dates found in file',
            totalLines: lines.filter(line => line.trim()).length,
            processedCount: 0,
            errorCount: errors.length,
            days: [],
            errors: [...errors, 'No valid dates found in file']
        };
    }

    // Obtener fecha más antigua (start) y más reciente (end)
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Buscar o crear el calendario
    let calendar;
    let calendarAction = '';
    try {
        calendar = await calendarRepo.findOne({
            where: {
                course: { id: courseId },
                semester: semester
            }
        });

        if (calendar) {
            // Actualizar fechas del calendario si son diferentes
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
                await calendarRepo.save(calendar);
                calendarAction = 'updated';
                console.log(`Calendar updated with new dates`);
            } else {
                calendarAction = 'existing';
                console.log(`Using existing calendar`);
            }
        } else {
            // Crear nuevo calendario
            calendar = calendarRepo.create({
                course: course,
                semester: semester,
                start: startDate,
                end: endDate
            });
            await calendarRepo.save(calendar);
            calendarAction = 'created';
            console.log(`Calendar created with ID: ${calendar.id}`);
        }
    } catch (error) {
        return {
            processed: false,
            error: `Error creating/updating calendar: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            days: [],
            errors: [`Error creating/updating calendar: ${error instanceof Error ? error.message : error}`]
        };
    }

    // Segunda pasada: procesar y guardar los días
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: date:dayCharacter:comment
            const parts = line.split(':');

            if (parts.length < 3) {
                // Ya registrado en primera pasada
                continue;
            }

            const dateStr = parts[0].trim();
            const dayCharacter = parts[1].trim();
            const comment = parts.slice(2).join(':').trim(); // Unir el resto como comentario

            // Validar que dayCharacter no esté vacío
            if (!dayCharacter) {
                errors.push(`Línea ${i + 1}: dayCharacter vacío`);
                continue;
            }

            // Validar fecha (formato DD/MM/YYYY)
            const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (!dateMatch) {
                // Ya registrado en primera pasada
                continue;
            }

            const [, day, month, year] = dateMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            // Verificar que la fecha es válida
            if (isNaN(date.getTime()) ||
                date.getDate() !== parseInt(day) ||
                date.getMonth() !== parseInt(month) - 1 ||
                date.getFullYear() !== parseInt(year)) {
                // Ya registrado en primera pasada
                continue;
            }

            // Determinar si es lectivo: solo es true si dayCharacter es distinto de  'F'
            const lective = dayCharacter.toUpperCase() !== 'F';

            console.log(`Processing day: ${dateStr} -> Character: ${dayCharacter}, Lective: ${lective}, Comment: ${comment}`);

            // Verificar si el día ya existe para este calendario
            const existingDay = await dayRepo.findOne({
                where: {
                    calendar: { id: calendar.id },
                    date: date
                }
            });

            if (existingDay) {
                // Actualizar si hay cambios
                let hasChanges = false;
                const changes = [];

                if (existingDay.lective !== lective) {
                    existingDay.lective = lective;
                    hasChanges = true;
                    changes.push(`lective: ${existingDay.lective} -> ${lective}`);
                }

                if (existingDay.dayCharacter !== dayCharacter) {
                    existingDay.dayCharacter = dayCharacter;
                    hasChanges = true;
                    changes.push(`dayCharacter: ${existingDay.dayCharacter} -> ${dayCharacter}`);
                }

                if (existingDay.comment !== comment) {
                    existingDay.comment = comment;
                    hasChanges = true;
                    changes.push(`comment updated`);
                }

                if (hasChanges) {
                    await dayRepo.save(existingDay);
                    processedDays.push({
                        date: dateStr,
                        dayCharacter,
                        lective,
                        comment,
                        action: 'updated',
                        changes,
                        line: i + 1
                    });
                    console.log(`Updated day: ${dateStr} (${changes.join(', ')})`);
                } else {
                    processedDays.push({
                        date: dateStr,
                        dayCharacter,
                        lective,
                        comment,
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
                    lective,
                    dayCharacter,
                    comment,
                    calendar
                });
                await dayRepo.save(day);
                processedDays.push({
                    date: dateStr,
                    dayCharacter,
                    lective,
                    comment,
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
        calendarId: calendar.id,
        calendarAction: calendarAction,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalLines: lines.filter(line => line.trim()).length,
        processedCount: processedDays.length,
        errorCount: errors.length,
        days: processedDays,
        errors: errors
    };

    console.log(`Calendario processing completed:`, result);
    return result;
};
// Procesar archivo horarios.txt línea por línea
const processHorariosFile = async (content: string, courseId: string, semester: number) => {
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents = [];
    const errors = [];

    console.log(`Processing horarios.txt with ${lines.length} lines`);

    // Verificar que el calendario existe (AHORA ES OBLIGATORIO)
    let calendar;
    try {
        calendar = await calendarRepo.findOne({
            where: {
                course: { id: courseId },
                semester: semester
            }
        });

        if (!calendar) {
            return {
                processed: false,
                error: `Calendar not found for course ${courseId} and semester ${semester}`,
                totalLines: 0,
                processedCount: 0,
                errorCount: 1,
                events: [],
                errors: [`Calendar not found for course ${courseId} and semester ${semester}. Please process calendario.txt first.`]
            };
        }
    } catch (error) {
        return {
            processed: false,
            error: `Error fetching calendar: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            events: [],
            errors: [`Error fetching calendar: ${error instanceof Error ? error.message : error}`]
        };
    }

    console.log(`Found calendar ${calendar.id}`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: Curso:Asignatura.Tipo.Grupo:DíaSemana:HoraComienzo:HoraFin:Aula:SemanasConClase:NúmeroTotalHoras
            const parts = line.split(':');

            if (parts.length !== 8) {
                errors.push(`Línea ${i + 1}: Formato inválido - debe tener exactamente 8 campos separados por ':'`);
                continue;
            }

            const [
                courseYearStr,
                subjectGroupInfo,
                weekDay,
                startTimeStr,
                endTimeStr,
                classroomCode,
                eventCharacter,
                planifiedHoursStr
            ] = parts.map(p => p.trim());

            // Validar año del curso
            const year = parseInt(courseYearStr, 10);
            if (isNaN(year) || year < 1 || year > 4) {
                errors.push(`Línea ${i + 1}: Curso inválido '${courseYearStr}' - debe ser un número entre 1 y 4`);
                continue;
            }

            // Parsear Asignatura.Tipo.Grupo
            const groupParts = subjectGroupInfo.split('.');
            if (groupParts.length !== 3) {
                errors.push(`Línea ${i + 1}: Formato de grupo inválido '${subjectGroupInfo}' - debe ser Asignatura.Tipo.Grupo`);
                continue;
            }

            const [subjectAcronym, groupType, groupInfo] = groupParts;

            // Parsear el campo de grupo (ejemplo: "I-5" para inglés o "5" para español)
            let language: string;
            let groupNumber: number;

            if (groupInfo.includes('-')) {
                // Formato: I-5 (inglés)
                const groupMatch = groupInfo.match(/^I-(\d+)$/);
                if (!groupMatch) {
                    errors.push(`Línea ${i + 1}: Formato de grupo inválido '${groupInfo}' - debe ser I-Número para inglés (ej: I-5)`);
                    continue;
                }
                language = 'EN';
                groupNumber = parseInt(groupMatch[1], 10);
            } else {
                // Formato: 5 (español por defecto)
                groupNumber = parseInt(groupInfo, 10);
                if (isNaN(groupNumber)) {
                    errors.push(`Línea ${i + 1}: Número de grupo inválido '${groupInfo}' - debe ser un número (ej: 5) o I-Número (ej: I-5)`);
                    continue;
                }
                language = 'ES';
            }

            // Validar día de la semana
            const weekDayUpper = weekDay.toUpperCase();
            if (!['L', 'M', 'X', 'J', 'V'].includes(weekDayUpper)) {
                errors.push(`Línea ${i + 1}: Día de la semana inválido '${weekDay}' - debe ser L, M, X, J o V`);
                continue;
            }

            // Validar horas (formato HH.MM o HH:MM)
            const normalizeTime = (time: string) => time.replace('.', ':');
            const startTime = normalizeTime(startTimeStr);
            const endTime = normalizeTime(endTimeStr);

            const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
            if (!timeRegex.test(startTime)) {
                errors.push(`Línea ${i + 1}: Hora de inicio inválida '${startTimeStr}' - debe tener formato HH:MM o HH.MM`);
                continue;
            }
            if (!timeRegex.test(endTime)) {
                errors.push(`Línea ${i + 1}: Hora de fin inválida '${endTimeStr}' - debe tener formato HH:MM o HH.MM`);
                continue;
            }

            // Validar que hora de inicio < hora de fin
            const [startHour, startMin] = startTime.split(':').map(n => parseInt(n, 10));
            const [endHour, endMin] = endTime.split(':').map(n => parseInt(n, 10));
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (startMinutes >= endMinutes) {
                errors.push(`Línea ${i + 1}: Hora de inicio debe ser anterior a hora de fin`);
                continue;
            }

            // Validar horas planificadas
            const planifiedHours = parseInt(planifiedHoursStr, 10);
            if (isNaN(planifiedHours) || planifiedHours < 0) {
                errors.push(`Línea ${i + 1}: Horas planificadas inválidas '${planifiedHoursStr}'`);
                continue;
            }

            // Validar eventCharacter no vacío
            if (!eventCharacter) {
                errors.push(`Línea ${i + 1}: Semanas con clase (eventCharacter) no puede estar vacío`);
                continue;
            }

            console.log(`Processing event: ${subjectAcronym}.${groupType}.${language}-${groupNumber} on ${weekDay} at ${startTime}-${endTime}`);

            // Buscar la asignatura
            const subject = await subjectRepo.findOne({
                where: {
                    acronym: subjectAcronym
                }
            });

            if (!subject) {
                errors.push(`Línea ${i + 1}: Asignatura no encontrada: ${subjectAcronym}`);
                continue;
            }

            // Buscar o crear el grupo
            let group = await groupRepo.findOne({
                where: {
                    number: groupNumber,
                    type: groupType,
                    language: language,
                    subject: {
                        id: subject.id
                    }
                },
                relations: ['subject']
            });

            if (!group) {
                // Crear el grupo si no existe
                group = groupRepo.create({
                    number: groupNumber,
                    type: groupType,
                    language: language,
                    subject: subject
                });
                await groupRepo.save(group);
                console.log(`Created group: ${subjectAcronym}.${groupType}.${language}-${groupNumber}`);
            }

            // Buscar o crear el aula
            let classroom = await classroomRepo.findOne({
                where: { code: classroomCode }
            });

            if (!classroom) {
                // Crear aula sin URL GIS (se puede actualizar después desde ubicaciones.txt)
                classroom = classroomRepo.create({
                    code: classroomCode,
                    gisUrl: '' // Vacío por defecto
                });
                await classroomRepo.save(classroom);
                console.log(`Created classroom: ${classroomCode} (without GIS URL)`);
            }

            // Verificar si el evento periódico ya existe
            // AÑADIDO: Ahora también buscamos por calendario
            const existingEvent = await periodicEventRepo
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.groups', 'group')
                .leftJoinAndSelect('event.classrooms', 'classroom')
                .where('event.calendar = :calendarId', { calendarId: calendar.id })
                .andWhere('event.year = :year', { year })
                .andWhere('event.weekDay = :weekDay', { weekDay: weekDayUpper })
                .andWhere('event.startTime = :startTime', { startTime: startTime })
                .andWhere('event.endTime = :endTime', { endTime: endTime })
                .andWhere('group.id = :groupId', { groupId: group.id })
                .andWhere('classroom.id = :classroomId', { classroomId: classroom.id })
                .getOne();

            if (existingEvent) {
                // Actualizar si hay cambios
                let hasChanges = false;
                const changes = [];

                if (existingEvent.eventCharacter !== eventCharacter) {
                    existingEvent.eventCharacter = eventCharacter;
                    hasChanges = true;
                    changes.push(`eventCharacter: ${existingEvent.eventCharacter} -> ${eventCharacter}`);
                }

                if (existingEvent.planifiedHours !== planifiedHours) {
                    existingEvent.planifiedHours = planifiedHours;
                    hasChanges = true;
                    changes.push(`planifiedHours: ${existingEvent.planifiedHours} -> ${planifiedHours}`);
                }

                if (hasChanges) {
                    await periodicEventRepo.save(existingEvent);
                    processedEvents.push({
                        year,
                        subject: subjectAcronym,
                        groupType,
                        groupNumber,
                        language,
                        weekDay,
                        time: `${startTime}-${endTime}`,
                        classroom: classroomCode,
                        eventCharacter,
                        planifiedHours,
                        action: 'updated',
                        changes,
                        line: i + 1
                    });
                    console.log(`Updated event: ${subjectAcronym}.${groupType}.${language}-${groupNumber} (${changes.join(', ')})`);
                } else {
                    processedEvents.push({
                        year,
                        subject: subjectAcronym,
                        groupType,
                        groupNumber,
                        language,
                        weekDay,
                        time: `${startTime}-${endTime}`,
                        classroom: classroomCode,
                        eventCharacter,
                        planifiedHours,
                        action: 'skipped',
                        reason: 'already exists with same data',
                        line: i + 1
                    });
                    console.log(`Skipped event: ${subjectAcronym}.${groupType}.${language}-${groupNumber} (already exists)`);
                }
            } else {
                // Crear nuevo evento periódico
                const periodicEvent = periodicEventRepo.create({
                    calendar: calendar,
                    year,
                    weekDay: weekDayUpper,
                    startTime: startTime,
                    endTime: endTime,
                    eventCharacter,
                    planifiedHours,
                    groups: [group],
                    classrooms: [classroom]
                });

                await periodicEventRepo.save(periodicEvent);
                processedEvents.push({
                    year,
                    subject: subjectAcronym,
                    groupType,
                    groupNumber,
                    language,
                    weekDay,
                    time: `${startTime}-${endTime}`,
                    classroom: classroomCode,
                    eventCharacter,
                    planifiedHours,
                    action: 'created',
                    line: i + 1
                });
                console.log(`Created event: ${subjectAcronym}.${groupType}.${language}-${groupNumber}`);
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
        processedCount: processedEvents.length,
        errorCount: errors.length,
        events: processedEvents,
        errors: errors
    };

    console.log(`Horarios processing completed:`, result);
    return result;
};

// Procesar archivo excepciones.txt línea por línea
const processExcepcionesFile = async (content: string, courseId: string, semester: number) => {
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const dayRepo = AppDataSource.getRepository(Day);
    const calendarRepo = AppDataSource.getRepository(Calendar);
    const lines = content.split('\n');
    const processedEvents = [];
    const errors = [];

    console.log(`Processing excepciones.txt with ${lines.length} lines`);

    // Verificar que el calendario existe
    let calendar;
    try {
        calendar = await calendarRepo.findOne({
            where: {
                course: { id: courseId },
                semester: semester
            }
        });

        if (!calendar) {
            return {
                processed: false,
                error: `Calendar not found for course ${courseId} and semester ${semester}`,
                totalLines: 0,
                processedCount: 0,
                errorCount: 1,
                events: [],
                errors: [`Calendar not found for course ${courseId} and semester ${semester}. Please process calendario.txt first.`]
            };
        }
    } catch (error) {
        return {
            processed: false,
            error: `Error fetching calendar: ${error instanceof Error ? error.message : error}`,
            totalLines: 0,
            processedCount: 0,
            errorCount: 1,
            events: [],
            errors: [`Error fetching calendar: ${error instanceof Error ? error.message : error}`]
        };
    }

    console.log(`Found calendar ${calendar.id}`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Saltar líneas vacías
        if (!line) continue;

        try {
            // Parsear línea: Fecha:Acrónimo.[T/S/L/TG].númeroDeGrupo:hora inicio:hora fin:Aula:comentarios
            const parts = line.split(':');

            if (parts.length !== 6) {
                errors.push(`Línea ${i + 1}: Formato inválido - debe tener exactamente 6 campos separados por ':'`);
                continue;
            }

            const [
                dateStr,
                subjectGroupInfo,
                startTimeStr,
                endTimeStr,
                classroomCode,
                comment
            ] = parts.map(p => p.trim());

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

            // Parsear Asignatura.Tipo.Grupo
            const groupParts = subjectGroupInfo.split('.');
            if (groupParts.length !== 3) {
                errors.push(`Línea ${i + 1}: Formato de grupo inválido '${subjectGroupInfo}' - debe ser Asignatura.Tipo.Grupo`);
                continue;
            }

            const [subjectAcronym, groupType, groupInfo] = groupParts;

            // Parsear el campo de grupo (ejemplo: "I-5" para inglés o "5" para español)
            let language: string;
            let groupNumber: number;

            if (groupInfo.includes('-')) {
                // Formato: I-5 (inglés)
                const groupMatch = groupInfo.match(/^I-(\d+)$/);
                if (!groupMatch) {
                    errors.push(`Línea ${i + 1}: Formato de grupo inválido '${groupInfo}' - debe ser I-Número para inglés (ej: I-5)`);
                    continue;
                }
                language = 'EN';
                groupNumber = parseInt(groupMatch[1], 10);
            } else {
                // Formato: 5 (español por defecto)
                groupNumber = parseInt(groupInfo, 10);
                if (isNaN(groupNumber)) {
                    errors.push(`Línea ${i + 1}: Número de grupo inválido '${groupInfo}' - debe ser un número (ej: 5) o I-Número (ej: I-5)`);
                    continue;
                }
                language = 'ES';
            }

            // Determinar si es un evento cancelado
            const cancelled = startTimeStr === '-1';

            // Validar horas
            let startTime: string = '';
            let endTime: string = '';

            if (cancelled) {
                // Si está cancelado, usar 00:00 para startTime pero guardar el endTime real
                startTime = '00:00';

                // Validar y normalizar la hora de fin
                const normalizeTime = (time: string) => time.replace('.', ':');
                endTime = normalizeTime(endTimeStr);

                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                if (!timeRegex.test(endTime)) {
                    errors.push(`Línea ${i + 1}: Hora de fin inválida '${endTimeStr}' - debe tener formato HH:MM o HH.MM`);
                    continue;
                }
            } else {
                // Validar horas normalmente
                const normalizeTime = (time: string) => time.replace('.', ':');
                startTime = normalizeTime(startTimeStr);
                endTime = normalizeTime(endTimeStr);

                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                if (!timeRegex.test(startTime)) {
                    errors.push(`Línea ${i + 1}: Hora de inicio inválida '${startTimeStr}' - debe tener formato HH:MM o HH.MM, o -1 para cancelación`);
                    continue;
                }
                if (!timeRegex.test(endTime)) {
                    errors.push(`Línea ${i + 1}: Hora de fin inválida '${endTimeStr}' - debe tener formato HH:MM o HH.MM`);
                    continue;
                }

                // Validar que hora de inicio < hora de fin
                const [startHour, startMin] = startTime.split(':').map(n => parseInt(n, 10));
                const [endHour, endMin] = endTime.split(':').map(n => parseInt(n, 10));
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                if (startMinutes >= endMinutes) {
                    errors.push(`Línea ${i + 1}: Hora de inicio debe ser anterior a hora de fin`);
                    continue;
                }
            }

            console.log(`Processing puntual event: ${dateStr} - ${subjectAcronym}.${groupType}.${language}-${groupNumber} ${cancelled ? '(CANCELLED)' : `at ${startTime}-${endTime}`}`);

            // Buscar el día en el calendario
            const dayEntity = await dayRepo.findOne({
                where: {
                    calendar: { id: calendar.id },
                    date: date
                }
            });

            if (!dayEntity) {
                errors.push(`Línea ${i + 1}: Día no encontrado en el calendario para la fecha ${dateStr}. No se puede crear el evento puntual.`);
                console.warn(`Day not found for date ${dateStr}, skipping puntual event`);
                continue;
            }

            // Buscar la asignatura
            const subject = await subjectRepo.findOne({
                where: {
                    acronym: subjectAcronym
                }
            });

            if (!subject) {
                errors.push(`Línea ${i + 1}: Asignatura no encontrada: ${subjectAcronym}`);
                continue;
            }

            // Buscar o crear el grupo
            let group = await groupRepo.findOne({
                where: {
                    number: groupNumber,
                    type: groupType,
                    language: language,
                    subject: {
                        id: subject.id
                    }
                },
                relations: ['subject']
            });

            if (!group) {
                // Crear el grupo si no existe
                group = groupRepo.create({
                    number: groupNumber,
                    type: groupType,
                    language: language,
                    subject: subject
                });
                await groupRepo.save(group);
                console.log(`Created group: ${subjectAcronym}.${groupType}.${language}-${groupNumber}`);
            }

            // Buscar o crear el aula
            let classroom = await classroomRepo.findOne({
                where: { code: classroomCode }
            });

            if (!classroom) {
                // Crear aula sin URL GIS
                classroom = classroomRepo.create({
                    code: classroomCode,
                    gisUrl: ''
                });
                await classroomRepo.save(classroom);
                console.log(`Created classroom: ${classroomCode} (without GIS URL)`);
            }

            // Verificar si el evento puntual ya existe
            const existingEvent = await puntualEventRepo
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.groups', 'group')
                .leftJoinAndSelect('event.classrooms', 'classroom')
                .where('event.day = :dayId', { dayId: dayEntity.id })
                .andWhere('event.startTime = :startTime', { startTime: startTime })
                .andWhere('event.endTime = :endTime', { endTime: endTime })
                .andWhere('group.id = :groupId', { groupId: group.id })
                .andWhere('classroom.id = :classroomId', { classroomId: classroom.id })
                .getOne();

            if (existingEvent) {
                // Actualizar si hay cambios
                let hasChanges = false;
                const changes = [];

                if (existingEvent.cancelled !== cancelled) {
                    existingEvent.cancelled = cancelled;
                    hasChanges = true;
                    changes.push(`cancelled: ${existingEvent.cancelled} -> ${cancelled}`);
                }

                if (existingEvent.comment !== comment) {
                    existingEvent.comment = comment;
                    hasChanges = true;
                    changes.push(`comment updated`);
                }

                if (hasChanges) {
                    await puntualEventRepo.save(existingEvent);
                    processedEvents.push({
                        date: dateStr,
                        subject: subjectAcronym,
                        groupType,
                        groupNumber,
                        language,
                        time: cancelled ? `CANCELLED (ends at ${endTime})` : `${startTime}-${endTime}`,
                        classroom: classroomCode,
                        cancelled,
                        comment,
                        action: 'updated',
                        changes,
                        line: i + 1
                    });
                    console.log(`Updated puntual event: ${dateStr} ${subjectAcronym}.${groupType}.${language}-${groupNumber} (${changes.join(', ')})`);
                } else {
                    processedEvents.push({
                        date: dateStr,
                        subject: subjectAcronym,
                        groupType,
                        groupNumber,
                        language,
                        time: cancelled ? `CANCELLED (ends at ${endTime})` : `${startTime}-${endTime}`,
                        classroom: classroomCode,
                        cancelled,
                        comment,
                        action: 'skipped',
                        reason: 'already exists with same data',
                        line: i + 1
                    });
                    console.log(`Skipped puntual event: ${dateStr} ${subjectAcronym}.${groupType}.${language}-${groupNumber} (already exists)`);
                }
            } else {
                // Crear nuevo evento puntual
                const puntualEvent = puntualEventRepo.create({
                    day: dayEntity,
                    startTime: startTime,
                    endTime: endTime,
                    cancelled: cancelled,
                    comment: comment,
                    groups: [group],
                    classrooms: [classroom]
                });

                await puntualEventRepo.save(puntualEvent);
                processedEvents.push({
                    date: dateStr,
                    subject: subjectAcronym,
                    groupType,
                    groupNumber,
                    language,
                    time: cancelled ? `CANCELLED (ends at ${endTime})` : `${startTime}-${endTime}`,
                    classroom: classroomCode,
                    cancelled,
                    comment,
                    action: 'created',
                    line: i + 1
                });
                console.log(`Created puntual event: ${dateStr} ${subjectAcronym}.${groupType}.${language}-${groupNumber}`);
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
        processedCount: processedEvents.length,
        errorCount: errors.length,
        events: processedEvents,
        errors: errors
    };

    console.log(`Excepciones processing completed:`, result);
    return result;
};

export const getCalendarEvents = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID sea un UUID válido
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
        const dayRepo = AppDataSource.getRepository(Day);

        // Verificar que el calendario existe
        const calendar = await calendarRepo.findOne({
            where: { id },
            relations: ['course']
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        console.log(`Fetching events for calendar ${id}`);

        // Obtener todos los días del calendario
        const days = await dayRepo.find({
            where: { calendar: { id } },
            order: { date: 'ASC' }
        });

        console.log(`Found ${days.length} days in calendar`);

        // Obtener todos los eventos periódicos del calendario
        const periodicEvents = await periodicEventRepo.find({
            where: { calendar: { id } },
            relations: ['groups', 'groups.subject', 'classrooms']
        });

        console.log(`Found ${periodicEvents.length} periodic events`);

        const allEvents: any[] = [];

        // Expandir eventos periódicos en eventos individuales
        for (const periodicEvent of periodicEvents) {
            console.log(`\n=== Processing periodic event ${periodicEvent.id} ===`);

            // FILTRO: Solo procesar eventos con eventCharacter = 'N' por ahora
            if (periodicEvent.eventCharacter.toUpperCase() !== 'N') {
                console.log(`Skipping event with eventCharacter '${periodicEvent.eventCharacter}' (only processing 'N' for now)`);
                continue;
            }

            // Calcular duración del evento en horas
            const [startHour, startMin] = periodicEvent.startTime.split(':').map(Number);
            const [endHour, endMin] = periodicEvent.endTime.split(':').map(Number);
            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            const durationHours = durationMinutes / 60;

            console.log(`Duration: ${durationHours} hours (${startHour}:${startMin} - ${endHour}:${endMin})`);

            // Mapeo de días de la semana
            const weekDayMap: { [key: string]: number } = {
                'L': 1, // Lunes
                'M': 2, // Martes
                'X': 3, // Miércoles
                'J': 4, // Jueves
                'V': 5  // Viernes
            };

            const targetWeekDay = weekDayMap[periodicEvent.weekDay];

            console.log(`Week day: ${periodicEvent.weekDay}, Target day number: ${targetWeekDay}`);
            console.log(`Event character: ${periodicEvent.eventCharacter}`);
            console.log(`Planified hours: ${periodicEvent.planifiedHours}`);

            // Contar cuántas horas ya hemos programado
            let hoursScheduled = 0;
            const maxHours = periodicEvent.planifiedHours;

            // Contadores para debug
            let matchingDays = 0;
            let lectiveDays = 0;
            let eventsCreated = 0;

            // Iterar sobre cada día del calendario
            for (const day of days) {
                // Si ya hemos programado todas las horas, salir
                if (hoursScheduled >= maxHours) {
                    break;
                }

                // Verificar si este día coincide con el día de la semana del evento
                const dayOfWeek = day.date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

                if (dayOfWeek === targetWeekDay) {
                    matchingDays++;

                    // CRÍTICO: Verificar que el día sea lectivo (lective = true)
                    if (!day.lective) {
                        continue; // Saltar días festivos o no lectivos
                    }

                    lectiveDays++;

                    // Para eventCharacter = 'N', hay clase TODAS las semanas en días lectivos
                    const dateKey = day.date.toISOString().split('T')[0];

                    // Determinar cuántas horas programar en este evento
                    const hoursRemaining = maxHours - hoursScheduled;
                    const hoursThisEvent = Math.min(durationHours, hoursRemaining);

                    // Solo crear el evento si hay horas que programar
                    if (hoursThisEvent > 0) {
                        allEvents.push({
                            id: `${periodicEvent.id}-${dateKey}`,
                            date: day.date.toISOString(),
                            startTime: periodicEvent.startTime,
                            endTime: periodicEvent.endTime,
                            duration: hoursThisEvent,
                            subject: periodicEvent.groups[0]?.subject ? {
                                id: periodicEvent.groups[0].subject.id,
                                acronym: periodicEvent.groups[0].subject.acronym,
                                name: periodicEvent.groups[0].subject.name
                            } : null,
                            groups: periodicEvent.groups.map(group => ({
                                id: group.id,
                                number: group.number,
                                type: group.type,
                                language: group.language
                            })),
                            classrooms: periodicEvent.classrooms.map(classroom => ({
                                id: classroom.id,
                                code: classroom.code,
                                gisUrl: classroom.gisUrl
                            })),
                            type: 'periodic',
                            cancelled: false,
                            periodicEventId: periodicEvent.id,
                            dayCharacter: day.dayCharacter,
                            dayComment: day.comment
                        });

                        hoursScheduled += hoursThisEvent;
                        eventsCreated++;
                    }
                }
            }

            console.log(`Stats for event ${periodicEvent.id}:`);
            console.log(`  - Matching weekday days: ${matchingDays}`);
            console.log(`  - Lective days: ${lectiveDays}`);
            console.log(`  - Events created: ${eventsCreated}`);
            console.log(`  - Hours scheduled: ${hoursScheduled}/${maxHours}`);
        }

        // Ordenar eventos por fecha
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log(`\n=== SUMMARY ===`);
        console.log(`Total events generated: ${allEvents.length}`);

        res.status(200).json({
            status: 'success',
            message: 'Calendar events fetched successfully',
            data: {
                calendarId: calendar.id,
                semester: calendar.semester,
                startDate: calendar.start.toISOString(),
                endDate: calendar.end.toISOString(),
                totalEvents: allEvents.length,
                events: allEvents
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
};

// Función auxiliar para calcular el número de semana desde el inicio del calendario
function getWeekNumber(date: Date, startDate: Date): number {
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}