import { Response } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '@/config/data-source';
import { EventRequest } from '@/entities/event-request.entity';
import { Calendar } from '@/entities/calendar.entity';
import { Day } from '@/entities/day.entity';
import { PuntualEvent } from '@/entities/puntual_event.entity';
import { Group } from '@/entities/group.entity';
import { Classroom } from '@/entities/classroom.entity';
import { AuditedRequest } from '@/types/audit.types';
import { getUserEmailFromRequest } from '@/utils/audit.utils';
import { EventRequestService } from '@/services/event-request.service';

const eventRequestService = new EventRequestService();

/**
 * Create a new event request (PROFESSOR only)
 * Teacher requests to create a PUNTUAL or PERIODIC event
 */
export const createEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId, eventType, eventData } = req.body;
        const userEmail = getUserEmailFromRequest(req);

        // Validations
        if (!userEmail) {
            res.status(401).json({
                status: 'error',
                message: 'User email not found in request',
                data: null,
            });
            return;
        }

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
            professorId: userEmail,
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
        const { status, calendarId, professorId } = req.query;

        const filters: any = {};
        if (status) filters.status = status as string;
        if (calendarId) filters.calendarId = calendarId as string;
        if (professorId) filters.professorId = professorId as string;

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
    const { dayId, eventDate, startTime, endTime, groupIds = [], classroomIds = [], comment = '' } = eventData;

    if (!startTime || !endTime) {
        throw new Error('Missing required fields for PUNTUAL event: startTime, endTime');
    }

    // Use either dayId or eventDate to find the day
    if (!dayId && !eventDate) {
        throw new Error('Missing required fields for PUNTUAL event: either dayId or eventDate must be provided');
    }

    const dayRepo = AppDataSource.getRepository(Day);
    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);
    const calendarRepo = AppDataSource.getRepository(Calendar);

    // Get the day
    let day;
    if (dayId) {
        // If dayId is provided, use it directly
        day = await dayRepo.findOne({
            where: { id: dayId },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.classrooms'],
        });
    } else if (eventDate) {
        // If eventDate is provided, find the day by date and calendar
        const eventDateTime = new Date(eventDate);
        const calendar = await calendarRepo.findOne({ where: { id: calendarId } });

        if (!calendar) {
            throw new Error('Calendar not found');
        }

        day = await dayRepo.findOne({
            where: {
                date: eventDateTime,
                calendar: { id: calendarId }
            },
            relations: ['puntualEvents', 'puntualEvents.groups', 'puntualEvents.classrooms', 'calendar'],
        });
    }

    if (!day) {
        throw new Error('Day not found for the provided date or dayId');
    }

    // Validate conflicts: check if there are events at the same time with the same group or classroom
    const conflictingEvents = day.puntualEvents?.filter(event => {
        const eventStart = event.startTime;
        const eventEnd = event.endTime;
        const hasTimeOverlap = startTime < eventEnd && endTime > eventStart;

        if (!hasTimeOverlap) return false;

        // Check if shares group
        const sharesGroup = event.groups?.some(g => groupIds.includes(g.id)) || groupIds.length === 0;
        // Check if shares classroom
        const sharesClassroom = event.classrooms?.some(c => classroomIds.includes(c.id)) || classroomIds.length === 0;

        return sharesGroup && sharesClassroom;
    });

    if (conflictingEvents && conflictingEvents.length > 0) {
        const conflictDetails = conflictingEvents.map(e => ({
            id: e.id,
            startTime: e.startTime,
            endTime: e.endTime
        }));
        throw new Error(`Time conflict: Same group/classroom already has an event at this time. Conflicts: ${JSON.stringify(conflictDetails)}`);
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
        createdBy: eventRequest.professorId,
    });

    const savedEvent = await puntualEventRepo.save(puntualEvent);
    return savedEvent.id;
}

/**
 * Delete an event request (PROFESSOR only - can only delete own requests)
 */
export const deleteEventRequest = async (req: AuditedRequest, res: Response) => {
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

        // Check if user is the owner of the request (only PROFESSOR who created it can delete)
        if (eventRequest.professorId !== userEmail) {
            res.status(403).json({
                status: 'error',
                message: 'You can only delete your own event requests',
                data: null,
            });
            return;
        }

        // Can only delete PENDING requests
        if (eventRequest.status !== 'PENDING') {
            res.status(400).json({
                status: 'error',
                message: `Cannot delete a request with status: ${eventRequest.status}. Only PENDING requests can be deleted.`,
                data: null,
            });
            return;
        }

        // Delete the request
        await eventRequestService.delete(id);

        res.status(200).json({
            status: 'success',
            message: 'Event request deleted successfully',
            data: {
                requestId: id,
            },
        });
    } catch (error) {
        console.error('Error deleting event request:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting event request',
            data: error instanceof Error ? error.message : error,
        });
    }
};

/**
 * Helper function to create a PERIODIC_EVENT from an event request
 * Note: For now, PERIODIC events from solicitations are not supported
 * This is a placeholder for future implementation
 */
async function createPeriodicEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { eventData } = eventRequest;
    const { startTime, endTime, frequency } = eventData;

    if (!startTime || !endTime) {
        throw new Error('Missing required fields for PERIODIC event: startTime, endTime');
    }

    if (!frequency) {
        throw new Error('Missing required field for PERIODIC event: frequency');
    }

    // For now, throw an error as PERIODIC events from solicitations are not yet implemented
    throw new Error('PERIODIC events from solicitations are not yet implemented. Only PUNTUAL event requests are supported.');
}
