import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Subject } from '@/entities/subject.entity';

export const getSubjects = async (_req: Request, res: Response) => {
    try {
        const subjects = await AppDataSource.getRepository(Subject).find();
        res.status(200).json({
            status: 'success',
            message: 'Subjects fetched successfully',
            data: {
                subjects
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching subjects',
            data: null
        });
    }
};