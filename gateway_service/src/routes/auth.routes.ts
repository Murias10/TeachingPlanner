import express from 'express';
import { login, register, validateToken, getProfile, logout } from '@/controllers/auth.controller';

const router = express.Router();

// Rutas públicas
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/validate', validateToken);
router.post('/auth/logout', logout);

// Rutas protegidas
router.get('/auth/profile', getProfile);

export default router;