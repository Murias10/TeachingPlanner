import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Group } from '@/entities/group.entity';
import { Subject } from '@/entities/subject.entity';
import { Calendar } from '@/entities/calendar.entity';
import { PeriodicEvent } from '@/entities/periodic_event.entity';
import { AuditedRequest } from '@/middleware/auth.middleware';

/**
 * Create a new group
 */
export const createGroup = async (req: AuditedRequest, res: Response) => {
    const { calendarId, subjectId, number, type, language } = req.body;
    const userEmail = req.user?.email;

    // Validations
    if (!calendarId) {
        res.status(400).json({
            status: 'error',
            message: 'Calendar ID is required',
        });
        return;
    }

    if (!subjectId) {
        res.status(400).json({
            status: 'error',
            message: 'Subject ID is required',
        });
        return;
    }

    if (!number || !type || !language) {
        res.status(400).json({
            status: 'error',
            message: 'Number, type, and language are required',
        });
        return;
    }

    try {
        const groupRepo = AppDataSource.getRepository(Group);
        const subjectRepo = AppDataSource.getRepository(Subject);
        const calendarRepo = AppDataSource.getRepository(Calendar);

        // Check if calendar exists
        const calendar = await calendarRepo.findOne({
            where: { id: calendarId },
        });

        if (!calendar) {
            res.status(404).json({
                status: 'error',
                message: 'Calendar not found',
            });
            return;
        }

        // Check if subject exists
        const subject = await subjectRepo.findOne({
            where: { id: subjectId },
        });

        if (!subject) {
            res.status(404).json({
                status: 'error',
                message: 'Subject not found',
            });
            return;
        }

        // Check if group with same number, type, and language already exists for this calendar and subject
        const existingGroup = await groupRepo.findOne({
            where: {
                calendar: { id: calendarId },
                subject: { id: subjectId },
                number,
                type,
                language,
            },
        });

        if (existingGroup) {
            res.status(409).json({
                status: 'error',
                message: 'Este grupo ya existe',
            });
            return;
        }

        // Create group
        const group = groupRepo.create({
            calendar,
            subject,
            number,
            type,
            language,
            createdBy: userEmail,
        });

        const savedGroup = await groupRepo.save(group);

        console.log(`[Group Creation] Created group ${type}-${number} for subject ${subject.name}`);

        res.status(201).json({
            status: 'success',
            message: 'Group created successfully',
            data: savedGroup,
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating group',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Delete a group by ID
 */
export const deleteGroup = async (req: AuditedRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({
            status: 'error',
            message: 'Group ID is required',
        });
        return;
    }

    try {
        const groupRepo = AppDataSource.getRepository(Group);

        const group = await groupRepo.findOne({
            where: { id },
            relations: ['subject'],
        });

        if (!group) {
            res.status(404).json({
                status: 'error',
                message: 'Group not found',
            });
            return;
        }

        await groupRepo.remove(group);

        console.log(`[Group Deletion] Deleted group ${group.type}-${group.number} from subject ${group.subject.name}`);

        res.status(200).json({
            status: 'success',
            message: 'Group deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting group',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Update planified hours for a group
 * Updates both the Group entity and all associated PeriodicEvents
 */
export const updatePlanifiedHours = async (req: AuditedRequest, res: Response) => {
    const { id } = req.params;
    const { planifiedHours } = req.body;
    const userEmail = req.user?.email;

    if (!id) {
        res.status(400).json({
            status: 'error',
            message: 'Group ID is required',
        });
        return;
    }

    if (planifiedHours === undefined || planifiedHours === null) {
        res.status(400).json({
            status: 'error',
            message: 'Planified hours is required',
        });
        return;
    }

    if (typeof planifiedHours !== 'number' || planifiedHours < 0) {
        res.status(400).json({
            status: 'error',
            message: 'Planified hours must be a non-negative number',
        });
        return;
    }

    try {
        const groupRepo = AppDataSource.getRepository(Group);
        const periodicEventRepo = AppDataSource.getRepository(PeriodicEvent);

        const group = await groupRepo.findOne({
            where: { id },
            relations: ['subject'],
        });

        if (!group) {
            res.status(404).json({
                status: 'error',
                message: 'Group not found',
            });
            return;
        }

        // Update group's planified hours
        group.planifiedHours = planifiedHours;
        group.updatedBy = userEmail;
        group.updatedAt = new Date();
        await groupRepo.save(group);

        // Update all periodic events associated with this group
        const periodicEvents = await periodicEventRepo
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.groups', 'group')
            .where('group.id = :groupId', { groupId: id })
            .getMany();

        for (const event of periodicEvents) {
            event.planifiedHours = planifiedHours;
            event.updatedBy = userEmail;
            event.updatedAt = new Date();
            await periodicEventRepo.save(event);
        }

        console.log(`[Group Update] Updated planified hours to ${planifiedHours} for group ${group.type}-${group.number} and ${periodicEvents.length} periodic events`);

        res.status(200).json({
            status: 'success',
            message: 'Planified hours updated successfully',
            data: {
                group,
                updatedEventsCount: periodicEvents.length,
            },
        });
    } catch (error) {
        console.error('Error updating planified hours:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating planified hours',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
