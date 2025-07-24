import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Classroom } from '@/entities/classroom.entity';

export const getClassrooms = async (_req: Request, res: Response) => {

    try {
        const classrooms = await AppDataSource.getRepository(Classroom).find();
        res.status(200).json({
            status: 'success',
            message: 'Classrooms fetched successfully',
            data: {
                classrooms
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching classrooms',
            data: error
        });
    }
};
