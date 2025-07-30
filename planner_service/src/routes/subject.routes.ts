import { Router } from 'express';
import { getSubjects, getSubjectsByDegreeId } from '@/controllers/subject.controller';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/subjects/degree/:id', getSubjectsByDegreeId);

export default router;
