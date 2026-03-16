import { Router } from 'express';
import { createGroup, deleteGroup, updatePlanifiedHours } from '@/controllers/group.controller';
import { requireRole } from '@/middleware/require-role.middleware';

const router = Router();

router.post('/group', requireRole(['ADMIN']), createGroup);
router.delete('/group/:id', requireRole(['ADMIN']), deleteGroup);
router.patch('/group/:id/planified-hours', requireRole(['ADMIN']), updatePlanifiedHours);

export default router;
