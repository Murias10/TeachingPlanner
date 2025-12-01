import { Router } from 'express';
import {
    createEventRequest,
    getEventRequests,
    getEventRequestById,
    approveEventRequest,
    rejectEventRequest,
    deleteEventRequest,
} from '@/controllers/event-request.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

/**
 * POST /event-request
 * Create a new event request (TEACHER only)
 * Body: { calendarId, eventType, eventData }
 */
router.post(
    '/event-request',
    authenticateToken,
    requireRole(['TEACHER']),
    createEventRequest
);

/**
 * GET /event-requests
 * Get all event requests with optional filters (ADMIN only)
 * Query params: status (PENDING|APPROVED|REJECTED), calendarId, teacherId
 */
router.get(
    '/event-requests',
    authenticateToken,
    requireRole(['ADMIN']),
    getEventRequests
);

/**
 * GET /event-request/:id
 * Get a specific event request by ID
 */
router.get(
    '/event-request/:id',
    authenticateToken,
    getEventRequestById
);

/**
 * PATCH /event-request/:id/approve
 * Approve an event request and create the event (ADMIN only)
 */
router.patch(
    '/event-request/:id/approve',
    authenticateToken,
    requireRole(['ADMIN']),
    approveEventRequest
);

/**
 * PATCH /event-request/:id/reject
 * Reject an event request (ADMIN only)
 * Body: { comments? }
 */
router.patch(
    '/event-request/:id/reject',
    authenticateToken,
    requireRole(['ADMIN']),
    rejectEventRequest
);

/**
 * DELETE /event-request/:id
 * Delete an event request (TEACHER only - can only delete own PENDING requests)
 */
router.delete(
    '/event-request/:id',
    authenticateToken,
    requireRole(['TEACHER']),
    deleteEventRequest
);

export default router;
