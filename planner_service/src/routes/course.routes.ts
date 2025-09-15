import { Router } from 'express';
import { getCoursesByDegreeId, getCourses, deleteCourse, getCoursesByDegreeAcronym, createCourse } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);
router.get('/courses', getCourses);
router.post('/course', createCourse);
router.delete('/course/:id', deleteCourse)

export default router;
