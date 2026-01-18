import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Course } from '@/entities/course.entity';
import { validate as isUUID } from "uuid";
import { Calendar } from '@/entities/calendar.entity';
import { Degree } from '@/entities/degree.entity';
import { Subject } from '@/entities/subject.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';

export const getCourses = async (_req: AuditedRequest, res: Response) => {
    try {
        const courses = await AppDataSource.getRepository(Course).find({
            relations: ['calendars']
        })

        // Ordenar calendarios por semestre para cada curso
        courses.forEach(course => {
            if (course.calendars && course.calendars.length > 0) {
                course.calendars.sort((a, b) => a.semester - b.semester);
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Courses fetched successfully',
            data: { courses },
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching courses',
            data: null,
        })
    }
}

export const getCoursesByDegreeId = async (req: AuditedRequest, res: Response) => {
    const degreeId = req.params.id?.trim();

    // Validación básica
    if (!degreeId || typeof degreeId !== "string" || !isUUID(degreeId)) {
        res.status(400).json({
            status: "error",
            message: "Invalid degree ID",
            data: null,
        });
    }

    try {
        const courses = await AppDataSource.getRepository(Course).find({
            where: {
                degree: { id: degreeId }
            },
            relations: ["degree", "calendars"]
        });

        // Ordenar por año de inicio
        courses.sort((a, b) => a.startYear - b.startYear);

        // Ordenar calendarios por semestre para cada curso
        courses.forEach(course => {
            if (course.calendars && course.calendars.length > 0) {
                course.calendars.sort((a, b) => a.semester - b.semester);
            }
        });

        res.status(200).json({
            status: "success",
            message: "Courses fetched successfully",
            data: { courses },
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching courses",
            data: null,
        });
    }
};

export const getCoursesByDegreeAcronym = async (req: AuditedRequest, res: Response) => {
    const acronym = req.params.acronym?.trim();

    // Validación básica
    if (!acronym || typeof acronym !== "string" || acronym.length === 0) {
        res.status(400).json({
            status: "error",
            message: "Invalid or missing degree acronym",
            data: null,
        });
        return
    }

    try {
        const degreeRepository = AppDataSource.getRepository(Degree);
        const courseRepository = AppDataSource.getRepository(Course);

        // Buscar el degree por acronym primero
        const degree = await degreeRepository.findOne({
            where: { acronym: acronym }
        });

        if (!degree) {
            res.status(404).json({
                status: "error",
                message: `No se encontró un degree con el acrónimo: ${acronym}`,
                data: null,
            });
            return
        }

        // Buscar los courses usando el degree encontrado
        const courses = await courseRepository.find({
            where: {
                degree: { id: degree.id }
            },
            relations: ["degree", "calendars"]
        });

        // Ordenar por año de inicio
        courses.sort((a, b) => a.startYear - b.startYear);

        // Ordenar calendarios por semestre para cada curso
        courses.forEach(course => {
            if (course.calendars && course.calendars.length > 0) {
                course.calendars.sort((a, b) => a.semester - b.semester);
            }
        });

        res.status(200).json({
            status: "success",
            message: "Courses fetched successfully",
            data: {
                courses,
                degreeInfo: {
                    id: degree.id,
                    name: degree.name,
                    acronym: degree.acronym
                }
            },
        });
    } catch (error) {
        console.error("Error fetching courses by degree acronym:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching courses",
            data: null,
        });
    }
};

