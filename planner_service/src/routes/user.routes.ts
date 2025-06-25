import { Router } from 'express';
import { getAllUsers, createUser } from '@/controllers/user.controller';


const router = Router();

router.get('/users', getAllUsers);
router.post('/user', createUser);

export default router;
