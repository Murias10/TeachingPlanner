import { createCalendar, createCalendarWithImport, deleteCalendar, getCalendarById, uploadFiles } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.get('/calendar/:id', getCalendarById);
router.post('/calendar', createCalendar);
router.post('/calendar/import', uploadFiles, createCalendarWithImport);
router.delete('/calendar/:id', deleteCalendar);

export default router;
