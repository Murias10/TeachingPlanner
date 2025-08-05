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


export const getSubjectsWithEventsAndGroupsByCourseAndSemester = async (req: Request, res: Response) => {
    const { courseId, semester } = req.params;

    if (!courseId || !semester) {
        res.status(400).json({
            status: 'error',
            message: 'Missing courseId or semester in parameters',
            data: null,
        });
    }

    try {
        const result = await AppDataSource.query(
            `
            SELECT DISTINCT 
                sb.ID as subject_id,
                sb.NAME as subject_name,
                sb.ACRONYM as subject_acronym,
                sb.SEMESTER as subject_semester,
                sb.YEAR as subject_year,
                gr.ID as group_id,
                gr.NUMBER as group_number,
                gr.TYPE as group_type,
                gr.LANGUAGE as group_language
            FROM CALENDARS ca
            JOIN DAYS da ON da.ID_CALENDAR = ca.ID
            JOIN EVENTS ev ON ev.ID_DAY = da.ID
            JOIN EVENT_GROUPS eg ON eg.ID_EVENT = ev.ID
            JOIN GROUPS gr ON gr.ID = eg.ID_GROUP
            JOIN SUBJECTS sb ON sb.ID = gr.ID_SUBJECT
            WHERE ca.ID_COURSE = ?
              AND ca.SEMESTER = ?
            `,
            [courseId, semester]
        );

        // Reorganizar por asignaturas y anidar los grupos
        const groupedBySubject = new Map();

        // Tipo para la fila de resultados
        type SubjectGroupRow = {
            subject_id: string;
            subject_name: string;
            subject_acronym: string;
            subject_semester: number;
            subject_year: number;
            group_id: string;
            group_number: number;
            group_type: string;
            group_language: string;
        };

        (result as SubjectGroupRow[]).forEach(row => {
            const {
                subject_id,
                subject_name,
                subject_acronym,
                subject_semester,
                subject_year,
                group_id,
                group_number,
                group_type,
                group_language
            } = row;

            if (!groupedBySubject.has(subject_id)) {
                groupedBySubject.set(subject_id, {
                    id: subject_id,
                    name: subject_name,
                    acronym: subject_acronym,
                    semester: subject_semester,
                    year: subject_year,
                    groups: [],
                });
            }

            groupedBySubject.get(subject_id).groups.push({
                id: group_id,
                number: group_number,
                type: group_type,
                language: group_language,
            });
        });

        res.status(200).json({
            status: 'success',
            message: 'Subjects with events and groups fetched successfully',
            data: {
                subjects: Array.from(groupedBySubject.values()),
            }
        });

    } catch (error) {

        res.status(500).json({
            status: 'error',
            message: 'Error fetching subjects with events and groups',
            data: null,
        });
    }
};
