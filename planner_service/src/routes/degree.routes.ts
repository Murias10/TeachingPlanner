import { Router } from 'express';
import { getDegrees, createDegree, deleteDegree } from '@/controllers/degree.controller';


const router = Router();

router.get('/degrees', getDegrees);
router.post('/degree', createDegree)
router.delete('/degree/:id', deleteDegree)

export default router;
