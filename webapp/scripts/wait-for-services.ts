/**
 * Script para esperar a que todos los servicios backend estén listos
 * Se usa en GitHub Actions CI para asegurar que los servicios respondan antes de ejecutar tests
 */

const TIMEOUT = 120000; // 120 segundos
const INTERVAL = 2000; // 2 segundos

const services = [
    { name: 'Gateway Service', url: 'http://localhost:8080/api/degrees' },
    { name: 'Planner Service', url: 'http://localhost:5001/degrees' },
    { name: 'Auth Service', url: 'http://localhost:5003/health' },
    { name: 'User Service', url: 'http://localhost:5002/health' },
];

async function checkService(name: string, url: string): Promise<boolean> {
    const startTime = Date.now();

    console.log(`🔍 Verificando ${name} en ${url}`);

    while (Date.now() - startTime < TIMEOUT) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log(`✅ ${name} está listo`);
                return true;
            }
        } catch (error) {
            // Servicio no disponible aún, seguir intentando
        }

        // Mostrar progreso cada 10 segundos
        const elapsed = Date.now() - startTime;
        if (elapsed % 10000 < INTERVAL) {
            console.log(`   ⏱️  Esperando ${name}... (${Math.floor(elapsed / 1000)}s/${TIMEOUT / 1000}s)`);
        }

        await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }

    console.error(`❌ Timeout esperando a ${name} después de ${TIMEOUT / 1000}s`);
    return false;
}

async function waitForAllServices() {
    console.log('⏳ Esperando a que los servicios estén listos...\n');

    const results = await Promise.all(
        services.map(({ name, url }) => checkService(name, url))
    );

    console.log('');

    const allReady = results.every(result => result === true);

    if (allReady) {
        console.log('🎉 Todos los servicios están listos!');
        process.exit(0);
    } else {
        console.error('💥 Algunos servicios no respondieron a tiempo');
        process.exit(1);
    }
}

// Ejecutar
waitForAllServices();
