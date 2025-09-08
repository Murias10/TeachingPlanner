import { Request, Response } from "express";
import { AppDataSource } from "@/config/data-source";
import { User } from "@/entities/user.entity";
import bcrypt from "bcrypt";
import { generateToken } from "@/utils/jwt";

const userRepo = AppDataSource.getRepository(User);

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await userRepo.findOneBy({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: "Credenciales inválidas" });
        return;
    }
    const token = generateToken({ userId: user.id });
    res.json({ token });
};
