import { Router } from 'express';
import { getCoursesByDegreeAcronym, getCoursesByDegreeId, getCourses } from '@/controllers/course.controller';

const router = Router();

router.get('/courses/degree/:acronym', getCoursesByDegreeAcronym);
router.get('/courses/degree/:id', getCoursesByDegreeId);
router.get('/courses', getCourses);



export default router;
