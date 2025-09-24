import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Calendar } from '@/entities/calendar.entity';
import { Course } from '@/entities/course.entity';
import { Classroom } from '@/entities/classroom.entity';
import multer from 'multer';
import { validate as isValidUUID } from 'uuid';

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
        const result = await processImportedFiles(files);
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

// Función para procesar archivos importados
const processImportedFiles = async (files: Express.Multer.File[]) => {
    const importResult: any = {};

    for (const file of files) {
        const content = file.buffer.toString('utf-8');

        switch (file.originalname) {
            case 'ubicaciones.txt':
                const classroomsResult = await processUbicacionesFile(content);
                importResult.classrooms = classroomsResult;
                break;

            case 'calendario.txt':
                // Almacenar para procesamiento futuro
                importResult.calendario = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length
                };
                break;

            case 'asignaturas.txt':
                // Almacenar para procesamiento futuro
                importResult.asignaturas = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length
                };
                break;

            case 'horarios.txt':
                // Almacenar para procesamiento futuro
                importResult.horarios = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length
                };
                break;

            case 'excepciones.txt':
                // Almacenar para procesamiento futuro
                importResult.excepciones = {
                    processed: false,
                    message: 'File uploaded but not processed yet',
                    lines: content.split('\n').length
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