import { Router } from 'express';
import { getDegrees, createDegree, deleteDegree, getDegreeByAcronym, updateDegree } from '@/controllers/degree.controller';
import { requireRole } from '@/middleware/require-role.middleware';


const router = Router();

router.get('/degrees', getDegrees);
router.get('/degree/acronym/:acronym', getDegreeByAcronym);
router.post('/degree', requireRole(['ADMIN']), createDegree)
router.patch('/degree/:id', requireRole(['ADMIN']), updateDegree)
router.delete('/degree/:id', requireRole(['ADMIN']), deleteDegree)

export default router;
