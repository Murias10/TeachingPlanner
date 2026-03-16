import { Router } from 'express';
import { getClassrooms, createClassroom, deleteClassroom, updateClassroom } from '@/controllers/classroom.controller';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

router.get('/classrooms', getClassrooms);
router.post('/classroom', requireRole(['ADMIN']), createClassroom);
router.patch('/classroom/:id', requireRole(['ADMIN']), updateClassroom);
router.delete('/classroom/:id', requireRole(['ADMIN']), deleteClassroom);

export default router;
