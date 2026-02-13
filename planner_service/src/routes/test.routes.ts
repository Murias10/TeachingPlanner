import { Router } from 'express';
import { resetTestDatabase } from '@/controllers/test.controller';

const router = Router();

// Endpoint para limpiar la base de datos de test
// SOLO disponible en entornos de test/development
router.post('/test/reset-database', resetTestDatabase);

export default router;
