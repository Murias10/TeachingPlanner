import { Router, Request, Response } from 'express';
import { GoogleCalendarService } from '@/services/google-calendar.service';

const router = Router();

/**
 * Initialize Google Calendars for all classrooms
 * Called from auth_service after successful Google OAuth
 */
router.post('/google-calendars/initialize', async (req: Request, res: Response) => {
    try {
        const { userId, accessToken, userEmail } = req.body;

        if (!userId || !accessToken || !userEmail) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, accessToken, userEmail'
            });
            return;
        }

        const result = await GoogleCalendarService.initializeGoogleCalendars(
            userId,
            accessToken,
            userEmail
        );

        res.json({
            success: true,
            message: `Initialized ${result.created} Google Calendars`,
            data: result
        });
    } catch (error: any) {
        console.error('Error initializing Google Calendars:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to initialize Google Calendars'
        });
    }
});

export default router;
