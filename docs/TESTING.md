# 🧪 Testing Guide - TeachingPlanner

Guía completa para ejecutar tests en el proyecto TeachingPlanner.

---

## 📋 Tabla de Contenidos

- [Quick Start](#-quick-start)
- [Tests de Integración (Backend)](#-tests-de-integración-backend)
- [Tests E2E (Frontend)](#-tests-e2e-frontend)
- [Limpieza de Base de Datos](#-limpieza-de-base-de-datos)
- [Setup Inicial](#️-setup-inicial)
- [Troubleshooting](#-troubleshooting)
- [Mejores Prácticas](#-mejores-prácticas)

---

## 🚀 Quick Start

### Primera Vez (Setup Completo)

```bash
# 1. Levantar base de datos
docker-compose -f docker-compose.dev.yml up -d

# 2. Crear usuario de prueba (SOLO UNA VEZ)
cd user_service
npm run seed:test-user

# 3. Ejecutar tests de integración (backend)
cd ../planner_service
npm test

# 4. Levantar servicios backend para E2E
# Terminal 1-4: levantar auth, gateway, planner, user services
cd ../auth_service && npm run dev
cd ../gateway_service && npm run dev
cd ../planner_service && npm run dev
cd ../user_service && npm run dev

# 5. Ejecutar tests E2E con limpieza de BD (RECOMENDADO)
cd ../webapp
npm run test:e2e:clean
```

### Ejecuciones Subsecuentes

```bash
# Backend Integration Tests
cd planner_service
npm test

# Frontend E2E Tests con BD limpia (RECOMENDADO)
cd webapp
npm run test:e2e:clean

# Frontend E2E Tests sin limpiar BD
npm run test:e2e
```

---

## 🔧 Tests de Integración (Backend)

**Ubicación**: `planner_service/src/__tests__/integration/`

**Tecnología**: Jest + Testcontainers (MariaDB)

### Comandos Disponibles

```bash
cd planner_service

# Todos los tests
npm test

# Con cobertura
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch

# Solo tests de integración
npm run test:integration

# Para CI/CD
npm run test:ci
```

### Requisitos

- **Docker** corriendo (para Testcontainers)
- Node.js 18+
- Primera ejecución descarga imagen de MariaDB (~30-60s)

### Características

- Los tests levantan automáticamente un contenedor de MariaDB
- El contenedor se destruye automáticamente al finalizar
- Primera ejecución puede tardar más (descarga imagen de Docker)
- Timeout de 120 segundos para inicio de contenedor

### Tiempos de Ejecución

- **Setup inicial**: ~30-60 segundos (primera vez, descarga imagen)
- **Tests subsecuentes**: ~15-30 segundos
- **Cada test individual**: ~2-5 segundos

### Cobertura

El objetivo de cobertura actual es:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Ver reporte:
```bash
npm run test:coverage
# Abrir: coverage/lcov-report/index.html
```

---

## 🌐 Tests E2E (Frontend)

**Ubicación**: `webapp/e2e/`

**Tecnología**: Playwright

**Total**: 32 tests (Auth, Classrooms, Courses, Degrees)

### Comandos Disponibles

```bash
cd webapp

# ✅ CON LIMPIEZA DE BD (RECOMENDADO)
npm run test:e2e:clean

# Sin limpieza de BD
npm run test:e2e

# Solo limpiar BD
npm run clean:test-db

# Modo UI interactivo
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug

# Ver reporte HTML
npm run test:e2e:report
```

### ¿Por qué usar `test:e2e:clean`?

Los tests E2E son **deterministas** cuando se ejecutan con base de datos limpia. Sin limpieza pueden fallar por:

- **Paginación**: Elementos creados en ejecuciones anteriores pueden estar en otras páginas
- **Duplicados**: Nombres/códigos que ya existen en la BD
- **Estado inconsistente**: Datos residuales de tests fallidos

**Recomendación**: Siempre usar `npm run test:e2e:clean` para evitar falsos negativos.

### Requisitos

- ✅ Base de datos corriendo
- ✅ Usuario de prueba creado (`npm run seed:test-user` en user_service)
- ✅ `NODE_ENV=development` o `NODE_ENV=test` en `.env`
- ✅ Todos los servicios backend corriendo:
  - auth_service
  - gateway_service
  - planner_service
  - user_service
- Node.js 18+
- Navegadores instalados (Playwright los descarga automáticamente)

### Características de Playwright

#### Auto-wait
Playwright espera automáticamente a que los elementos estén listos antes de interactuar.

#### Screenshots y Videos
- Screenshots: Solo en fallos
- Videos: Solo en reintentos/fallos
- Ubicación: `test-results/`

#### Traces
Las trazas se capturan en el primer reintento. Ver con:
```bash
npx playwright show-trace test-results/.../trace.zip
```

---

## 🧹 Limpieza de Base de Datos

### ¿Qué hace?

El sistema de limpieza elimina **todos los datos** de las siguientes tablas antes de ejecutar los tests:

1. EventRequests
2. PuntualEvents
3. PeriodicEvents
4. Calendars
5. Groups
6. Subjects
7. Classrooms
8. Courses
9. Degrees

### Arquitectura

```
webapp (clean-test-db.ts)
    │
    └─▶ POST /test/reset-database
            │
            ▼
        gateway_service (proxy)
            │
            └─▶ planner_service (limpia BD)
                    │
                    └─▶ PostgreSQL (DELETE en cascada)
```

### Endpoint

- **URL**: `POST http://localhost:3000/test/reset-database`
- **Seguridad**: Solo funciona si `NODE_ENV=test` o `NODE_ENV=development`
- **Retorno**: 403 Forbidden en otros entornos

### Uso

```bash
# Limpiar BD + Ejecutar tests (recomendado)
npm run test:e2e:clean

# Solo limpiar BD
npm run clean:test-db
```

### Configuración Requerida

En `.env` (raíz del proyecto):

```bash
NODE_ENV=development
VITE_GATEWAY_URL=http://localhost:3000
```

### Seguridad

- ✅ Solo funciona en entornos de desarrollo y test
- ✅ Usa transacciones para garantizar consistencia
- ✅ **NO funcionará en producción** (protección por entorno)

---

## ⚙️ Setup Inicial

### 1. Instalar Dependencias

```bash
# Instalar en todos los servicios (desde la raíz)
npm install

# Instalar navegadores de Playwright
cd webapp
npx playwright install chromium
```

### 2. Configurar Base de Datos

```bash
# Levantar MariaDB/PostgreSQL con Docker
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Crear Usuario de Prueba

**IMPORTANTE**: Ejecutar **UNA SOLA VEZ**

```bash
cd user_service
npm run seed:test-user
```

Esto crea:
- **Email**: `admin@test.com`
- **Password**: `Admin123!`
- **Role**: `ADMIN`
- **Marker**: `E2E_TEST_USER` (para identificación)

**Nota**: Solo necesitas ejecutar el seed una vez. El usuario quedará guardado en la base de datos.

### 4. Configurar Variables de Entorno

Asegúrate de tener `.env` configurado:

```bash
NODE_ENV=development
VITE_GATEWAY_URL=http://localhost:3000
```

### 5. Levantar Servicios Backend (para E2E)

Los tests E2E requieren que todos los servicios backend estén corriendo:

```bash
# Terminal 1: Auth Service
cd auth_service && npm run dev

# Terminal 2: Gateway Service
cd gateway_service && npm run dev

# Terminal 3: Planner Service
cd planner_service && npm run dev

# Terminal 4: User Service
cd user_service && npm run dev
```

**Alternativa con Docker** (si lo prefieres):
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 🐛 Troubleshooting

### Tests de Integración (Backend)

#### Error: "Cannot connect to Docker daemon"
**Solución**: Asegúrate de que Docker Desktop está corriendo.

#### Error: "Timeout waiting for container"
**Solución**:
- Primera vez puede tardar más (descarga imagen)
- Verifica que Docker tiene suficientes recursos
- Aumenta el timeout en `jest.config.js` (actualmente 60s)

#### Tests muy lentos
**Solución**:
- Primera ejecución tarda más (setup de contenedor)
- Ejecuciones subsecuentes: ~15-30 segundos

### Tests E2E (Frontend)

#### Error: "fetch failed" o "ECONNREFUSED" al limpiar BD
**Solución**: Los servicios backend no están corriendo. Levántalos con:
```bash
cd gateway_service && npm run dev
cd planner_service && npm run dev
```

#### Error: "This endpoint is only available in test or development environment"
**Solución**: Añadir/modificar en `.env`:
```bash
NODE_ENV=development
```

#### Error: "Test user login failed"
**Solución**:
```bash
# Verificar que el usuario existe
cd user_service
npm run seed:test-user
```

#### Error: "Cannot connect to localhost:3000"
**Solución**: Verificar que todos los servicios backend estén corriendo:
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3002
netstat -ano | findstr :3003

# Linux/Mac
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003
```

#### Error: "Timeout waiting for locator"
**Solución**:
- Verificar que el frontend está corriendo (`npm run dev` en webapp)
- Verificar que los servicios backend responden
- Revisar logs de los servicios
- Aumenta timeouts en `playwright.config.ts`

#### Tests fallan aleatoriamente o por paginación
**Solución**:
- ✅ **Usar siempre**: `npm run test:e2e:clean`
- Aumentar timeouts en `playwright.config.ts`
- Ejecutar con `--workers=1` para evitar paralelismo
- La limpieza de BD resuelve el 90% de estos problemas

---

## 💡 Mejores Prácticas

### Selectores E2E

✅ **Usar**:
```typescript
getByRole('button', { name: /login/i })
getByLabel('Email')
getByPlaceholder('Enter email')
getByText(/unique text/i)
```

❌ **Evitar**:
```typescript
// CSS selectores frágiles
page.locator('.btn-primary')

// Posicionales
page.locator('button').first()
page.locator('button').nth(3)

// XPath complejos
page.locator('//div[@class="container"]//button[1]')
```

### Datos de Prueba

- Usar timestamps para IDs únicos: `TEST${Date.now()}`
- **Limpiar BD antes de cada ejecución**: `npm run test:e2e:clean`
- No depender de estado de tests anteriores
- Usar nombres únicos y específicos para evitar colisiones

### Assertions

- Usar timeouts explícitos para elementos asincrónicos
- Usar `toBeVisible()` en vez de `toBeTruthy()`
- Verificar URLs con `toHaveURL()`
- Verificar estados de la aplicación, no solo DOM

### Organización

- Un archivo de test por entidad/módulo
- Usar `describe` para agrupar tests relacionados
- Usar `beforeEach` para setup común
- Mantener tests independientes entre sí

### Ejecución de Tests

- ✅ **CI/CD**: Siempre `npm run test:e2e:clean`
- ✅ **Desarrollo local**: `npm run test:e2e:clean` para evitar falsos negativos
- ⚠️ **Debug rápido**: `npm run test:e2e` solo si sabes que la BD está limpia

---

## 🚀 CI/CD con GitHub Actions

### Configuración

Los tests E2E se ejecutan automáticamente en GitHub Actions cuando:
- Se hace push a la rama `master`
- Se abre, actualiza o reabre un Pull Request

### Arquitectura en CI

```
GitHub Actions Workflow
├── 1. Levantar MariaDB service (planner_db_test + management_db_test)
├── 2. Instalar dependencias (todos los servicios)
├── 3. Compilar servicios backend (npm run build)
├── 4. Levantar servicios en background
├── 5. Esperar a que servicios estén listos (wait-for-services.sh)
├── 6. Crear usuario de prueba (npm run seed:ci)
├── 7. Instalar Playwright chromium
├── 8. Ejecutar tests E2E (npm run test:e2e:ci)
└── 9. Upload artifacts si falla (screenshots, videos, HTML report)
```

### Archivos de Configuración

- **`.env.ci`** - Variables de entorno específicas para CI
- **`webapp/scripts/wait-for-services.sh`** - Script que espera servicios ready
- **`.github/workflows/tests.yml`** - Workflow de GitHub Actions

### Variables de Entorno en CI

```bash
NODE_ENV=test
PLANNER_DATABASE_HOST=127.0.0.1
PLANNER_DATABASE_PORT=3306
MANAGEMENT_DATABASE_HOST=127.0.0.1
MANAGEMENT_DATABASE_PORT=3306
GATEWAY_SERVICE_PORT=8080
# ... (ver .env.ci para lista completa)
```

### Servicios en CI

| Servicio | Puerto | Health Check |
|----------|--------|--------------|
| **Gateway** | 8080 | `GET /api/degrees` |
| **Planner** | 5001 | `GET /degrees` |
| **Auth** | 5003 | `GET /health` |
| **User** | 5002 | `GET /health` |
| **MariaDB** | 3306 | `mariadb-admin ping` |

### Reportes y Artifacts

Si los tests fallan, GitHub Actions guarda:
- 📊 **HTML Report** - Reporte visual de Playwright
- 📸 **Screenshots** - Capturas de pantalla de tests fallidos
- 🎥 **Videos** - Grabaciones de tests fallidos
- 📝 **Logs** - Logs de los servicios backend

**Acceso**: En la pestaña "Actions" del repositorio → Workflow fallido → "Artifacts"

**Retención**: 7 días

### Tiempos de Ejecución Esperados

- **Setup (MariaDB + deps + build)**: ~3-4 minutos
- **Levantar servicios**: ~30-60 segundos
- **Ejecutar 32 tests E2E**: ~2-3 minutos
- **Total**: ~6-8 minutos

### Troubleshooting CI

#### Tests fallan en CI pero pasan localmente

**Causas comunes:**
- Diferentes versiones de Node.js
- Timeouts muy cortos para CI (CI es más lento)
- Base de datos con datos residuales

**Solución:**
- Verificar que usas Node.js 20 en ambos
- Aumentar timeouts en `playwright.config.ts`
- El workflow usa BD limpia cada vez

#### Error: "Cannot connect to database"

**Causa**: MariaDB service no está listo

**Solución**: El workflow ya tiene health checks, pero si persiste:
- Aumentar `health-retries` en el workflow
- Añadir más tiempo en `wait-for-services.sh`

#### Error: "Service not responding"

**Causa**: Algún servicio tardó más de 120s en arrancar

**Solución**:
- Revisar logs del servicio (se muestran automáticamente si falla)
- Aumentar `TIMEOUT` en `wait-for-services.sh`

#### Tests pasan pero workflow falla en cleanup

**Causa**: PIDs no se guardaron correctamente

**Solución**: No es crítico, GitHub limpia automáticamente

### Ejecutar localmente como en CI

Para replicar el ambiente de CI localmente:

```bash
# 1. Copiar configuración de CI
cp .env.ci .env

# 2. Compilar servicios
cd gateway_service && npm run build && cd ..
cd planner_service && npm run build && cd ..
cd auth_service && npm run build && cd ..
cd user_service && npm run build && cd ..

# 3. Levantar servicios con npm start (no npm run dev)
cd gateway_service && npm start &
cd planner_service && npm start &
cd auth_service && npm start &
cd user_service && npm start &

# 4. Ejecutar tests
cd webapp
npm run test:e2e:ci
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 👥 Contribuir

Al agregar nuevas features:

1. ✅ Escribe tests E2E para flujos críticos
2. ✅ Escribe tests de integración para lógica compleja
3. ✅ Usa `npm run test:e2e:clean` antes de hacer commit
4. ✅ Asegúrate de que todos los tests pasen
5. ✅ Actualiza esta documentación si es necesario

---

## 🔍 Estructura del Proyecto

```
TeachingPlanner/
├── planner_service/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup/testDatabase.ts
│   │   │   └── integration/*.test.ts
│   │   ├── controllers/
│   │   │   └── test.controller.ts        # Endpoint de limpieza
│   │   └── routes/
│   │       └── test.routes.ts            # Ruta de test
│   └── jest.config.js
│
├── gateway_service/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── planner.controller.ts     # Proxy de limpieza
│   │   └── routes/
│   │       └── planner.routes.ts         # Ruta de test
│
├── webapp/
│   ├── e2e/
│   │   ├── auth.spec.ts                  # 6 tests
│   │   ├── classroom.spec.ts             # 8 tests
│   │   ├── course.spec.ts                # 9 tests
│   │   └── degree.spec.ts                # 9 tests
│   ├── scripts/
│   │   ├── clean-test-db.ts              # Script de limpieza
│   │   └── wait-for-services.ts          # Script para CI
│   ├── playwright.config.ts
│   └── package.json
│
├── user_service/
│   └── scripts/
│       └── seed-test-user.ts
│
├── .github/workflows/
│   └── tests.yml                         # Workflow CI/CD
│
├── .env.ci                                # Config para CI
│
└── docs/
    └── TESTING.md                         # Este archivo
```

---

**¿Preguntas?** Consulta la documentación de cada herramienta o revisa los tests existentes como ejemplo.
