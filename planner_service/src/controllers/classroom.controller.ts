import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Classroom } from '@/entities/classroom.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { validate as isUUID } from "uuid";
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';

export const getClassrooms = async (_req: AuditedRequest, res: Response) => {

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


export const createClassroom = async (req: AuditedRequest, res: Response) => {
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

        const userEmail = getUserEmailFromRequest(req);
        const classroom = classroomRepo.create({ code, gisUrl, createdBy: userEmail });
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


export const deleteClassroom = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const classroomRepo = AppDataSource.getRepository(Classroom);
        const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

        const classroom = await classroomRepo.findOne({ where: { id } });

        if (!classroom) {
            res.status(404).json({
                status: "error",
                message: "No se encontró el aula",
                data: null,
            });
            return;
        }

        // Verificar eventos puntuales relacionados
        const relatedPunctualEvents = await puntualEventRepo
            .createQueryBuilder("puntualEvent")
            .innerJoin("puntualEvent.classrooms", "classroom")
            .where("classroom.id = :id", { id })
            .getCount();

        // Verificar eventos periódicos relacionados
        const relatedPeriodicEvents = await periodicEventRepo
            .createQueryBuilder("periodicEvent")
            .innerJoin("periodicEvent.classrooms", "classroom")
            .where("classroom.id = :id", { id })
            .getCount();

        const totalRelatedEvents = relatedPunctualEvents + relatedPeriodicEvents;

        if (totalRelatedEvents > 0) {
            res.status(409).json({
                status: "error",
                message: "No se puede eliminar el aula porque tiene eventos asociados",
                data: { relatedEvents: totalRelatedEvents },
            });
            return;
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

export const updateClassroom = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, gisUrl } = req.body;

        // Validar que el ID sea un UUID válido
        if (!id || typeof id !== "string" || !isUUID(id)) {
            res.status(400).json({
                status: "error",
                message: "Invalid classroom ID",
                data: null,
            });
            return;
        }

        // Validación de campos obligatorios
        const missingFields = [];
        if (!code) missingFields.push("code");
        if (!gisUrl) missingFields.push("gisUrl");

        if (missingFields.length > 0) {
            res.status(400).json({
                status: "error",
                message: `Faltan los siguientes campos obligatorios: ${missingFields.join(", ")}`,
                data: null,
            });
            return;
        }

        const classroomRepo = AppDataSource.getRepository(Classroom);

        // Verificar que el classroom existe
        const classroom = await classroomRepo.findOne({ where: { id } });

        if (!classroom) {
            res.status(404).json({
                status: "error",
                message: "Classroom not found",
                data: null,
            });
            return;
        }

        // Actualizar solo el gisUrl (el code no se puede modificar)
        classroom.gisUrl = gisUrl;
        classroom.updatedBy = getUserEmailFromRequest(req);
        classroom.updatedAt = new Date();

        await classroomRepo.save(classroom);

        res.status(200).json({
            status: "success",
            message: "Classroom updated successfully",
            data: { classroom },
        });
    } catch (error) {
        console.error("Error updating classroom:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error updating classroom",
            data: error instanceof Error ? error.message : error,
        });
    }
};
