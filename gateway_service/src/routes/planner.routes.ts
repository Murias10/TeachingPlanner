import express from 'express';
import { getDegrees, getCoursesByDegreeId, getSubjects, getClassrooms } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getDegrees);

router.get('/courses/degree/:id', getCoursesByDegreeId);

router.get('/subjects', getSubjects);

router.get('/classrooms', getClassrooms);

export default router;
