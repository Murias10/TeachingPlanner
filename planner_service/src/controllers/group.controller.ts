import { Response } from 'express';
import { AppDataSource } from '@/config/data-source';
import { Group } from '@/entities/group.entity';
import { Subject } from '@/entities/subject.entity';
import { AuditedRequest } from '@/middleware/auth.middleware';

/**
 * Create a new group
 */
export const createGroup = async (req: AuditedRequest, res: Response) => {
    const { subjectId, number, type, language } = req.body;
    const userEmail = req.user?.email;

    // Validations
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

        // Check if group with same number, type, and language already exists for this subject
        const existingGroup = await groupRepo.findOne({
            where: {
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
