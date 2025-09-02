import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Degree } from '@/entities/degree.entity';

export const getDegrees = async (_req: Request, res: Response) => {
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

export const createDegree = async (req: Request, res: Response) => {
    const { name, acronym } = req.body;

    if (!name)
        res.status(400).json({
            status: 'error',
            message: 'Name is required',
            data: null,
        });

    if (!acronym)
        res.status(400).json({
            status: 'error',
            message: 'Acronym is required',
            data: null,
        });

    try {
        const existingDegree = await AppDataSource.getRepository(Degree).findOneBy([
            { name },
            { acronym }
        ]);

        if (existingDegree) {
            res.status(409).json({
                status: 'error',
                message: 'Degree with the same name or acronym already exists',
                data: null,
            });
        }

        const degree = new Degree();
        degree.name = name;
        degree.acronym = acronym;

        const savedDegree = await AppDataSource.getRepository(Degree).save(degree);

        res.status(201).json({
            status: 'success',
            message: 'Degree created successfully',
            data: {
                degree: savedDegree
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error creating degree',
            data: null,
        });
    }
}


export const deleteDegree = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const degreeRepo = AppDataSource.getRepository(Degree);

        const result = await degreeRepo.delete(id);

        if (result.affected === 0) {
            res.status(404).json({
                status: "error",
                message: "Degree not found",
                data: null
            });
        }

        res.status(200).json({
            status: "success",
            message: "Degree deleted successfully",
            data: null
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error deleting degree",
            data: error
        });
    }
};
