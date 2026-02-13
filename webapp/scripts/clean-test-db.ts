/**
 * Script para limpiar la base de datos de test antes de ejecutar los tests E2E
 *
 * Este script hace una petición al endpoint /test/reset-database del planner_service
 * para eliminar todos los datos de la base de datos de test.
 *
 * IMPORTANTE: Solo funciona si NODE_ENV está en 'test' o 'development'
 */

const GATEWAY_API_URL = process.env.VITE_GATEWAY_API_URL || 'http://localhost:8080/api';
const RESET_ENDPOINT = `${GATEWAY_API_URL}/test/reset-database`;

async function cleanTestDatabase() {
    console.log('🧹 Limpiando base de datos de test...');
    console.log(`📡 Endpoint: ${RESET_ENDPOINT}`);

    try {
        const response = await fetch(RESET_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Error ${response.status}: ${error.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('✅', result.message);
        console.log('');
    } catch (error) {
        console.error('❌ Error al limpiar la base de datos:', error);
        console.error('');
        console.error('Asegúrate de que:');
        console.error('  1. Los servicios backend están corriendo');
        console.error('  2. NODE_ENV está configurado como "test" o "development"');
        console.error('  3. La URL del gateway es correcta:', GATEWAY_API_URL);
        console.error('');
        process.exit(1);
    }
}

// Ejecutar la limpieza
cleanTestDatabase();
