import { createCalendar, createCalendarWithImport, deleteCalendar, exportCalendar, getCalendarById, getCalendarEvents, uploadFiles } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.get('/calendar/:id', getCalendarById);
router.post('/calendar', createCalendar);
router.post('/calendar/import', uploadFiles, createCalendarWithImport);
router.get('/calendar/:id/events', getCalendarEvents);
router.get('/calendar/:id/export', exportCalendar);
router.delete('/calendar/:id', deleteCalendar);

export default router;
