import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth.middleware';
import { GoogleCalendarService } from '@/services/google-calendar.service';

const router = Router();

interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth_service:5003';

async function getGoogleAccessToken(userId: string): Promise<string | undefined> {
    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/auth/google/token/${userId}`, {
            headers: { 'X-Internal-Service': 'planner_service' }
        });
        if (!response.ok) return undefined;
        const data = await response.json();
        return data.success && data.data?.accessToken ? data.data.accessToken : undefined;
    } catch {
        return undefined;
    }
}

function requireInternalService(req: Request, res: Response, next: () => void) {
    if (req.headers['x-internal-service'] !== 'auth_service') {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    next();
}

// ── Specific literal routes first (must come before parametric :id routes) ──

router.get('/calendar-sync/rate-limit-status', authenticateToken, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    res.json({ success: true, data: GoogleCalendarService.getRateLimitStatus() });
});

// Called from auth_service after successful OAuth — internal only
router.post('/calendar-sync/initialize', requireInternalService, async (req: Request, res: Response) => {
    try {
        const { userId, userEmail } = req.body;
        if (!userId || !userEmail) {
            res.status(400).json({ success: false, message: 'userId and userEmail are required' });
            return;
        }
        const result = await GoogleCalendarService.initializeCalendarSyncEntries(userId, userEmail);
        res.json({ success: true, message: `Initialized ${result.count} calendar sync entries`, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to initialize calendar sync entries' });
    }
});

// Called from auth_service during disconnect — internal only
router.delete('/calendar-sync/cleanup', requireInternalService, async (req: Request, res: Response) => {
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
        res.status(500).json({ success: false, message: error.message || 'Failed to delete all calendar syncs' });
    }
});

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
                syncStatus: sync.syncStatus,
                lastSyncAt: sync.lastSyncAt,
                errorMessage: sync.errorMessage,
                totalCalendars: sync.totalCalendars,
                processedCalendars: sync.processedCalendars,
                currentOperation: sync.currentOperation
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get calendar syncs' });
    }
});

// ── Parametric routes last ──

router.delete('/calendar-sync/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const accessToken = await getGoogleAccessToken(req.user.userId);
        const deleted = await GoogleCalendarService.deleteSingleSync(req.params.id, req.user.userId, accessToken);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Calendar sync not found' });
            return;
        }
        res.json({ success: true, message: 'Calendar sync deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete calendar sync' });
    }
});

router.post('/calendar-sync/:id/sync-now', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const accessToken = await getGoogleAccessToken(req.user.userId);
        if (!accessToken) {
            res.status(401).json({ success: false, message: 'Failed to get Google access token. Please reconnect your Google account.' });
            return;
        }
        const result = await GoogleCalendarService.syncCalendarToGoogle(req.params.id, accessToken);
        res.json({ success: result.success, message: result.message });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to sync calendar' });
    }
});

export default router;
