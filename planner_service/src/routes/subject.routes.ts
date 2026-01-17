import { Router } from 'express';
import { createSubject, updateSubject, deleteSubject, getSubjects, getSubjectsByCalendarId, getSubjectsWithGroupsByCalendarId } from '@/controllers/subject.controller';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/subjects/calendar/:id', getSubjectsByCalendarId);
router.get('/subjects/groups/by-calendar/:calendarId', getSubjectsWithGroupsByCalendarId);
router.post('/subject', createSubject)
router.patch('/subject/:id', updateSubject)
router.delete('/subject/:id', deleteSubject)

export default router;
