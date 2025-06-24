import express from 'express';
import { getAllDegrees } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getAllDegrees);

export default router;
