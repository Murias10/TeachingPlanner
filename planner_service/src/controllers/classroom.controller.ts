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


export const createClassroom = async (req: Request, res: Response) => {
    try {
        const { code, gisUrl } = req.body;

        if (!code) {
            res.status(400).json({
                status: "error",
                message: "El campo 'code' es obligatorio",
                data: null
            });
        }

        const classroomRepo = AppDataSource.getRepository(Classroom);

        const existing = await classroomRepo.findOne({ where: { code } });
        if (existing) {
            res.status(409).json({
                status: "error",
                message: "El aula ya existe",
                data: null
            });
        }

        const classroom = classroomRepo.create({ code, gisUrl });
        await classroomRepo.save(classroom);

        res.status(201).json({
            status: "success",
            message: "Classroom created successfully",
            data: { classroom }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error creating classroom",
            data: error
        });
    }
};


export const deleteClassroom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const classroomRepo = AppDataSource.getRepository(Classroom);

        const result = await classroomRepo.delete(id);

        if (result.affected === 0) {
            res.status(404).json({
                status: "error",
                message: "Classroom not found",
                data: null
            });
        }

        res.status(200).json({
            status: "success",
            message: "Classroom deleted successfully",
            data: null
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error deleting classroom",
            data: error
        });
    }
};
