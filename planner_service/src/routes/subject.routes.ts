import { Router } from 'express';
import { createSubject, updateSubject, deleteSubject, getSubjects, getSubjectsByCalendarId, getSubjectsWithGroupsByCalendarId } from '@/controllers/subject.controller';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/subjects/calendar/:id', getSubjectsByCalendarId);
router.get('/subjects/groups/by-calendar/:calendarId', getSubjectsWithGroupsByCalendarId);
router.post('/subject', requireRole(['ADMIN']), createSubject)
router.patch('/subject/:id', requireRole(['ADMIN']), updateSubject)
router.delete('/subject/:id', requireRole(['ADMIN']), deleteSubject)

export default router;
