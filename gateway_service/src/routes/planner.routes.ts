import express from 'express';
import { getDegrees } from '@/controllers/planner.controller';

const router = express.Router();

router.get('/degrees', getDegrees);

export default router;
