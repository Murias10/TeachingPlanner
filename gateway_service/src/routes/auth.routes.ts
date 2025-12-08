import express from 'express';
import { login, validateToken, getProfile, logout, forgotPassword, verifyOTP, resetPassword } from '@/controllers/auth.controller';

const router = express.Router();

// Rutas públicas
router.post('/auth/login', login);
router.post('/auth/validate', validateToken);
router.post('/auth/logout', logout);

// Rutas de recuperación de contraseña
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/reset-password', resetPassword);

// Rutas protegidas
router.get('/auth/profile', getProfile);

export default router;