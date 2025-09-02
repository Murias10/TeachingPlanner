import { Router } from 'express';
import { getCoursesByDegreeId, getCourses, deleteCourse } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses', getCourses);
router.delete('/course/:id', deleteCourse)

export default router;
