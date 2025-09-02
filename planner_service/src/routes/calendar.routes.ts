import { deleteCalendar } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.delete('/calendar/:id', deleteCalendar);

export default router;
