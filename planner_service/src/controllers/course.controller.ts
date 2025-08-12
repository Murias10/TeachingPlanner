import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Course } from '@/entities/course.entity';

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

export const getCoursesByDegreeAcronym = async (req: Request, res: Response) => {
    const degreeAcronym = req.params.acronym.toLowerCase()

    if (!degreeAcronym || typeof degreeAcronym !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid degree acronym',
            data: null,
        })
        return
    }

    try {
        const courses = await AppDataSource.getRepository(Course).find({
            where: {
                degree: { acronym: degreeAcronym },
            },
            relations: ['calendars']
        })

        courses.sort((a, b) => a.startYear - b.startYear)

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
    const degreeId = req.params.id

    if (!degreeId || typeof degreeId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid degree ID',
            data: null,
        })
    }

    try {
        const courses = await AppDataSource.getRepository(Course).find({
            where: {
                degree: { id: degreeId },
            },
            relations: ['calendars'], // 👈 Incluye la relación
        })

        courses.sort((a, b) => a.startYear - b.startYear)

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
};