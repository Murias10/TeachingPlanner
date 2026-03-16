import { createCalendar, createCalendarWithImport, deleteCalendar, exportCalendar, getCalendarById, getCalendarDays, getCalendarEvents, getPendingRequestsAsEvents, uploadFiles, uploadSingleFile, importExceptions, createPuntualEvent, updatePuntualEvent, deletePuntualEvent, createPeriodicEvent, createCustomPeriodicEvent, updatePeriodicEvent, updateCustomPeriodicEvent, deletePeriodicEvent, replacePeriodicEvent, duplicateCalendar, getActiveCalendars } from '@/controllers/calendar.controller';
import { Router } from 'express';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

router.get('/calendars/active', getActiveCalendars);
router.get('/calendar/:id', getCalendarById);
router.get('/calendar/:id/days', getCalendarDays);
router.post('/calendar', requireRole(['ADMIN']), createCalendar);
router.post('/calendar/import', requireRole(['ADMIN']), uploadFiles, createCalendarWithImport);
router.post('/calendar/:calendarId/import-exceptions', requireRole(['ADMIN']), uploadSingleFile, importExceptions);
router.post('/calendar/duplicate', requireRole(['ADMIN']), duplicateCalendar);
router.post('/calendar/puntual-event', requireRole(['ADMIN']), createPuntualEvent);
router.put('/calendar/puntual-event/:eventId', requireRole(['ADMIN']), updatePuntualEvent);
router.post('/calendar/periodic-event', requireRole(['ADMIN']), createPeriodicEvent);
router.post('/calendar/custom-periodic-event', requireRole(['ADMIN']), createCustomPeriodicEvent);
router.put('/calendar/periodic-event/:eventId', requireRole(['ADMIN']), updatePeriodicEvent);
router.put('/calendar/custom-periodic-event', requireRole(['ADMIN']), updateCustomPeriodicEvent);
router.post('/calendar/replace-event', requireRole(['ADMIN']), replacePeriodicEvent);
router.delete('/calendar/puntual-event/:eventId', requireRole(['ADMIN']), deletePuntualEvent);
router.delete('/calendar/periodic-event/:eventId', requireRole(['ADMIN']), deletePeriodicEvent);
router.get('/calendar/:id/events', getCalendarEvents);
router.get('/calendar/:id/pending-requests', getPendingRequestsAsEvents);
router.get('/calendar/:id/export', exportCalendar);
router.delete('/calendar/:id', requireRole(['ADMIN']), deleteCalendar);

export default router;
