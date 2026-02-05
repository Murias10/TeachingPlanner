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
 * Create a new event request (PROFESSOR only)
 * Teacher requests to create a PUNTUAL or PERIODIC event
 */
export const createEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { calendarId, eventType, eventData, requestType = 'CREATE', originalEventId = null } = req.body;
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

        if (!['CREATE', 'EDIT', 'CANCEL', 'REPLACE'].includes(requestType)) {
            res.status(400).json({
                status: 'error',
                message: 'requestType must be CREATE, EDIT, CANCEL or REPLACE',
                data: null,
            });
            return;
        }

        if (requestType !== 'CREATE' && !originalEventId) {
            res.status(400).json({
                status: 'error',
                message: 'originalEventId is required for EDIT, CANCEL and REPLACE requests',
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
            requestType: requestType as 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE',
            originalEventId: originalEventId || null,
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
 * Admin can complete missing fields (planifiedHours, classroomIds) before approval
 */
export const approveEventRequest = async (req: AuditedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { planifiedHours, classroomIds } = req.body; // Optional fields completed by admin
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
            // Merge admin-completed data with original request data
            const completedEventData = {
                ...eventRequest.eventData,
                // Override with admin-provided values if present
                ...(planifiedHours !== undefined && { planifiedHours }),
                ...(classroomIds !== undefined && { classroomIds }),
            };

            // Create a modified event request with completed data
            const completedEventRequest = {
                ...eventRequest,
                eventData: completedEventData,
            };

            let createdEventId: string;

            if (eventRequest.requestType === 'EDIT') {
                createdEventId = await editEventFromRequest(completedEventRequest);
            } else if (eventRequest.requestType === 'CANCEL') {
                createdEventId = await cancelEventFromRequest(completedEventRequest);
            } else if (eventRequest.requestType === 'REPLACE') {
                createdEventId = await replaceEventFromRequest(completedEventRequest);
            } else if (eventRequest.eventType === 'PUNTUAL') {
                // CREATE puntual
                createdEventId = await createPuntualEventFromRequest(completedEventRequest);
            } else {
                // CREATE periodic
                createdEventId = await createPeriodicEventFromRequest(completedEventRequest);
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
    const { dayId, eventDate, startTime, endTime, groupIds = [], classroomIds = [], comment = '', eventType: requestedEventType = 'NORMAL' } = eventData;

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
        if (event.cancelled) return false;

        const eventStart = event.startTime;
        const eventEnd = event.endTime;
        const hasTimeOverlap = startTime < eventEnd && endTime > eventStart;

        if (!hasTimeOverlap) return false;

        // Check if shares group (only if both have groups)
        const sharesGroup = groupIds.length > 0 && event.groups?.some(g => groupIds.includes(g.id));
        // Check if shares classroom (only if both have classrooms)
        const sharesClassroom = classroomIds.length > 0 && event.classrooms?.some(c => classroomIds.includes(c.id));

        return sharesGroup || sharesClassroom;
    });

    if (conflictingEvents && conflictingEvents.length > 0) {
        const conflictDetails = conflictingEvents.map(e => ({
            id: e.id,
            startTime: e.startTime,
            endTime: e.endTime
        }));
        throw new Error(`Time conflict: Same group/classroom already has an event at this time. Conflicts: ${JSON.stringify(conflictDetails)}`);
    }

    // Get groups and validate they belong to the calendar
    const groups = groupIds.length > 0
        ? await groupRepo.find({
            where: {
                id: In(groupIds),
                calendar: { id: calendarId }
            }
        })
        : [];

    // Validate all requested groups were found
    if (groupIds.length > 0 && groups.length !== groupIds.length) {
        throw new Error('Some groups do not belong to this calendar or do not exist');
    }

    const classrooms = classroomIds.length > 0 ? await classroomRepo.find({ where: { id: In(classroomIds) } }) : [];

    // Create the event
    const puntualEvent = puntualEventRepo.create({
        day,
        startTime,
        endTime,
        cancelled: false,
        comment: comment || '',
        eventType: requestedEventType,
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
 * Supports both standard frequencies (weekly, biweekly-even, biweekly-odd) and custom patterns
 */
async function createPeriodicEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { calendarId, eventData } = eventRequest;
    const { startTime, endTime, frequency, weekDays, planifiedHours, groupIds = [], classroomIds = [], eventType: requestedEventType = 'NORMAL' } = eventData;
    const { isSpecialEventType } = await import('@/constants/event-characters.constants');

    // Validations
    if (!startTime || !endTime) {
        throw new Error('Missing required fields for PERIODIC event: startTime, endTime');
    }

    if (!frequency) {
        throw new Error('Missing required field for PERIODIC event: frequency');
    }

    // Handle custom periodic events
    if (frequency === 'custom') {
        return await createCustomPeriodicEventFromRequest(eventRequest);
    }

    // Handle standard periodic events (weekly, biweekly-even, biweekly-odd)
    if (!weekDays || weekDays.length === 0) {
        throw new Error('Missing required field for PERIODIC event: weekDays');
    }

    // planifiedHours only required for NORMAL events
    if (!isSpecialEventType(requestedEventType) && (!planifiedHours || planifiedHours <= 0)) {
        throw new Error('Missing or invalid planifiedHours for PERIODIC event');
    }

    // Map frequency to eventCharacter
    const EVENT_CHARACTERS = {
        NORMAL: 'N',
        PAR: 'P',
        IMPAR: 'I',
    };

    let eventCharacter: string;
    if (frequency === 'weekly') {
        eventCharacter = EVENT_CHARACTERS.NORMAL;
    } else if (frequency === 'biweekly-even') {
        eventCharacter = EVENT_CHARACTERS.PAR;
    } else if (frequency === 'biweekly-odd') {
        eventCharacter = EVENT_CHARACTERS.IMPAR;
    } else {
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    const calendarRepo = AppDataSource.getRepository(Calendar);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    // Verify calendar exists
    const calendar = await calendarRepo.findOne({ where: { id: calendarId } });
    if (!calendar) {
        throw new Error('Calendar not found');
    }

    // Add character to charactersInUse if not already present
    if (!calendar.charactersInUse.includes(eventCharacter)) {
        calendar.charactersInUse += eventCharacter;
        calendar.updatedBy = eventRequest.professorId;
        calendar.updatedAt = new Date();
        await calendarRepo.save(calendar);
        console.log(`[Request Approve - Periodic Event] Added character '${eventCharacter}' to calendar charactersInUse: ${calendar.charactersInUse}`);
    }

    // Get groups with subject relation and validate they belong to the calendar
    const groups = groupIds.length > 0
        ? await groupRepo.find({
            where: {
                id: In(groupIds),
                calendar: { id: calendarId }
            },
            relations: ['subject']
        })
        : [];

    // Validate all requested groups were found
    if (groupIds.length > 0 && groups.length !== groupIds.length) {
        throw new Error('Some groups do not belong to this calendar or do not exist');
    }

    // Get classrooms
    const classrooms = classroomIds.length > 0
        ? await classroomRepo.find({ where: { id: In(classroomIds) } })
        : [];

    // Get year from first group
    const groupYear = groups.length > 0 && groups[0].subject
        ? groups[0].subject.year
        : new Date(calendar.start).getFullYear();

    // Create periodic event for each weekDay
    const createdEventIds: string[] = [];

    for (const weekDay of weekDays) {
        const periodicEvent = periodicEventRepo.create({
            calendar: calendar,
            weekDay: weekDay,
            startTime: startTime,
            endTime: endTime,
            planifiedHours: isSpecialEventType(requestedEventType) ? 0 : planifiedHours,
            eventCharacter: eventCharacter,
            eventType: requestedEventType,
            year: groupYear,
            groups: groups,
            classrooms: classrooms,
            createdBy: eventRequest.professorId
        });

        const savedEvent = await periodicEventRepo.save(periodicEvent);
        createdEventIds.push(savedEvent.id);
    }

    // Update Group.planifiedHours only for NORMAL events
    if (!isSpecialEventType(requestedEventType)) {
        for (const group of groups) {
            if (group.planifiedHours !== planifiedHours) {
                group.planifiedHours = planifiedHours;
                group.updatedBy = eventRequest.professorId;
                group.updatedAt = new Date();
                await groupRepo.save(group);

                // Update ALL PeriodicEvents associated with this group
                const allPeriodicEventsForGroup = await periodicEventRepo
                    .createQueryBuilder('event')
                    .leftJoinAndSelect('event.groups', 'group')
                    .where('group.id = :groupId', { groupId: group.id })
                    .getMany();

                for (const event of allPeriodicEventsForGroup) {
                    if (event.planifiedHours !== planifiedHours) {
                        event.planifiedHours = planifiedHours;
                        event.updatedBy = eventRequest.professorId;
                        event.updatedAt = new Date();
                        await periodicEventRepo.save(event);
                    }
                }

                console.log(`[Request Approve - Periodic Event] Updated planified hours for group ${group.type}-${group.number}`);
            }
        }
    }

    console.log(`[Request Approve - Periodic Event] Created ${createdEventIds.length} periodic events`);

    // Return first event ID
    return createdEventIds[0];
}

/**
 * Helper function to create a CUSTOM PERIODIC EVENT from an event request
 * Handles custom frequency patterns with specific affected dates
 */
async function createCustomPeriodicEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { calendarId, eventData } = eventRequest;
    const {
        startTime,
        endTime,
        affectedDates, // Array de fechas calculadas en el frontend
        planifiedHours,
        groupIds = [],
        classroomIds = [],
        eventType: requestedEventType = 'NORMAL'
    } = eventData;
    const { isSpecialEventType } = await import('@/constants/event-characters.constants');

    // Validations
    if (!startTime || !endTime) {
        throw new Error('Missing required fields for CUSTOM PERIODIC event: startTime, endTime');
    }

    if (!affectedDates || affectedDates.length === 0) {
        throw new Error('Missing or empty affectedDates for CUSTOM PERIODIC event');
    }

    // planifiedHours only required for NORMAL events
    if (!isSpecialEventType(requestedEventType) && (!planifiedHours || planifiedHours <= 0)) {
        throw new Error('Missing or invalid planifiedHours for CUSTOM PERIODIC event');
    }

    const calendarRepo = AppDataSource.getRepository(Calendar);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const dayRepo = AppDataSource.getRepository(Day);
    const groupRepo = AppDataSource.getRepository(Group);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    // Find available character from pool
    const { findAvailableCharacter } = await import('@/constants/event-characters.constants');

    const calendar = await calendarRepo.findOne({ where: { id: calendarId } });
    if (!calendar) {
        throw new Error('Calendar not found');
    }

    const eventCharacter = findAvailableCharacter(calendar.charactersInUse);

    // Add character to charactersInUse
    calendar.charactersInUse += eventCharacter;
    calendar.updatedBy = eventRequest.professorId;
    calendar.updatedAt = new Date();
    await calendarRepo.save(calendar);
    console.log(`[Request Approve - Custom Periodic Event] Added character '${eventCharacter}' to calendar charactersInUse: ${calendar.charactersInUse}`);

    // Get groups and validate they belong to the calendar
    const groups = groupIds.length > 0
        ? await groupRepo.find({
            where: {
                id: In(groupIds),
                calendar: { id: calendarId }
            },
            relations: ['subject']
        })
        : [];

    // Validate all requested groups were found
    if (groupIds.length > 0 && groups.length !== groupIds.length) {
        throw new Error('Some groups do not belong to this calendar or do not exist');
    }

    const classrooms = classroomIds.length > 0
        ? await classroomRepo.find({ where: { id: In(classroomIds) } })
        : [];

    const groupYear = groups.length > 0 && groups[0].subject
        ? groups[0].subject.year
        : new Date(calendar.start).getFullYear();

    // Find all affected days and group by weekDay
    const daysByWeekDay = new Map<string, Day[]>();

    for (const dateStr of affectedDates) {
        const day = await dayRepo.findOne({
            where: {
                date: new Date(dateStr),
                calendar: { id: calendarId }
            }
        });

        if (!day) {
            console.warn(`[Request Approve - Custom Periodic Event] Day not found for date ${dateStr}, skipping`);
            continue;
        }

        const weekDayMap: Record<number, string> = {
            1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S', 0: 'D'
        };
        const weekDay = weekDayMap[new Date(dateStr).getDay()];

        if (!daysByWeekDay.has(weekDay)) {
            daysByWeekDay.set(weekDay, []);
        }
        daysByWeekDay.get(weekDay)!.push(day);
    }

    // Create one PeriodicEvent per weekDay
    const createdEventIds: string[] = [];

    for (const [weekDay, days] of daysByWeekDay.entries()) {
        const periodicEvent = periodicEventRepo.create({
            calendar: calendar,
            weekDay: weekDay,
            startTime: startTime,
            endTime: endTime,
            planifiedHours: isSpecialEventType(requestedEventType) ? 0 : planifiedHours,
            eventCharacter: eventCharacter,
            eventType: requestedEventType,
            year: groupYear,
            groups: groups,
            classrooms: classrooms,
            createdBy: eventRequest.professorId
        });

        const savedEvent = await periodicEventRepo.save(periodicEvent);
        createdEventIds.push(savedEvent.id);

        // Update Day.dayCharacter for each affected day
        for (const day of days) {
            if (!day.dayCharacter.includes(eventCharacter)) {
                day.dayCharacter += eventCharacter;
                day.updatedBy = eventRequest.professorId;
                day.updatedAt = new Date();
                await dayRepo.save(day);
            }
        }

        console.log(`[Request Approve - Custom Periodic Event] Created event for weekDay ${weekDay}, updated ${days.length} days`);
    }

    console.log(`[Request Approve - Custom Periodic Event] Created ${createdEventIds.length} custom periodic events with character '${eventCharacter}'`);

    return createdEventIds[0];
}

/**
 * Helper: apply an EDIT request to an existing event.
 * Only startTime, endTime, comment (puntual) and weekDay (periodic) are editable.
 * Groups and classrooms are NOT changed.
 */
async function editEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { originalEventId, eventData } = eventRequest;
    if (!originalEventId) {
        throw new Error('originalEventId is required for EDIT requests');
    }

    const { startTime, endTime, comment, eventDate, weekDay } = eventData;

    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

    if (eventRequest.eventType === 'PUNTUAL') {
        const event = await puntualEventRepo.findOne({
            where: { id: originalEventId },
            relations: ['day', 'groups', 'classrooms'],
        });
        if (!event) throw new Error('Original puntual event not found');

        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (comment !== undefined) event.comment = comment;
        event.updatedBy = eventRequest.professorId;
        event.updatedAt = new Date();

        // If eventDate changed, move to new day
        if (eventDate) {
            const dayRepo = AppDataSource.getRepository(Day);
            const newDay = await dayRepo.findOne({
                where: {
                    date: new Date(eventDate),
                    calendar: { id: eventRequest.calendarId }
                }
            });
            if (!newDay) throw new Error('New date does not exist in the calendar');
            event.day = newDay;
        }

        await puntualEventRepo.save(event);
        return event.id;
    } else {
        // PERIODIC
        const event = await periodicEventRepo.findOne({ where: { id: originalEventId } });
        if (!event) throw new Error('Original periodic event not found');

        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (weekDay) event.weekDay = weekDay;
        event.updatedBy = eventRequest.professorId;
        event.updatedAt = new Date();

        await periodicEventRepo.save(event);
        return event.id;
    }
}

/**
 * Helper: cancel an existing event by setting cancelled = true (puntual)
 * or removing it (periodic). For periodic events we only cancel on the
 * specific occurrence via a cancelled puntual event on that day — but
 * since professors can only cancel whole periodic events here, we just
 * delete the periodic event row.
 */
async function cancelEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { originalEventId, eventData } = eventRequest;
    if (!originalEventId) {
        throw new Error('originalEventId is required for CANCEL requests');
    }

    const { comment } = eventData;

    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

    if (eventRequest.eventType === 'PUNTUAL') {
        const event = await puntualEventRepo.findOne({ where: { id: originalEventId } });
        if (!event) throw new Error('Original puntual event not found');

        event.cancelled = true;
        if (comment !== undefined) event.comment = comment;
        event.updatedBy = eventRequest.professorId;
        event.updatedAt = new Date();

        await puntualEventRepo.save(event);
        return event.id;
    } else {
        // PERIODIC — delete the event row
        const event = await periodicEventRepo.findOne({ where: { id: originalEventId } });
        if (!event) throw new Error('Original periodic event not found');

        await periodicEventRepo.remove(event);
        return originalEventId;
    }
}

/**
 * Helper: replace a puntual event — creates a replacement event on a new date
 * and marks the original as cancelled with replacementEventId link.
 * Groups and classrooms are inherited from the original event.
 * Admin can override classroomIds before approval.
 */
async function replaceEventFromRequest(eventRequest: EventRequest): Promise<string> {
    const { originalEventId, calendarId, eventData } = eventRequest;
    if (!originalEventId) {
        throw new Error('originalEventId is required for REPLACE requests');
    }

    const { newEventDate, startTime, endTime, comment, classroomIds: adminClassroomIds } = eventData;

    if (!newEventDate || !startTime || !endTime) {
        throw new Error('newEventDate, startTime and endTime are required for REPLACE requests');
    }

    const puntualEventRepo = AppDataSource.getRepository(PuntualEvent);
    const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);
    const dayRepo = AppDataSource.getRepository(Day);
    const classroomRepo = AppDataSource.getRepository(Classroom);

    // Find new day
    const newEventDateObj = new Date(newEventDate);
    newEventDateObj.setHours(0, 0, 0, 0);

    const newDay = await dayRepo.findOne({
        where: {
            date: newEventDateObj,
            calendar: { id: calendarId }
        }
    });
    if (!newDay) throw new Error('The new event date does not exist in the calendar');

    if (eventRequest.eventType === 'PUNTUAL') {
        // Load original with relations
        const originalEvent = await puntualEventRepo.findOne({
            where: { id: originalEventId },
            relations: ['day', 'groups', 'classrooms'],
        });
        if (!originalEvent) throw new Error('Original puntual event not found');

        // Classrooms: admin override if provided, otherwise inherit
        const classrooms = adminClassroomIds && adminClassroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(adminClassroomIds) } })
            : originalEvent.classrooms;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create replacement event
            const replacementEvent = puntualEventRepo.create({
                day: newDay,
                startTime,
                endTime,
                cancelled: false,
                comment: comment || '',
                eventType: originalEvent.eventType,
                groups: originalEvent.groups,
                classrooms,
                createdBy: eventRequest.professorId,
            });
            await queryRunner.manager.save(replacementEvent);

            // Mark original as cancelled, link to replacement
            originalEvent.cancelled = true;
            originalEvent.comment = `Evento reemplazado - ${comment || ''}`;
            originalEvent.replacementEventId = replacementEvent.id;
            originalEvent.updatedBy = eventRequest.professorId;
            originalEvent.updatedAt = new Date();
            await queryRunner.manager.save(originalEvent);

            await queryRunner.commitTransaction();
            return replacementEvent.id;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    } else {
        // PERIODIC replace: create a cancelled puntual event on the original occurrence date
        // and a replacement puntual event on the new date, both inheriting groups/classrooms
        const originalEvent = await periodicEventRepo.findOne({
            where: { id: originalEventId },
            relations: ['groups', 'classrooms', 'calendar'],
        });
        if (!originalEvent) throw new Error('Original periodic event not found');

        // For periodic replace, eventData must include originalDate (the specific occurrence)
        const { originalDate } = eventData;
        if (!originalDate) throw new Error('originalDate is required to replace a periodic event occurrence');

        const originalDateObj = new Date(originalDate);
        originalDateObj.setHours(0, 0, 0, 0);

        const originalDay = await dayRepo.findOne({
            where: {
                date: originalDateObj,
                calendar: { id: calendarId }
            }
        });
        if (!originalDay) throw new Error('Original date does not exist in the calendar');

        const classrooms = adminClassroomIds && adminClassroomIds.length > 0
            ? await classroomRepo.find({ where: { id: In(adminClassroomIds) } })
            : originalEvent.classrooms;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create replacement puntual event on new date
            const replacementEvent = puntualEventRepo.create({
                day: newDay,
                startTime,
                endTime,
                cancelled: false,
                comment: comment || '',
                eventType: originalEvent.eventType,
                groups: originalEvent.groups,
                classrooms,
                createdBy: eventRequest.professorId,
            });
            await queryRunner.manager.save(replacementEvent);

            // Create cancelled puntual event on original date linked to replacement
            const cancelledEvent = puntualEventRepo.create({
                day: originalDay,
                startTime: originalEvent.startTime,
                endTime: originalEvent.endTime,
                cancelled: true,
                comment: `Evento reemplazado - ${comment || ''}`,
                eventType: originalEvent.eventType,
                groups: originalEvent.groups,
                classrooms: originalEvent.classrooms,
                replacementEventId: replacementEvent.id,
                createdBy: eventRequest.professorId,
            });
            await queryRunner.manager.save(cancelledEvent);

            await queryRunner.commitTransaction();
            return replacementEvent.id;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
