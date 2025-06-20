
import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';

export const getAllDegrees = async (_req: Request, res: Response) => {
    const users = await AppDataSource.getRepository(Degree).find();
    res.json(users);
};
