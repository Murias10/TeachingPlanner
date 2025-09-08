import { Request, Response } from "express";
import { AppDataSource } from "@/config/data-source"
import { User } from "@/entities/user.entity";
import bcrypt from "bcrypt";

const userRepo = AppDataSource.getRepository(User);

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, firstSurname, secondSurname, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = userRepo.create({ email, password: hashed, name, firstSurname, secondSurname, role });
    await userRepo.save(user);
    res.status(201).json(user);
};

export const updateUser = async (req: Request, res: Response) => {
    const { name, firstSurname, secondSurname, role } = req.body;
    const user = await userRepo.findOneBy({ id: req.params.id });
    if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
    }
    user.name = name;
    user.firstSurname = firstSurname;
    user.secondSurname = secondSurname;
    user.role = role;
    await userRepo.save(user);
    res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
    const user = await userRepo.findOneBy({ id: req.params.id });
    if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
    }
    await userRepo.remove(user);
    res.json({ message: "Usuario eliminado" });
};
