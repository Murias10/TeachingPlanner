import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Subject } from '@/entities/subject.entity';

export const getSubjects = async (_req: Request, res: Response) => {
    try {
        const subjects = await AppDataSource.getRepository(Subject).find();
        res.status(200).json({
            status: 'success',
            message: 'Subjects fetched successfully',
            data: {
                subjects
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching subjects',
            data: null
        });
    }
};


export const getSubjectsByDegreeId = async (req: Request, res: Response) => {
    // 🧠 Capturar UUID desde la URL (ej: /subjects/degree/45fa2a5b-... )
    const degreeId = req.params.id;

    // ⚠️ Validación básica
    if (!degreeId || typeof degreeId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid degree ID',
            data: null,
        });
        return;
    }

    try {
        // 🔍 Buscar asignaturas por ID de grado
        const subjects = await AppDataSource.getRepository(Subject).findBy({
            degree: { id: degreeId },
        });

        // 🚀 Enviar respuesta
        res.status(200).json({
            status: 'success',
            message: 'Subjects fetched successfully',
            data: { subjects },
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching subjects',
            data: null,
        });
    }
}