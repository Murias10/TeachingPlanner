import { Router } from 'express';
import { getCoursesByDegreeId } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:id', getCoursesByDegreeId);

export default router;
