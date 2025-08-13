import { Router } from 'express';
import { getClassrooms, createClassroom, deleteClassroom } from '@/controllers/classroom.controller';

const router = Router();

router.get('/classrooms', getClassrooms);
router.post('/classroom', createClassroom);
router.delete('/classroom/:id', deleteClassroom);

export default router;
