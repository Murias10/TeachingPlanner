import { Router } from 'express';
import { getCoursesByDegreeId, getCourses } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses', getCourses);



export default router;
