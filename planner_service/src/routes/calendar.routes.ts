import { createCalendar, deleteCalendar, getCalendarById } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.get('/calendar/:id', getCalendarById);
router.post('/calendar', createCalendar);
router.delete('/calendar/:id', deleteCalendar);

export default router;
