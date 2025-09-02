import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Course } from '@/entities/course.entity';
import { validate as isUUID } from "uuid";
import { Calendar } from '@/entities/calendar.entity';

export const getCourses = async (_req: Request, res: Response) => {
    try {
        const courses = await AppDataSource.getRepository(Course).find({
            relations: ['calendars']
        })

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

export const getCoursesByDegreeId = async (req: Request, res: Response) => {
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


export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const courseRepo = AppDataSource.getRepository(Course);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Verificar si el curso existe
        const course = await courseRepo.findOne({ where: { id } });

        if (!course) {
            res.status(404).json({
                status: "error",
                message: "Course not found",
                data: null,
            });
        }

        // Verificar si hay calendarios asociados
        const relatedCalendars = await calendarRepo.count({ where: { course: { id } } });

        if (relatedCalendars > 0) {
            res.status(409).json({
                status: "error",
                message: "Cannot delete course: calendars are linked to it",
                data: { relatedCalendars },
            });
        }

        // Eliminar el curso
        const result = await courseRepo.delete(id);

        if (result.affected === 0) {
            res.status(404).json({
                status: "error",
                message: "Course not found during deletion",
                data: null,
            });
        }

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