export const createCourse = async (req: AuditedRequest, res: Response) => {
    try {
        const { startYear, endYear, state, degree } = req.body;

        // Validación de campos obligatorios
        const missingFields = [];
        if (startYear === undefined || startYear === null || !Number.isInteger(Number(startYear))) {
            missingFields.push("startYear");
        }
        if (endYear === undefined || endYear === null || !Number.isInteger(Number(endYear))) {
            missingFields.push("endYear");
        }
        if (!state) missingFields.push("state");
        if (!degree || typeof degree !== "object") missingFields.push("degree");
        else {
            if (!degree.id) missingFields.push("degree.id");
        }

        if (missingFields.length > 0) {
            res.status(400).json({
                status: "error",
                message: `Faltan los siguientes campos obligatorios: ${missingFields.join(", ")}`,
                data: null
            });
            return
        }

        // Verificar que el degree exista en la base de datos
        const degreeRepo = AppDataSource.getRepository(Degree);
        const existingDegree = await degreeRepo.findOne({ where: { id: degree.id } });

        if (!existingDegree) {
            res.status(404).json({
                status: "error",
                message: `No se encontró ningún degree con el id '${degree.id}'`,
                data: null
            });
            return
        }

        const courseRepo = AppDataSource.getRepository(Course);

        const existingCourse = await courseRepo.findOne({
            where: {
                startYear: Number(startYear),
                endYear: Number(endYear),
                degree: { id: degree.id }
            }
        });

        if (existingCourse) {
            res.status(409).json({
                status: "error",
                message: "Ya existe un curso con esos valores para esa titulación",
                data: null
            });
            return
        }

        const userEmail = getUserEmailFromRequest(req);
        const course = courseRepo.create({
            startYear: Number(startYear),
            endYear: Number(endYear),
            state,
            degree: existingDegree,
            createdBy: userEmail
        });

        await courseRepo.save(course);

        res.status(201).json({
            status: "success",
            message: "Course created successfully",
            data: { course }
        });

    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error creating course",
            data: error instanceof Error ? error.message : error,
        });
    }
}

export const deleteCourse = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const courseRepo = AppDataSource.getRepository(Course);

        // Verificar si el curso existe
        const course = await courseRepo.findOne({ where: { id } });

        if (!course) {
            res.status(404).json({
                status: "error",
                message: "Course not found",
                data: null,
            });
            return;
        }

        console.log(`[DELETE COURSE] Starting deletion for course ${id}...`);

        // Paso 1: Obtener todos los subjects de todos los calendarios del curso
        const subjectRepo = AppDataSource.getRepository(Subject);
        const subjects = await subjectRepo.find({
            where: { calendar: { course: { id } } },
            relations: ['groups'],
            select: { id: true, groups: { id: true } }
        });

        const groupIds = subjects.flatMap(s => s.groups.map(g => g.id));
        console.log(`[DELETE COURSE] Found ${groupIds.length} groups to clean`);

        // Paso 2: Limpiar las tablas junction de los grupos
        if (groupIds.length > 0) {
            console.log(`[DELETE COURSE] Cleaning junction tables...`);

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

        // Paso 3: Eliminar el curso (la cascada eliminará todos los calendarios y sus datos)
        console.log(`[DELETE COURSE] Deleting course...`);
        await courseRepo.remove(course);

        console.log('[DELETE COURSE] Course deleted successfully');

        res.status(200).json({
            status: "success",
            message: "Course deleted successfully",
            data: null,
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error deleting course",
            data: error instanceof Error ? error.message : error,
        });
    }
};

export const updateCourse = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { startYear, endYear, state } = req.body;

        // Validar que el ID sea un UUID válido
        if (!id || typeof id !== "string" || !isUUID(id)) {
            res.status(400).json({
                status: "error",
                message: "Invalid course ID",
                data: null,
            });
            return;
        }

        // Validación de campos obligatorios
        const missingFields = [];
        if (startYear === undefined || startYear === null || !Number.isInteger(Number(startYear))) {
            missingFields.push("startYear");
        }
        if (endYear === undefined || endYear === null || !Number.isInteger(Number(endYear))) {
            missingFields.push("endYear");
        }
        if (!state) missingFields.push("state");

        if (missingFields.length > 0) {
            res.status(400).json({
                status: "error",
                message: `Faltan los siguientes campos obligatorios: ${missingFields.join(", ")}`,
                data: null,
            });
            return;
        }

        const courseRepo = AppDataSource.getRepository(Course);

        // Verificar que el curso existe
        const course = await courseRepo.findOne({ where: { id } });

        if (!course) {
            res.status(404).json({
                status: "error",
                message: "Course not found",
                data: null,
            });
            return;
        }

        // Actualizar solo los campos permitidos
        course.startYear = Number(startYear);
        course.endYear = Number(endYear);
        course.state = state;
        course.updatedBy = getUserEmailFromRequest(req);
        course.updatedAt = new Date();

        await courseRepo.save(course);

        res.status(200).json({
            status: "success",
            message: "Course updated successfully",
            data: { course },
        });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error updating course",
            data: error instanceof Error ? error.message : error,
        });
    }
};