import { Router } from 'express';
import { getCoursesByDegreeId, getCourses, deleteCourse, getCoursesByDegreeAcronym, createCourse, updateCourse } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);
router.get('/courses', getCourses);
router.post('/course', createCourse);
router.patch('/course/:id', updateCourse);
router.delete('/course/:id', deleteCourse)

export default router;
