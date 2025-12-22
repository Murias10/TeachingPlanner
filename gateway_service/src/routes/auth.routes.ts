import express from 'express';
import { login, validateToken, getProfile, logout, forgotPassword, verifyOTP, resetPassword, activateAccount, googleInitiate, googleCallback, googleDisconnect, googleStatus, getCalendarSyncs, toggleCalendarSync, syncNow, deleteAllUserCalendarSyncs } from '@/controllers/auth.controller';

const router = express.Router();

// Rutas públicas
router.post('/auth/login', login);
router.post('/auth/validate', validateToken);
router.post('/auth/logout', logout);

// Rutas de recuperación de contraseña
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/reset-password', resetPassword);

// Ruta de activación de cuenta
router.post('/auth/activate', activateAccount);

// Google OAuth routes
router.get('/auth/google/initiate', googleInitiate);
router.get('/auth/google/callback', googleCallback);
router.post('/auth/google/disconnect', googleDisconnect);
router.get('/auth/google/status', googleStatus);

// Calendar sync routes (academic calendars)
router.get('/calendar-sync', getCalendarSyncs);
router.delete('/calendar-sync/user/all', deleteAllUserCalendarSyncs);
router.patch('/calendar-sync/:id/toggle', toggleCalendarSync);
router.post('/calendar-sync/:id/sync-now', syncNow);

// Rutas protegidas
router.get('/auth/profile', getProfile);

export default router;