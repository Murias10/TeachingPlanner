import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Course } from '@/entities/course.entity';

export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await AppDataSource.getRepository(Course).find();
        res.status(200).json({
            status: 'success',
            message: 'Courses fetched successfully',
            data: {
                courses
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching courses',
            data: null,
        });
    }
}


export const getCoursesByDegreeId = async (req: Request, res: Response) => {
    // 🧠 Capturar UUID desde la URL (ej: /courses/degree/45fa2a5b-... )
    const degreeId = req.params.id;

    // ⚠️ Validación básica
    if (!degreeId || typeof degreeId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid degree ID',
            data: null,
        });
    }

    try {
        // 🔍 Buscar cursos por ID de grado
        const courses = await AppDataSource.getRepository(Course).findBy({
            degree: { id: degreeId },
        });

        // 📅 Ordenar por año de inicio (de menor a mayor)
        courses.sort((a, b) => a.startYear - b.startYear);

        // 🚀 Enviar respuesta
        res.status(200).json({
            status: 'success',
            message: 'Courses fetched successfully',
            data: { courses },
        });
    } catch (error) {

        res.status(500).json({
            status: 'error',
            message: 'Error fetching courses',
            data: null,
        });
    }
};
