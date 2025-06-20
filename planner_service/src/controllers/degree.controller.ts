
import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';

export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await AppDataSource.getRepository(Degree).find();
    res.json(users);
};
