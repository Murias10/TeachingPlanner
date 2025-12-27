import { Router } from 'express';
import { createGroup, deleteGroup, updatePlanifiedHours } from '@/controllers/group.controller';

const router = Router();

router.post('/group', createGroup);
router.delete('/group/:id', deleteGroup);
router.patch('/group/:id/planified-hours', updatePlanifiedHours);

export default router;
