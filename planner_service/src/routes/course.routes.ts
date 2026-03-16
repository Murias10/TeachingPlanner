import { Router } from 'express';
import { getCoursesByDegreeId, getCourses, deleteCourse, getCoursesByDegreeAcronym, createCourse, updateCourse } from '@/controllers/course.controller';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

router.get('/courses/degree/acronym/:acronym', getCoursesByDegreeAcronym);
router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses', getCourses);
router.post('/course', requireRole(['ADMIN']), createCourse);
router.patch('/course/:id', requireRole(['ADMIN']), updateCourse);
router.delete('/course/:id', requireRole(['ADMIN']), deleteCourse)

export default router;
