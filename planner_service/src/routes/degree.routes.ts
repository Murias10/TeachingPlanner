import { Router } from 'express';
import { getDegrees, createDegree, deleteDegree, getDegreeByAcronym, updateDegree, getDegreesWithActiveCalendars } from '@/controllers/degree.controller';


const router = Router();

router.get('/degrees', getDegrees);
router.get('/degrees/with-active-calendars', getDegreesWithActiveCalendars);
router.get('/degree/acronym/:acronym', getDegreeByAcronym);
router.post('/degree', createDegree)
router.patch('/degree/:id', updateDegree)
router.delete('/degree/:id', deleteDegree)

export default router;
