import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { validateCreateUser, validateUpdateUser } from '@/middleware/validation.middleware';

const router = Router();
const userController = new UserController();

// CRUD Operations
router.post('/user', validateCreateUser, userController.createUser);
router.get('/users', userController.getAllUsers);
router.get('/user/:id', userController.getUserById);
router.put('/user/:id', validateUpdateUser, userController.updateUser);
router.delete('/user/:id', userController.deleteUser);

// Additional endpoints
router.get('/user/role/:role', userController.getUsersByRole);
router.get('/users/search', userController.searchUsers);
router.patch('/user/:id/password', userController.updatePassword);

export default router;