import { Router } from 'express';
import { getDegrees } from '@/controllers/degree.controller';


const router = Router();

router.get('/degrees', getDegrees);

export default router;
