import { Router } from 'express';
import { getClassrooms } from '@/controllers/classroom.controller';

const router = Router();

router.get('/classrooms', getClassrooms);

export default router;
