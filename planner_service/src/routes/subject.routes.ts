import { Router } from 'express';
import { createSubject, updateSubject, deleteSubject, getSubjects, getSubjectsByDegreeId, getSubjectsWithGroupsByCourseAndSemester } from '@/controllers/subject.controller';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/subjects/degree/:id', getSubjectsByDegreeId);
router.get('/subjects/groups/by-course/:courseId/semester/:semester', getSubjectsWithGroupsByCourseAndSemester);
router.post('/subject', createSubject)
router.patch('/subject/:id', updateSubject)
router.delete('/subject/:id', deleteSubject)

export default router;
