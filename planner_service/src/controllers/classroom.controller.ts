import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Classroom } from '@/entities/classroom.entity';
import { Event } from '@/entities/event.entity';

export const getClassrooms = async (_req: Request, res: Response) => {

    try {
        const classrooms = await AppDataSource.getRepository(Classroom).find();
        res.status(200).json({
            status: 'success',
            message: 'Classrooms fetched successfully',
            data: { classrooms }
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
    const { code, gisUrl } = req.body;

    // Validaciones
    if (!code) {
        res.status(400).json({
            status: "error",
            message: "Code is required",
            data: null,
        });
        return;
    }

    if (!gisUrl) {
        res.status(400).json({
            status: "error",
            message: "GIS URL is required",
            data: null,
        });
        return;
    }

    try {
        const classroomRepo = AppDataSource.getRepository(Classroom);

        const conflicts: string[] = [];

        const codeExists = await classroomRepo.findOneBy({ code });
        if (codeExists) conflicts.push("code");

        const gisUrlExists = await classroomRepo.findOneBy({ gisUrl });
        if (gisUrlExists) conflicts.push("gisUrl");

        if (conflicts.length > 0) {
            res.status(409).json({
                status: "error",
                message: "Classroom already exists with conflicting fields",
                data: {
                    fields: conflicts,
                },
            });
            return;
        }

        const classroom = classroomRepo.create({ code, gisUrl });
        const savedClassroom = await classroomRepo.save(classroom);

        res.status(201).json({
            status: "success",
            message: "Classroom created successfully",
            data: {
                classroom: savedClassroom,
            },
        });
    } catch (error) {
        console.error("Error creating classroom:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while creating classroom",
            data: error instanceof Error ? error.message : error,
        });
    }
};


export const deleteClassroom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const classroomRepo = AppDataSource.getRepository(Classroom);
        const eventRepo = AppDataSource.getRepository(Event);

        const classroom = await classroomRepo.findOne({ where: { id } });

        if (!classroom) {
            res.status(404).json({
                status: "error",
                message: "No se encontró el aula",
                data: null,
            });
        }

        const relatedEvents = await eventRepo
            .createQueryBuilder("event")
            .innerJoin("event.classrooms", "classroom")
            .where("classroom.id = :id", { id })
            .getCount();

        if (relatedEvents > 0) {
            res.status(409).json({
                status: "error",
                message: "No se puede eliminar el aula porque tiene eventos asociados",
                data: { relatedEvents },
            });
        }

        await classroomRepo.delete(id);

        res.status(200).json({
            status: "success",
            message: "Aula eliminada correctamente",
            data: { id },
        });
    } catch (error) {
        console.error("Error al eliminar el aula:", error);
        res.status(500).json({
            status: "error",
            message: "Error inesperado al eliminar el aula",
            data: error instanceof Error ? error.message : error,
        });
    }
};
