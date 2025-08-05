
import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { User } from '@/entities/user.entity';

export const getAllUsers = async (_req: Request, res: Response) => {
    const users = await AppDataSource.getRepository(User).find();
    res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, firstSurname, secondSurname, role, password } = req.body;
        const user = AppDataSource.getRepository(User).create({ name, firstSurname, secondSurname, role, password });
        const result = await AppDataSource.getRepository(User).save(user);
        res.status(201).json(result);
    } catch (error) {

        res.status(500).json({ message: 'Internal server error' });
    }
};
