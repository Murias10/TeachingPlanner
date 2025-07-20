import express from 'express';
import { getDegrees, getCoursesByDegreeId } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getDegrees);

router.get('/courses/degree/:id', getCoursesByDegreeId);

export default router;
