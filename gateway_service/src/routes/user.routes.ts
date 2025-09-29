import express from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from '@/controllers/user.controller';

const router = express.Router();

router.post('/user', createUser);
router.get('/users', getAllUsers);
router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);

export default router;