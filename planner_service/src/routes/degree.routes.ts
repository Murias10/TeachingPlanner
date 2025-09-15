import { Router } from 'express';
import { getDegrees, createDegree, deleteDegree, getDegreeByAcronym } from '@/controllers/degree.controller';


const router = Router();

router.get('/degrees', getDegrees);
router.get('/degree/acronym/:acronym', getDegreeByAcronym);
router.post('/degree', createDegree)
router.delete('/degree/:id', deleteDegree)

export default router;
