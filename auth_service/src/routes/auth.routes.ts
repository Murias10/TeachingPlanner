import { Router } from "express";
import { AuthController } from '@/controllers/auth.controller';
import { validateLogin, validateRegister } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';

const router = Router();

const authController = new AuthController();

// Rutas públicas
router.post('/auth/login', validateLogin, authController.login);
router.post('/auth/register', validateRegister, authController.register);
router.post('/auth/validate', authController.validateToken);
router.post('/auth/logout', authController.logout);

// Rutas protegidas
router.get('/auth/profile', authenticateToken, authController.getProfile);


export default router;
