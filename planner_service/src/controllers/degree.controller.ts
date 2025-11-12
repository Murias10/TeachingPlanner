import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';

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

        // Proceder directamente con la eliminación
        const result = await degreeRepo.delete(id);

        if (result.affected === 0) {
            res.status(404).json({
                status: "error",
                message: "Degree not found or already deleted",
                data: null
            });
            return;
        }

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