import { createCalendar, createCalendarWithImport, deleteCalendar, exportCalendar, getCalendarById, getCalendarEvents, getPendingRequestsAsEvents, uploadFiles, createPuntualEvent, updatePuntualEvent, deletePuntualEvent, createPeriodicEvent } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.get('/calendar/:id', getCalendarById);
router.post('/calendar', createCalendar);
router.post('/calendar/import', uploadFiles, createCalendarWithImport);
router.post('/calendar/puntual-event', createPuntualEvent);
router.put('/calendar/puntual-event/:eventId', updatePuntualEvent);
router.post('/calendar/periodic-event', createPeriodicEvent);
router.delete('/calendar/puntual-event/:eventId', deletePuntualEvent);
router.get('/calendar/:id/events', getCalendarEvents);
router.get('/calendar/:id/pending-requests', getPendingRequestsAsEvents);
router.get('/calendar/:id/export', exportCalendar);
router.delete('/calendar/:id', deleteCalendar);

export default router;
