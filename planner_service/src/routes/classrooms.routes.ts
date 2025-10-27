import { Router } from 'express';
import { getClassrooms, createClassroom, deleteClassroom, updateClassroom } from '@/controllers/classroom.controller';

const router = Router();

router.get('/classrooms', getClassrooms);
router.post('/classroom', createClassroom);
router.patch('/classroom/:id', updateClassroom);
router.delete('/classroom/:id', deleteClassroom);

export default router;
