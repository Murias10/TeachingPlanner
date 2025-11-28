# Integración de SonarQube en Teaching Planner

Este documento explica cómo usar SonarQube para analizar la calidad del código de todos los microservicios del proyecto.

## Archivos Creados

- `docker-compose.sonarqube.yml` - Configuración de Docker Compose para SonarQube y el scanner
- `sonar-project.properties` - Configuración del proyecto para analizar todos los microservicios
- `.env.sonarqube` - Variables de entorno (token de SonarQube)
- `package.json` - Scripts npm para facilitar el uso
- `.gitignore` - Actualizado para excluir archivos de SonarQube

## Configuración Inicial (Primera vez)

### 1. Levantar SonarQube

```bash
npm run sonar:start
```

Espera 1-2 minutos mientras SonarQube se inicializa completamente.

### 2. Acceder a SonarQube

Abre tu navegador en: http://localhost:9000

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin`

En el primer acceso te pedirá cambiar la contraseña. Elige una nueva y guárdala.

### 3. Generar Token de Autenticación

1. Una vez dentro de SonarQube, haz clic en tu perfil (esquina superior derecha)
2. Ve a: **My Account** > **Security**
3. En la sección **Generate Tokens**:
   - Name: `teaching-planner-scanner`
   - Type: `Global Analysis Token`
   - Expires in: `No expiration` (o elige un período)
4. Haz clic en **Generate**
5. **IMPORTANTE:** Copia el token generado (solo se muestra una vez)

### 4. Configurar el Token

Copia el archivo `.env.sonarqube` y reemplaza el token:

```bash
cp .env.sonarqube .env.sonarqube.local
```

Edita `.env.sonarqube.local` y pega tu token:

```env
SONAR_TOKEN=squ_tu_token_aqui_generado
```

**IMPORTANTE:** El archivo `.env.sonarqube` está excluido del repositorio por seguridad.

## Uso Diario

### Scripts Disponibles

#### Iniciar SonarQube
```bash
npm run sonar:start
```
Levanta el servidor de SonarQube en http://localhost:9000

#### Ejecutar Análisis
```bash
npm run sonar:scan
```
Ejecuta el análisis de código de todos los microservicios. Requiere que el archivo `.env.sonarqube` tenga el token configurado.

#### Ver Logs de SonarQube
```bash
npm run sonar:logs
```

#### Ver Logs del Scanner
```bash
npm run sonar:logs-scanner
```

#### Reiniciar SonarQube
```bash
npm run sonar:restart
```

#### Apagar SonarQube
```bash
npm run sonar:stop
```

#### Limpiar Todo (incluye volúmenes)
```bash
npm run sonar:clean
```
**CUIDADO:** Esto eliminará todos los datos de SonarQube (proyectos, configuraciones, histórico).

#### Análisis Completo (inicio + análisis)
```bash
npm run sonar:full
```
Inicia SonarQube, espera a que esté listo y ejecuta el análisis automáticamente.

## Flujo de Trabajo Recomendado

### Primera vez
```bash
# 1. Levantar SonarQube
npm run sonar:start

# 2. Esperar ~2 minutos, acceder a http://localhost:9000
# 3. Login (admin/admin), cambiar contraseña
# 4. Generar token en My Account > Security
# 5. Copiar token al archivo .env.sonarqube

# 6. Ejecutar primer análisis
npm run sonar:scan

# 7. Ver resultados en http://localhost:9000
```

### Análisis Regular
```bash
# Si SonarQube ya está corriendo:
npm run sonar:scan

# Si no está corriendo:
npm run sonar:full
```

### Al terminar tu sesión
```bash
# Puedes dejar SonarQube corriendo o apagarlo:
npm run sonar:stop
```

## Configuración del Proyecto

### Microservicios Analizados

El análisis incluye todos los microservicios:

- **auth_service** - Servicio de autenticación
- **gateway_service** - API Gateway
- **planner_service** - Servicio principal de planificación
- **user_service** - Gestión de usuarios
- **webapp** - Frontend React

### Exclusiones

Se excluyen del análisis:
- `node_modules/`
- `dist/`, `build/`
- `coverage/`
- Archivos de test (`*.spec.ts`, `*.test.tsx`)
- Componentes UI generados (`webapp/src/components/ui/`)
- Directorios de base de datos

### Métricas de Cobertura

Si ejecutas tests con cobertura, SonarQube mostrará los datos de cobertura si los archivos `lcov.info` existen en:
- `auth_service/coverage/lcov.info`
- `gateway_service/coverage/lcov.info`
- `planner_service/coverage/lcov.info`
- `user_service/coverage/lcov.info`
- `webapp/coverage/lcov.info`

## Solución de Problemas

### SonarQube no inicia
```bash
# Ver logs para identificar el problema
npm run sonar:logs

# Si hay problemas de permisos o corrupción, limpia y reinicia:
npm run sonar:clean
npm run sonar:start
```

### El análisis falla con error de token
1. Verifica que `.env.sonarqube` existe y tiene el token correcto
2. Verifica que el token no ha expirado en SonarQube
3. Genera un nuevo token si es necesario

### El análisis falla porque SonarQube no está listo
```bash
# Usa el comando full que espera automáticamente:
npm run sonar:full

# O espera manualmente más tiempo después de:
npm run sonar:start
# Espera 2-3 minutos antes de ejecutar:
npm run sonar:scan
```

### Healthcheck falla
El healthcheck puede tardar en SonarQube. Si después de 3-4 minutos sigue fallando:
```bash
# Ver estado de los contenedores
docker ps -a

# Ver logs detallados
npm run sonar:logs
```

## Integración con CI/CD

Para integrar con CI/CD (GitHub Actions, GitLab CI, etc.):

1. Agrega el token de SonarQube como secreto en tu plataforma CI/CD
2. Usa el mismo `sonar-project.properties`
3. Ejecuta el scanner en tu pipeline:

```yaml
# Ejemplo GitHub Actions
- name: SonarQube Scan
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: https://sonarcloud.io  # o tu instancia
  run: |
    npm install -g sonarqube-scanner
    sonar-scanner
```

## Recursos

- Documentación oficial: https://docs.sonarqube.org/
- SonarQube local: http://localhost:9000
- Dashboard del proyecto: http://localhost:9000/dashboard?id=teaching-planner
