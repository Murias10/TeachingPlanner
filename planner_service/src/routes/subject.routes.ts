import { Router } from 'express';
import { createSubject, deleteSubject, getSubjects, getSubjectsByDegreeId, getSubjectsWithEventsAndGroupsByCourseAndSemester } from '@/controllers/subject.controller';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/subjects/degree/:id', getSubjectsByDegreeId);
router.get('/subjects/with-events/groups/by-course/:courseId/semester/:semester', getSubjectsWithEventsAndGroupsByCourseAndSemester);
router.post('/subject', createSubject)
router.delete('/subject/:id', deleteSubject)

export default router;
