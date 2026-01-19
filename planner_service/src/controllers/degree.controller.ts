import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';
import { Course } from '@/entities/course.entity';
import { Group } from '@/entities/group.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export const getDegrees = async (_req: AuditedRequest, res: Response) => {
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

        res.status(500).json({
            status: 'error',
            message: 'Error fetching degrees',
            data: null,
        });
    }
};

export const getDegreeByAcronym = async (req: AuditedRequest, res: Response) => {
    const { acronym } = req.params;
    try {
        const degree = await AppDataSource.getRepository(Degree).findOneBy({ acronym });

        if (!degree) {
            res.status(404).json({
                status: 'error',
                message: 'Degree not found',
                data: null,
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Degree fetched successfully',
            data: degree,
        });

    } catch (error) {

        res.status(500).json({
            status: 'error',
            message: 'Error fetching degree',
            data: null,
        });
    }
}

export const createDegree = async (req: AuditedRequest, res: Response) => {
    const { name, acronym } = req.body;

    // Validaciones
    if (!name) {
        res.status(400).json({
            status: "error",
            message: "Name is required",
            data: null,
        });
        return;
    }

    if (!acronym) {
        res.status(400).json({
            status: "error",
            message: "Acronym is required",
            data: null,
        });
        return;
    }

    try {
        const degreeRepo = AppDataSource.getRepository(Degree);

        const conflicts: string[] = [];

        const nameExists = await degreeRepo.findOneBy({ name });
        if (nameExists) conflicts.push("name");

        const acronymExists = await degreeRepo.findOneBy({ acronym });
        if (acronymExists) conflicts.push("acronym");

        if (conflicts.length > 0) {
            res.status(409).json({
                status: "error",
                message: "Degree already exists with conflicting fields",
                data: {
                    fields: conflicts,
                },
            });
            return;
        }

        const userEmail = getUserEmailFromRequest(req);
        console.log('🔍 Create Degree - User email from request:', userEmail, 'req.user:', req.user);
        const degree = degreeRepo.create({ name, acronym, createdBy: userEmail });
        const savedDegree = await degreeRepo.save(degree);

        res.status(201).json({
            status: "success",
            message: "Degree created successfully",
            data: {
                degree: savedDegree,
            },
        });
    } catch (error) {
        console.error("Error creating degree:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while creating degree",
            data: error instanceof Error ? error.message : error,
        });
    }
};

export const updateDegree = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, acronym } = req.body;

        // Validar que el ID esté presente
        if (!id) {
            res.status(400).json({
                status: "error",
                message: "Degree ID is required",
                data: null
            });
            return;
        }

        // Validar campos obligatorios
        if (!name) {
            res.status(400).json({
                status: "error",
                message: "Name is required",
                data: null
            });
            return;
        }

        if (!acronym) {
            res.status(400).json({
                status: "error",
                message: "Acronym is required",
                data: null
            });
            return;
        }

        const degreeRepo = AppDataSource.getRepository(Degree);

        // Verificar que la titulación existe
        const degree = await degreeRepo.findOneBy({ id });
        if (!degree) {
            res.status(404).json({
                status: "error",
                message: "Degree not found",
                data: null
            });
            return;
        }

        // Verificar conflictos de unicidad (solo si cambiaron)
        const conflicts: string[] = [];

        if (name !== degree.name) {
            const nameExists = await degreeRepo.findOneBy({ name });
            if (nameExists) conflicts.push("name");
        }

        if (acronym !== degree.acronym) {
            const acronymExists = await degreeRepo.findOneBy({ acronym });
            if (acronymExists) conflicts.push("acronym");
        }

        if (conflicts.length > 0) {
            res.status(409).json({
                status: "error",
                message: "Degree already exists with conflicting fields",
                data: {
                    fields: conflicts,
                }
            });
            return;
        }

        // Actualizar los campos
        degree.name = name;
        degree.acronym = acronym;
        const userEmail = getUserEmailFromRequest(req);
        console.log('🔍 Update Degree - User email from request:', userEmail, 'req.user:', req.user);
        degree.updatedBy = userEmail;
        degree.updatedAt = new Date();

        // Guardar los cambios
        const updatedDegree = await degreeRepo.save(degree);

        // Respuesta exitosa
        res.status(200).json({
            status: "success",
            message: "Degree updated successfully",
            data: {
                degree: updatedDegree
            }
        });

    } catch (error) {
        console.error("Error updating degree:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while updating degree",
            data: error instanceof Error ? error.message : error
        });
    }
};

export const deleteDegree = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Validar que el ID esté presente
        if (!id) {
            res.status(400).json({
                status: "error",
                message: "Degree ID is required",
                data: null
            });
            return;
        }

        const degreeRepo = AppDataSource.getRepository(Degree);

        // Verificar que la titulación existe y cargar relaciones necesarias
        const degree = await degreeRepo.findOne({
            where: { id },
            relations: ['courses', 'courses.calendars', 'courses.calendars.groups']
        });

        if (!degree) {
            res.status(404).json({
                status: "error",
                message: "Degree not found",
                data: null
            });
            return;
        }

        // IMPORTANTE: Eliminar primero todos los grupos de todos los calendarios
        // ¿Por qué? Las tablas junction PERIODIC_EVENTS_GROUPS y PUNTUAL_EVENTS_GROUPS tienen
        // ON DELETE NO ACTION en las FK hacia Groups (TypeORM ignora onDelete en @ManyToMany).
        // Al eliminar los Groups con remove(), TypeORM limpia automáticamente las tablas junction.
        // Sin esto, la cascada Degree→Course→Calendar→Groups fallaría.
        const groupRepo = AppDataSource.getRepository(Group);
        const allGroups: Group[] = [];

        if (degree.courses) {
            for (const course of degree.courses) {
                if (course.calendars) {
                    for (const calendar of course.calendars) {
                        if (calendar.groups && calendar.groups.length > 0) {
                            allGroups.push(...calendar.groups);
                        }
                    }
                }
            }
        }

        if (allGroups.length > 0) {
            console.log(`[DELETE DEGREE] Deleting ${allGroups.length} groups from ${degree.acronym}...`);
            await groupRepo.remove(allGroups);
        }

        // Ahora eliminar el degree
        // Por CASCADE a nivel de DB se eliminan automáticamente:
        // - Course (degree.onDelete: CASCADE)
        //   - Calendar (course.onDelete: CASCADE)
        //     - CalendarSync, Day→PuntualEvents, PeriodicEvent (todos onDelete: CASCADE)
        await degreeRepo.remove(degree);

        // Respuesta exitosa
        res.status(200).json({
            status: "success",
            message: "Degree deleted successfully",
            data: {
                deletedId: id
            }
        });

    } catch (error) {
        console.error("Error deleting degree:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while deleting degree",
            data: error instanceof Error ? error.message : error
        });
    }
};