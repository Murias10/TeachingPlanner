import { Request, Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Event } from '@/entities/event.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Day } from '@/entities/day.entity';

export const getCalendars = async (_req: Request, res: Response) => {
    try {
        const calendars = await AppDataSource.getRepository(Calendar).find();
        res.status(200).json({
            status: 'success',
            message: 'Calendars fetched successfully',
            data: { calendars }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendars',
            data: error
        });
    }
};

export const getCalendarById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const calendar = await AppDataSource.getRepository(Calendar).findOne({
            where: { id }
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Calendar fetched successfully',
            data: { calendar }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching calendar',
            data: error
        });
    }
};

export const createCalendar = async (req: Request, res: Response) => {
    const { idCourse, semester, start, end } = req.body;

    // Validaciones
    if (!idCourse) {
        res.status(400).json({
            status: "error",
            message: "Course ID is required",
            data: null,
        });
        return;
    }

    if (!semester) {
        res.status(400).json({
            status: "error",
            message: "Semester is required",
            data: null,
        });
        return;
    }

    if (!start) {
        res.status(400).json({
            status: "error",
            message: "Start date is required",
            data: null,
        });
        return;
    }

    if (!end) {
        res.status(400).json({
            status: "error",
            message: "End date is required",
            data: null,
        });
        return;
    }

    // Validar que la fecha de inicio sea anterior a la de fin
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
        res.status(400).json({
            status: "error",
            message: "Start date must be before end date",
            data: null,
        });
        return;
    }

    try {
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Verificar si ya existe un calendario para el mismo curso y semestre
        const existingCalendar = await calendarRepo.findOne({
            where: {
                course: { id: idCourse },
                semester
            }
        });

        if (existingCalendar) {
            res.status(409).json({
                status: "error",
                message: "Calendar already exists for this course and semester",
                data: {
                    existing: existingCalendar
                },
            });
            return;
        }

        const calendar = calendarRepo.create({
            course: { id: idCourse },
            semester,
            start: startDate,
            end: endDate
        });

        const savedCalendar = await calendarRepo.save(calendar);

        res.status(201).json({
            status: "success",
            message: "Calendar created successfully",
            data: {
                calendar: savedCalendar,
            },
        });
    } catch (error) {
        console.error("Error creating calendar:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error while creating calendar",
            data: error instanceof Error ? error.message : error,
        });
    }
};

export const deleteCalendar = async (req: Request, res: Response) => {
    const calendarId = req.params.id?.trim();
    const forceDelete = req.query.force === "true";

    if (!calendarId || typeof calendarId !== "string") {
        res.status(400).json({
            status: "error",
            message: "Invalid calendar ID",
            data: null,
        });
    }

    try {
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const dayRepo = AppDataSource.getRepository(Day);
        const eventRepo = AppDataSource.getRepository(Event);

        // Verificar si el calendario existe
        const calendar = await calendarRepo.findOne({ where: { id: calendarId } });

        if (!calendar) {
            res.status(404).json({
                status: "error",
                message: "Calendar not found",
                data: null,
            });
        }

        // Buscar días asociados al calendario
        const days = await dayRepo.find({ where: { calendar: { id: calendarId } } });

        if (days.length === 0) {
            await calendarRepo.delete(calendarId);
            res.status(200).json({
                status: "success",
                message: "Calendar deleted successfully",
                data: null,
            });
        }

        // Buscar eventos asociados a esos días
        const dayIds = days.map(day => day.id);

        const relatedEvents = await eventRepo
            .createQueryBuilder("event")
            .innerJoin("event.day", "day")
            .where("day.id IN (:...dayIds)", { dayIds })
            .getMany();

        if (relatedEvents.length > 0 && !forceDelete) {
            res.status(409).json({
                status: "warning",
                message: "Calendar has events linked to its days",
                data: { relatedEvents: relatedEvents.length },
            });
            return;
        }

        // Borrar eventos
        if (relatedEvents.length > 0) {
            await Promise.all(relatedEvents.map(event => eventRepo.delete(event.id)));
        }

        // Borrar días
        await Promise.all(days.map(day => dayRepo.delete(day.id)));

        // Borrar calendario
        await calendarRepo.delete(calendarId);

        res.status(200).json({
            status: "success",
            message: "Calendar and related data deleted successfully",
            data: null,
        });
    } catch (error) {
        console.error("Error deleting calendar:", error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error deleting calendar",
            data: error instanceof Error ? error.message : error,
        });
    }
};