import { Router } from "express";
import { AuthController } from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import {
    loginSchema,
    resetPasswordSchema,
    forgotPasswordSchema,
    verifyOTPSchema,
    activateAccountSchema
} from '@/schemas/auth.schemas';

const router = Router();

const authController = new AuthController();

// Rutas públicas
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/validate', authController.validateToken);
router.post('/auth/logout', authController.logout);

// Rutas de recuperación de contraseña
router.post('/auth/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/verify-otp', validate(verifyOTPSchema), authController.verifyOTP);
router.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Ruta de activación de cuenta
router.post('/auth/activate', validate(activateAccountSchema), authController.activateAccount);

// Rutas protegidas
router.get('/auth/profile', authenticateToken, authController.getProfile);

// Rutas de Google OAuth
router.get('/auth/google/initiate', authenticateToken, authController.initiateGoogleOAuth);
router.get('/auth/google/callback', authController.handleGoogleCallback);
router.post('/auth/google/disconnect', authenticateToken, authController.disconnectGoogle);
router.get('/auth/google/status', authenticateToken, authController.getGoogleStatus);

// Internal route for service-to-service communication (used by planner_service)
router.get('/auth/google/token/:userId', authController.getGoogleTokenInternal);

export default router;
