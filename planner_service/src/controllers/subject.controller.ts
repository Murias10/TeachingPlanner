import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Subject } from '@/entities/subject.entity';
import { Degree } from '@/entities/degree.entity';
import { validate as isValidUUID } from 'uuid';

export const createSubject = async (req: Request, res: Response) => {
    try {
        const { acronym, year, name, siesCode, semester, degree } = req.body;

        // Validación de campos obligatorios
        const missingFields = [];
        if (!acronym) missingFields.push("acronym");
        // Cambio: validar que year sea un número válido, no solo truthy
        if (year === undefined || year === null || !Number.isInteger(Number(year))) {
            missingFields.push("year");
        }
        if (!name) missingFields.push("name");
        if (!siesCode) missingFields.push("siesCode");
        // Cambio: validar que semester sea un número válido, no solo truthy
        if (semester === undefined || semester === null || !Number.isInteger(Number(semester))) {
            missingFields.push("semester");
        }
        if (!degree || typeof degree !== "object") missingFields.push("degree");
        else {
            if (!degree.id) missingFields.push("degree.id");
        }

        if (missingFields.length > 0) {
            res.status(400).json({
                status: "error",
                message: `Faltan los siguientes campos obligatorios: ${missingFields.join(", ")}`,
                data: null
            });
            return
        }

        // Validación adicional de rangos
        const yearNum = Number(year);
        const semesterNum = Number(semester);

        if (yearNum < 1 || yearNum > 4) {
            res.status(400).json({
                status: "error",
                message: "El año debe estar entre 1 y 4",
                data: null
            });
            return
        }

        if (semesterNum < 1 || semesterNum > 2) {
            res.status(400).json({
                status: "error",
                message: "El semestre debe ser 1 o 2",
                data: null
            });
            return
        }

        // Verificar que el degree exista en la base de datos
        const degreeRepo = AppDataSource.getRepository(Degree);
        const existingDegree = await degreeRepo.findOne({ where: { id: degree.id } });

        if (!existingDegree) {
            res.status(404).json({
                status: "error",
                message: `No se encontró ningún degree con el id '${degree.id}'`,
                data: null
            });
            return
        }

        const subjectRepo = AppDataSource.getRepository(Subject);

        // Verificar si ya existe una asignatura con los mismos valores
        const existingSubject = await subjectRepo.findOne({
            where: {
                name,
                acronym,
                degree: { id: degree.id }
            }
        });

        if (existingSubject) {
            res.status(409).json({
                status: "error",
                fields: ["name", "acronym"],
                message: "Ya existe una asignatura con esos valores para esa titulación",
                data: null
            });
            return
        }

        // Crear y guardar la nueva asignatura - asegurar conversión a números
        const subject = subjectRepo.create({
            acronym,
            year: yearNum,     // Asegurar que se guarde como número
            name,
            siesCode,
            semester: semesterNum, // Asegurar que se guarde como número
            degree: existingDegree // Usar la entidad completa encontrada
        });

        await subjectRepo.save(subject);

        res.status(201).json({
            status: "success",
            message: "Asignatura creada exitosamente",
            data: { subject }
        });
    } catch (error) {
        console.error("Error al crear la asignatura:", error);
        res.status(500).json({
            status: "error",
            message: "Error al crear la asignatura",
            data: error instanceof Error ? error.message : error
        });
    }
};

export const deleteSubject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== "string") {
            res.status(400).json({
                status: "error",
                message: "El parámetro 'id' es obligatorio y debe ser un UUID válido",
                data: null
            });
            return
        }

        const subjectRepo = AppDataSource.getRepository(Subject);
        const deleteResult = await subjectRepo.delete(id);

        if (deleteResult.affected === 0) {
            res.status(404).json({
                status: "error",
                message: `No se encontró ninguna asignatura con el id '${id}'`,
                data: null
            });
            return
        }

        res.status(200).json({
            status: "success",
            message: "Asignatura eliminada correctamente",
            data: { id }
        });
    } catch (error) {
        console.error("Error al eliminar la asignatura:", error);
        res.status(500).json({
            status: "error",
            message: "Error inesperado al eliminar la asignatura",
            data: error instanceof Error ? error.message : error
        });
    }
};

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
    const degreeId = req.params.id;

    // Validación de tipo y formato
    if (!degreeId || typeof degreeId !== 'string') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid degree ID format',
            data: null,
        });
        return
    }

    // Validación de UUID
    if (!isValidUUID(degreeId)) {
        res.status(400).json({
            status: 'error',
            message: 'Degree ID must be a valid UUID',
            data: null,
        });
        return
    }

    try {
        const degreeRepository = AppDataSource.getRepository(Degree);
        const subjectRepository = AppDataSource.getRepository(Subject);

        // Verificar que el degree existe
        const degreeExists = await degreeRepository.findOne({
            where: { id: degreeId }
        });

        if (!degreeExists) {
            res.status(404).json({
                status: 'error',
                message: 'Degree not found',
                data: null,
            });

            return
        }

        // Buscar asignaturas por ID de grado
        const subjects = await subjectRepository.find({
            where: {
                degree: { id: degreeId }
            },
            relations: ['degree'],
            order: {
                year: 'ASC',
                semester: 'ASC',
                name: 'ASC'
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Subjects fetched successfully',
            data: {
                subjects,
                degreeInfo: {
                    id: degreeExists.id,
                    name: degreeExists.name,
                    acronym: degreeExists.acronym
                }
            },
        });

    } catch (error) {
        console.error('Error fetching subjects by degree ID:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching subjects',
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
        return
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
        console.error('Error fetching subjects with events and groups:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching subjects with events and groups',
            data: error instanceof Error ? error.message : error,
        });
    }
};