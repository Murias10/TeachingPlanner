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
 * Initialize calendar sync entries (lightweight - no Google Calendar creation)
 * Called from auth_service after successful OAuth
 */
router.post('/calendar-sync/initialize', async (req: Request, res: Response) => {
    try {
        const { userId, userEmail } = req.body;

        if (!userId || !userEmail) {
            res.status(400).json({ success: false, message: 'userId and userEmail are required' });
            return;
        }

        const result = await GoogleCalendarService.initializeCalendarSyncEntries(userId, userEmail);

        res.json({
            success: true,
            message: `Initialized ${result.count} calendar sync entries`,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initialize calendar sync entries'
        });
    }
});

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
                calendarId: sync.calendar.id,
                courseName: `${sync.calendar.course.startYear}/${sync.calendar.course.endYear}`,
                semester: sync.calendar.semester,
                degreeId: sync.calendar.course.degree.id,
                degreeName: sync.calendar.course.degree.name,
                degreeAcronym: sync.calendar.course.degree.acronym,
                syncEnabled: sync.syncEnabled,
                syncStatus: sync.syncStatus,
                lastSyncAt: sync.lastSyncAt,
                errorMessage: sync.errorMessage,
                totalCalendars: sync.totalCalendars,
                processedCalendars: sync.processedCalendars,
                currentOperation: sync.currentOperation
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
 * Toggle sync enabled status
 */
router.patch('/calendar-sync/:id/toggle', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        // Get access token from auth_service for cleanup operations
        let accessToken: string | undefined;
        try {
            const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth_service:5003';
            const tokenResponse = await fetch(`${authServiceUrl}/auth/google/token/${req.user.userId}`, {
                headers: {
                    'X-Internal-Service': 'planner_service'
                }
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                if (tokenData.success && tokenData.data?.accessToken) {
                    accessToken = tokenData.data.accessToken;
                }
            }
        } catch (error) {
            console.warn('Could not get access token for toggle operation:', error);
            // Continue without token - cleanup won't happen but toggle will still work
        }

        const sync = await GoogleCalendarService.toggleSyncEnabled(id, accessToken);

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

        // Get access token from auth_service
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth_service:5003';
        const tokenResponse = await fetch(`${authServiceUrl}/auth/google/token/${req.user.userId}`, {
            headers: {
                'X-Internal-Service': 'planner_service'
            }
        });

        if (!tokenResponse.ok) {
            res.status(401).json({ success: false, message: 'Failed to get Google access token. Please reconnect your Google account.' });
            return;
        }

        const tokenData = await tokenResponse.json();
        if (!tokenData.success || !tokenData.data?.accessToken) {
            res.status(401).json({ success: false, message: 'Invalid Google access token' });
            return;
        }

        const result = await triggerImmediateSync(id, tokenData.data.accessToken);

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

/**
 * Delete all calendar syncs for the current user (used when disconnecting Google account)
 */
router.delete('/calendar-sync/user/all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { accessToken } = req.body;

        const result = await GoogleCalendarService.deleteAllUserSyncs(req.user.userId, accessToken);

        res.json({
            success: true,
            message: `Deleted ${result.deletedSyncs} calendar syncs and ${result.deletedGoogleCalendars} Google calendars`,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete all calendar syncs'
        });
    }
});

/**
 * Internal endpoint for auth_service to delete all calendar syncs when disconnecting Google account
 * No authentication required - called from auth_service during disconnect flow
 */
router.delete('/calendar-sync/cleanup', async (req: Request, res: Response) => {
    try {
        const { userId, accessToken } = req.body;

        if (!userId) {
            res.status(400).json({ success: false, message: 'userId is required' });
            return;
        }

        const result = await GoogleCalendarService.deleteAllUserSyncs(userId, accessToken);

        res.json({
            success: true,
            message: `Deleted ${result.deletedSyncs} calendar syncs and ${result.deletedGoogleCalendars} Google calendars`,
            data: result
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete all calendar syncs'
        });
    }
});

export default router;
