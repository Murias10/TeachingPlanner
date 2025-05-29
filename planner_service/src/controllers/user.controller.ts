
import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { User } from '@/entities/User';

export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await AppDataSource.getRepository(User).find();
    res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, gender } = req.body;

    const user = AppDataSource.getRepository(User).create({ name, email, gender });
    const result = await AppDataSource.getRepository(User).save(user);

    res.status(201).json(result);
};
