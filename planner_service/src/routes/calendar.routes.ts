import { createCalendar, createCalendarWithImport, deleteCalendar, exportCalendar, getCalendarById, getCalendarDays, getCalendarEvents, getPendingRequestsAsEvents, uploadFiles, createPuntualEvent, updatePuntualEvent, deletePuntualEvent, createPeriodicEvent, createCustomPeriodicEvent, updatePeriodicEvent, updateCustomPeriodicEvent, deletePeriodicEvent, replacePeriodicEvent, duplicateCalendar } from '@/controllers/calendar.controller';
import { Router } from 'express';

const router = Router();

router.get('/calendar/:id', getCalendarById);
router.get('/calendar/:id/days', getCalendarDays);
router.post('/calendar', createCalendar);
router.post('/calendar/import', uploadFiles, createCalendarWithImport);
router.post('/calendar/duplicate', duplicateCalendar);
router.post('/calendar/puntual-event', createPuntualEvent);
router.put('/calendar/puntual-event/:eventId', updatePuntualEvent);
router.post('/calendar/periodic-event', createPeriodicEvent);
router.post('/calendar/custom-periodic-event', createCustomPeriodicEvent);
router.put('/calendar/periodic-event/:eventId', updatePeriodicEvent);
router.put('/calendar/custom-periodic-event', updateCustomPeriodicEvent);
router.post('/calendar/replace-event', replacePeriodicEvent);
router.delete('/calendar/puntual-event/:eventId', deletePuntualEvent);
router.delete('/calendar/periodic-event/:eventId', deletePeriodicEvent);
router.get('/calendar/:id/events', getCalendarEvents);
router.get('/calendar/:id/pending-requests', getPendingRequestsAsEvents);
router.get('/calendar/:id/export', exportCalendar);
router.delete('/calendar/:id', deleteCalendar);

export default router;
