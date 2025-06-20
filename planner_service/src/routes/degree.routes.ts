import { Router } from 'express';
import { getAllDegrees } from '@/controllers/degree.controller';


const router = Router();

router.get('/', getAllDegrees);

export default router;
