import { Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '@/config/data-source';
import { EventRequest } from '@/entities/event-request.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Day } from '@/entities/day.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { Group } from '@/entities/group.entity';
import { Classroom } from '@/entities/classroom.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';
import { EventRequestService } from '@/services/event-request.service';

const eventRequestService = new EventRequestService();

/**
 * Create a new event request (TEACHER only)
 * Teacher requests to create a PUNTUAL or PERIODIC event
 */
export const createEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId, eventType, eventData } = req.body;
        const userEmail = getUserEmailFromRequest(req);

        // Validations
        if (!calendarId || !eventType || !eventData) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: calendarId, eventType, eventData',
                data: null,
            });
            return;
        }

        if (!['PUNTUAL', 'PERIODIC'].includes(eventType)) {
            res.status(400).json({
                status: 'error',
                message: 'eventType must be PUNTUAL or PERIODIC',
                data: null,
            });
            return;
        }

        // Verify calendar exists
        const calendarRepo = AppDataSource.getRepository(Calendar);
        const calendar = await calendarRepo.findOne({ where: { id: calendarId } });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
                data: null,
            });
            return;
        }

        // Create the event request
        const newEventRequest = await eventRequestService.create({
            calendarId,
            eventType: eventType as 'PUNTUAL' | 'PERIODIC',
            eventData,
            teacherId: userEmail,
            status: 'PENDING',
            createdBy: userEmail,
        });

        res.status(201).json({
            status: 'success',
            message: 'Event request created successfully',
            data: {
                requestId: newEventRequest.id,
                status: newEventRequest.status,
            },
        });
    } catch (error) {
        console.error('Error creating event request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating event request',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Get event requests with optional filters (ADMIN only)
 * Filters: status, calendarId
 */
export const getEventRequests = async (req: AuditedRequest, res: Response) => {
    try {
        const { status, calendarId, teacherId } = req.query;

        const filters: any = {};
        if (status) filters.status = status as string;
        if (calendarId) filters.calendarId = calendarId as string;
        if (teacherId) filters.teacherId = teacherId as string;

        const requests = await eventRequestService.findAll(filters);

        res.status(200).json({
            status: 'success',
            message: 'Event requests fetched successfully',
            data: {
                requests,
                count: requests.length,
            },
        });
    } catch (error) {
        console.error('Error fetching event requests:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching event requests',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Get a specific event request by ID
 */
export const getEventRequestById = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const eventRequest = await eventRequestService.findById(id);

        if (!eventRequest) {
            res.status(404).json({
                status: 'error',
                message: 'Event request not found',
                data: null,
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Event request fetched successfully',
            data: eventRequest,
        });
    } catch (error) {
        console.error('Error fetching event request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching event request',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Approve an event request and create the event (ADMIN only)
 * Creates either PUNTUAL_EVENT or PERIODIC_EVENT based on eventType
 */
export const approveEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userEmail = getUserEmailFromRequest(req);

        // Get the request
        const eventRequest = await eventRequestService.findById(id);

        if (!eventRequest) {
            res.status(404).json({
                status: 'error',
                message: 'Event request not found',
                data: null,
            });
            return;
        }

        if (eventRequest.status !== 'PENDING') {
            res.status(400).json({
                status: 'error',
                message: `Cannot approve a request with status: ${eventRequest.status}`,
                data: null,
            });
            return;
        }

        try {
            let createdEventId: string;

            if (eventRequest.eventType === 'PUNTUAL') {
                createdEventId = await createPuntualEventFromRequest(eventRequest);
            } else {
                createdEventId = await createPeriodicEventFromRequest(eventRequest);
            }

            // Update the request status
            const updatedRequest = await eventRequestService.update(id, {
                status: 'APPROVED',
                reviewedBy: userEmail,
                reviewedAt: new Date(),
                updatedBy: userEmail,
                updatedAt: new Date(),
            });

            res.status(200).json({
                status: 'success',
                message: 'Event request approved and event created',
                data: {
                    requestId: id,
                    eventId: createdEventId,
                    requestStatus: updatedRequest?.status,
                },
            });
        } catch (eventError) {
            console.error('Error creating event from request:', eventError);
            res.status(500).json({
                status: 'error',
                message: 'Event request approved but failed to create event',
                data: {
                    error: eventError instanceof Error ? eventError.message : eventError,
                },
            });
        }
    } catch (error) {
        console.error('Error approving event request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error approving event request',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Reject an event request (ADMIN only)
 */
export const rejectEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { comments = '' } = req.body;
        const userEmail = getUserEmailFromRequest(req);

        // Get the request
        const eventRequest = await eventRequestService.findById(id);

        if (!eventRequest) {
            res.status(404).json({
                status: 'error',
                message: 'Event request not found',
                data: null,
            });
            return;
        }

        if (eventRequest.status !== 'PENDING') {
            res.status(400).json({
                status: 'error',
                message: `Cannot reject a request with status: ${eventRequest.status}`,
                data: null,
            });
            return;
        }

        // Update the request status
        const updatedRequest = await eventRequestService.update(id, {
            status: 'REJECTED',
            reviewedBy: userEmail,
            reviewedAt: new Date(),
            comments,
            updatedBy: userEmail,
            updatedAt: new Date(),
        });

        res.status(200).json({
            status: 'success',
            message: 'Event request rejected',
            data: {
                requestId: id,
                requestStatus: updatedRequest?.status,
            },
        });
    } catch (error) {
        console.error('Error rejecting event request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error rejecting event request',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Helper function to create a PUNTUAL_EVENT from an event request
 */
async function createPuntualEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { calendarId, eventData } = eventRequest;
    const { dayId, startTime, endTime, groupIds = [], classroomIds = [], comment = '' } = eventData;

    if (!dayId || !startTime || !endTime) {
        throw new Error('Missing required fields for PUNTUAL event: dayId, startTime, endTime');
    }

    const dayRepo = AppDataSource.getRepository(Day);
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    // Get the day
    const day = await dayRepo.findOne({
        where: { id: dayId },
        relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.classrooms'],
    });

    if (!day) {
        throw new Error('Day not found');
    }

    // Get groups and classrooms
    const groups = groupIds.length > 0 ? await groupRepo.find({ where: { id: In(groupIds) } }) : [];
    const classrooms = classroomIds.length > 0 ? await classroomRepo.find({ where: { id: In(classroomIds) } }) : [];

    // Create the event
    const puntualEvent = puntualEventRepo.create({
        day,
        startTime,
        endTime,
        cancelled: false,
        comment: comment || '',
        groups,
        classrooms,
        createdBy: eventRequest.teacherId,
    });

    const savedEvent = await puntualEventRepo.save(puntualEvent);
    return savedEvent.id;
}

/**
 * Helper function to create a PERIODIC_EVENT from an event request
 */
async function createPeriodicEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { calendarId, eventData } = eventRequest;
    const { startTime, endTime, weekDay, eventCharacter, groupIds = [], classroomIds = [], plannedHours = 0 } = eventData;

    if (!startTime || !endTime || weekDay === undefined || eventCharacter === undefined) {
        throw new Error('Missing required fields for PERIODIC event: startTime, endTime, weekDay, eventCharacter');
    }

    const calendarRepo = AppDataSource.getRepository(Calendar);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    // Get the calendar
    const calendar = await calendarRepo.findOne({ where: { id: calendarId } });

    if (!calendar) {
        throw new Error('Calendar not found');
    }

    // Get groups and classrooms
    const groups = groupIds.length > 0 ? await groupRepo.find({ where: { id: In(groupIds) } }) : [];
    const classrooms = classroomIds.length > 0 ? await classroomRepo.find({ where: { id: In(classroomIds) } }) : [];

    // Extract year from calendar (assuming calendar has start date)
    const year = new Date(calendar.start).getFullYear();

    // Create the event
    const periodicEvent = periodicEventRepo.create({
        calendar,
        startTime,
        endTime,
        weekDay,
        eventCharacter,
        year,
        plannedHours,
        groups,
        classrooms,
        createdBy: eventRequest.teacherId,
    });

    const savedEvent = await periodicEventRepo.save(periodicEvent);
    return savedEvent.id;
}
