import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';

export const getDegrees = async (_req: Request, res: Response) => {
    try {
        const degrees = await AppDataSource.getRepository(Degree).find();
        res.status(200).json({
            status: 'success',
            message: 'Degrees fetched successfully',
            data: {
                degrees
            }
        });
    } catch (error) {
        console.error('Error fetching degrees:', error);
        res.status(500).json({
            status: 'error',
            data: null,
        });
    }
};
