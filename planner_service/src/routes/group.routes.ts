import { Router } from 'express';
import { createGroup, deleteGroup } from '@/controllers/group.controller';

const router = Router();

router.post('/group', createGroup);
router.delete('/group/:id', deleteGroup);

export default router;
