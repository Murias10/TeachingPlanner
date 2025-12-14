import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth.middleware';
import { GoogleCalendarService } from '@/services/google-calendar.service';
import { triggerImmediateSync } from '@/jobs/calendar-sync.job';

const router = Router();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Get all calendar syncs for the current user
 */
router.get('/calendar-sync', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const syncs = await GoogleCalendarService.getCalendarSyncsForUser(req.user.userId);

        res.json({
            success: true,
            data: syncs.map(sync => ({
                id: sync.id,
                calendarId: sync.calendar?.id,
                calendarName: sync.googleCalendarName,
                googleCalendarId: sync.googleCalendarId,
                syncEnabled: sync.syncEnabled,
                syncStatus: sync.syncStatus,
                lastSyncAt: sync.lastSyncAt,
                errorMessage: sync.errorMessage
            }))
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get calendar syncs'
        });
    }
});

/**
 * Create a new calendar sync configuration
 */
router.post('/calendar-sync', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { calendarId } = req.body;

        if (!calendarId) {
            res.status(400).json({ success: false, message: 'Calendar ID is required' });
            return;
        }

        const sync = await GoogleCalendarService.createCalendarSync(
            req.user.userId,
            calendarId,
            req.user.email
        );

        res.status(201).json({
            success: true,
            message: 'Calendar sync created',
            data: {
                id: sync.id,
                calendarId: sync.calendar?.id,
                syncEnabled: sync.syncEnabled,
                syncStatus: sync.syncStatus
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create calendar sync'
        });
    }
});

/**
 * Delete a calendar sync configuration
 */
router.delete('/calendar-sync/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { accessToken } = req.body;

        const deleted = await GoogleCalendarService.deleteCalendarSync(id, accessToken);

        if (!deleted) {
            res.status(404).json({ success: false, message: 'Calendar sync not found' });
            return;
        }

        res.json({ success: true, message: 'Calendar sync deleted' });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete calendar sync'
        });
    }
});

/**
 * Toggle sync enabled status
 */
router.patch('/calendar-sync/:id/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const sync = await GoogleCalendarService.toggleSyncEnabled(id);

        if (!sync) {
            res.status(404).json({ success: false, message: 'Calendar sync not found' });
            return;
        }

        res.json({
            success: true,
            message: `Sync ${sync.syncEnabled ? 'enabled' : 'disabled'}`,
            data: { syncEnabled: sync.syncEnabled }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to toggle sync'
        });
    }
});

/**
 * Trigger immediate sync for a calendar
 */
router.post('/calendar-sync/:id/sync-now', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { accessToken } = req.body;

        if (!accessToken) {
            res.status(400).json({ success: false, message: 'Access token is required' });
            return;
        }

        const result = await triggerImmediateSync(id, accessToken);

        res.json({
            success: result.success,
            message: result.message
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync calendar'
        });
    }
});

export default router;
