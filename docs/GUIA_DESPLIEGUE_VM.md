# 🚀 Guía Completa de Despliegue en Máquina Virtual

Esta guía detalla cómo configurar el despliegue automático de TeachingPlanner en una máquina virtual dentro de la VPN de la Universidad de Oviedo utilizando GitHub Actions con un runner auto-hospedado.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Máquina virtual con Ubuntu 20.04 LTS o superior
- ✅ Acceso VPN a la red de la Universidad de Oviedo
- ✅ Acceso SSH a la máquina virtual
- ✅ Permisos de administrador en el repositorio de GitHub
- ✅ Cuenta de GitHub con acceso al repositorio `murias10/TeachingPlanner`

---

## 🏗️ Arquitectura del Despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    Tu Máquina Local                      │
│  (Desarrollo)                                            │
└────────────────┬────────────────────────────────────────┘
                 │ git push origin main
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  GitHub Repository                       │
│  - Código fuente                                         │
│  - GitHub Actions Workflows                              │
│  - GitHub Container Registry (GHCR)                      │
└────────────────┬────────────────────────────────────────┘
                 │ Trigger workflow
                 ▼
┌─────────────────────────────────────────────────────────┐
│            Self-Hosted GitHub Runner                     │
│  (Ejecuta dentro de tu VM)                               │
│  - Tests unitarios                                       │
│  - Tests E2E                                             │
│  - Build de imágenes Docker                              │
│  - Push a GHCR                                           │
│  - Deploy en la VM                                       │
└────────────────┬────────────────────────────────────────┘
                 │ Deploy
                 ▼
┌─────────────────────────────────────────────────────────┐
│        VM Universidad de Oviedo (VPN)                    │
│  ┌─────────────────────────────────────────────┐        │
│  │     Docker Compose Stack                     │        │
│  │  - webapp (Frontend React)                   │        │
│  │  - gateway (API Gateway)                     │        │
│  │  - planner_service (Servicio Planificación)  │        │
│  │  - auth_service (Autenticación)              │        │
│  │  - user_service (Gestión Usuarios)           │        │
│  │  - planner_database (MySQL)                  │        │
│  │  - management_database (MySQL)               │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## ⚡ Paso 1: Preparar la Máquina Virtual

### 1.1. Conectarse a la VM

```bash
# 1. Conectar a la VPN de la Universidad de Oviedo
# (Usa el cliente VPN proporcionado por la universidad)

# 2. Conectar por SSH a la VM
ssh usuario@ip_de_la_vm
```

**Nota**: Sustituye `usuario` por tu nombre de usuario y `ip_de_la_vm` por la IP asignada a tu máquina virtual.

### 1.2. Actualizar el Sistema

```bash
# Actualizar lista de paquetes
sudo apt update

# Actualizar todos los paquetes instalados
sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y curl wget git nano
```

### 1.3. Instalar Docker

```bash
# Descargar script de instalación oficial de Docker
curl -fsSL https://get.docker.com -o get-docker.sh

# Ejecutar instalación
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Instalar Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verificar instalación
docker --version
docker compose version
```

**IMPORTANTE**: Después de agregar tu usuario al grupo docker, debes cerrar sesión y volver a conectar por SSH para que los cambios surtan efecto.

```bash
# Cerrar sesión actual
exit

# Reconectar por SSH
ssh usuario@ip_de_la_vm
```

### 1.4. Verificar que Docker funciona sin sudo

```bash
# Esto NO debe pedir contraseña ni mostrar errores de permisos
docker ps

# Debe mostrar una tabla vacía (sin containers corriendo aún)
```

Si obtienes un error de permisos, verifica que estés en el grupo docker:

```bash
groups $USER
# Debe incluir "docker" en la lista
```

---

## 🤖 Paso 2: Configurar Self-Hosted GitHub Runner

El runner auto-hospedado permite que GitHub Actions ejecute los workflows directamente en tu VM.

### 2.1. Obtener el Token de Registro

1. Abre tu navegador y ve al repositorio: `https://github.com/murias10/TeachingPlanner`
2. Click en **Settings** (configuración del repositorio)
3. En el menú lateral, click en **Actions** → **Runners**
4. Click en el botón verde **New self-hosted runner**
5. Selecciona **Linux** como sistema operativo
6. **NO CIERRES ESTA PÁGINA** - necesitarás copiar comandos de aquí

### 2.2. Instalar el Runner en la VM

En tu terminal SSH conectado a la VM, ejecuta:

```bash
# Crear directorio para el runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Descargar el runner (COPIA el comando exacto desde GitHub, la versión puede cambiar)
# Ejemplo de comando (usa el que aparece en tu página de GitHub):
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extraer el archivo
tar xzf ./actions-runner-linux-x64-*.tar.gz
```

### 2.3. Configurar el Runner

Ahora configura el runner con el token que aparece en la página de GitHub:

```bash
# COPIA el comando exacto desde GitHub (incluye tu token único)
# Ejemplo de comando:
./config.sh --url https://github.com/murias10/TeachingPlanner --token AABBCCDDEE_TU_TOKEN_UNICO_AQUI

# Durante la configuración, responde las preguntas:
```

**Preguntas de configuración**:

| Pregunta | Respuesta Recomendada |
|----------|----------------------|
| Enter the name of the runner | `vm-uniovi-runner` (o presiona Enter para default) |
| Enter the name of runner group | Presiona `Enter` (default) |
| Enter labels for this runner | `self-hosted,vm-uniovi,linux` |
| Enter name of work folder | Presiona `Enter` (default: `_work`) |

### 2.4. Instalar el Runner como Servicio del Sistema

Esto hace que el runner se inicie automáticamente cuando la VM se reinicie:

```bash
# Instalar como servicio systemd
sudo ./svc.sh install

# Iniciar el servicio
sudo ./svc.sh start

# Verificar estado
sudo ./svc.sh status
```

**Salida esperada**:
```
● actions.runner.murias10-TeachingPlanner.vm-uniovi-runner.service
   Loaded: loaded
   Active: active (running)
```

Si ves `Active: active (running)` con un punto verde, ¡todo está correcto!

### 2.5. Verificar en GitHub

1. Vuelve a la página de GitHub: **Settings** → **Actions** → **Runners**
2. Deberías ver tu runner listado con:
   - Nombre: `vm-uniovi-runner`
   - Estado: **Idle** 🟢 (punto verde)
   - Labels: `self-hosted`, `vm-uniovi`, `linux`

Si el estado es **Offline** 🔴, revisa los logs:

```bash
cd ~/actions-runner
cat _diag/Runner_*.log
```

---

## 📁 Paso 3: Configurar la Aplicación

### 3.1. Crear Estructura de Directorios

```bash
# Crear directorio principal de la aplicación
mkdir -p ~/TeachingPlanner
cd ~/TeachingPlanner

# Crear directorio para volúmenes de bases de datos (opcional, Docker lo crea automáticamente)
mkdir -p data/planner_db data/management_db
```

### 3.2. Crear y Configurar el Archivo .env

El archivo `.env` contiene todas las variables de entorno necesarias para los servicios:

```bash
# Crear archivo .env
nano .env
```

Copia y pega la siguiente configuración, **ajustando los valores según tu entorno**:

```env
# ========================================
# CONFIGURACIÓN DE DOMINIO
# ========================================
# Dominio público de la aplicación (si tienes uno configurado)
# Si accedes por IP, usa: http://IP_DE_TU_VM
DOMAIN=teachingplanner.uniovi.es

# ========================================
# CONFIGURACIÓN DE SERVICIOS - WEBAPP
# ========================================
WEBAPP_HOST=webapp
WEBAPP_PORT=80

# ========================================
# CONFIGURACIÓN DE SERVICIOS - BACKEND
# ========================================
# Gateway (API Gateway)
GATEWAY_SERVICE_HOST=gateway
GATEWAY_SERVICE_PORT=3000

# Planner Service (Servicio de planificación de horarios)
PLANNER_SERVICE_HOST=planner_service
PLANNER_SERVICE_PORT=3001

# Auth Service (Servicio de autenticación)
AUTH_SERVICE_HOST=auth_service
AUTH_SERVICE_PORT=3002

# User Service (Servicio de gestión de usuarios)
USER_SERVICE_HOST=user_service
USER_SERVICE_PORT=3003

# ========================================
# BASE DE DATOS - PLANNER
# ========================================
PLANNER_DATABASE_HOST=planner_database
PLANNER_DATABASE_PORT=3306
PLANNER_DATABASE_USER=planner_user
PLANNER_DATABASE_PASSWORD=PlAnNeR_P4ssw0rd_2024_S3cur3!
PLANNER_DATABASE_DATABASE=planner_db
PLANNER_DATABASE_ROOT_PASSWORD=PlAnNeR_R00t_P4ssw0rd_2024!

# ========================================
# BASE DE DATOS - MANAGEMENT
# ========================================
MANAGEMENT_DATABASE_HOST=management_database
MANAGEMENT_DATABASE_PORT=3307
MANAGEMENT_DATABASE_USER=management_user
MANAGEMENT_DATABASE_PASSWORD=M4n4g3m3nt_P4ssw0rd_2024_S3cur3!
MANAGEMENT_DATABASE_DATABASE=management_db
MANAGEMENT_DATABASE_ROOT_PASSWORD=M4n4g3m3nt_R00t_P4ssw0rd_2024!

# ========================================
# SEGURIDAD - JWT
# ========================================
# Secreto para firmar tokens JWT (MÍNIMO 32 caracteres)
# GENERA UNO ÚNICO: openssl rand -base64 48
JWT_SECRET=tu_jwt_secret_super_largo_y_aleatorio_minimo_32_caracteres_o_mas

# ========================================
# CONFIGURACIÓN SMTP - EMAIL
# ========================================
# Para Gmail, debes usar una "App Password" de 16 caracteres
# Ve a: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM=noreply@teachingplanner.uniovi.es

# ========================================
# FRONTEND
# ========================================
# URL pública del frontend (para enlaces en emails)
FRONTEND_URL=https://teachingplanner.uniovi.es
```

**Pasos para personalizar**:

1. **JWT_SECRET**: Genera uno aleatorio ejecutando en la VM:
   ```bash
   openssl rand -base64 48
   ```
   Copia el resultado y pégalo en `JWT_SECRET=`

2. **Contraseñas de bases de datos**: Cámbialas por contraseñas seguras únicas

3. **SMTP**: Si usas Gmail:
   - Ve a https://myaccount.google.com/apppasswords
   - Genera una contraseña de aplicación (16 caracteres)
   - Úsala en `SMTP_PASSWORD` (con o sin espacios, ambos funcionan)

4. **DOMAIN y FRONTEND_URL**: Ajústalos según tu configuración:
   - Si tienes dominio: `teachingplanner.uniovi.es`
   - Si accedes por IP: `http://156.35.95.XXX`

Guarda el archivo:
- Presiona `Ctrl + O` → `Enter` (guardar)
- Presiona `Ctrl + X` (salir)

### 3.3. Proteger el Archivo .env

**MUY IMPORTANTE**: El archivo `.env` contiene credenciales sensibles. Debes protegerlo:

```bash
# Establecer permisos restrictivos (solo tu usuario puede leer/escribir)
chmod 600 .env

# Verificar permisos
ls -la .env
```

**Salida esperada**:
```
-rw------- 1 usuario usuario 1234 fecha .env
```

Los guiones `rw-------` significan que solo tú puedes leer y escribir el archivo. ✅

### 3.4. Verificar la Configuración

```bash
# Ver el contenido (sin mostrar contraseñas)
cat .env | grep -v PASSWORD | grep -v SECRET

# Verificar que el archivo existe y tiene contenido
wc -l .env
# Debe mostrar algo como: 50 .env
```

---

## 🔐 Paso 4: Generar Certificados SSL

Para que la aplicación funcione con HTTPS, necesitas generar certificados SSL. Estos certificados permitirán acceder a la aplicación tanto por dominio como por IP.

### 4.1. ¿Qué Tipo de Certificados Usar?

Tienes dos opciones:

| Opción | Ventajas | Desventajas | Recomendado Para |
|--------|----------|-------------|------------------|
| **Auto-firmados** | Gratis, rápidos, funcionan con IP | Advertencia en navegador | Desarrollo, acceso interno VPN |
| **Let's Encrypt** | Confiables, sin advertencias | Solo dominio, no IP | Producción pública |

**Para la VPN de la Universidad**: Usa certificados **auto-firmados** porque:
- Accedes por IP privada (156.35.95.XXX)
- Let's Encrypt no puede validar IPs privadas
- La advertencia del navegador no es problema en uso interno

### 4.2. Generar Certificados Auto-firmados

Conéctate a la VM y ejecuta estos comandos:

```bash
# Ir al directorio de la aplicación y crear carpeta de certificados
cd ~/TeachingPlanner
mkdir -p certs
cd certs

# Generar certificado que funcione con dominio e IP
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/C=ES/ST=Asturias/L=Oviedo/O=Universidad de Oviedo/CN=teachingplanner.duckdns.org" \
  -addext "subjectAltName=DNS:teachingplanner.duckdns.org,DNS:localhost,IP:156.35.95.119,IP:127.0.0.1"

# Establecer permisos seguros
chmod 600 key.pem
chmod 644 cert.pem

# Verificar que se generó correctamente
openssl x509 -in cert.pem -text -noout | grep -A 2 "Subject Alternative Name"
```

**IMPORTANTE**: Cambia estos valores en el comando:
- `CN=teachingplanner.duckdns.org` → Tu dominio (o usa `localhost`)
- `DNS:teachingplanner.duckdns.org` → Tu dominio
- `IP:156.35.95.119` → La IP real de tu VM

**Salida esperada del último comando**:
```
X509v3 Subject Alternative Name:
    DNS:teachingplanner.duckdns.org, DNS:localhost, IP Address:156.35.95.119, IP Address:127.0.0.1
```

Si ves tu dominio y tu IP, ¡perfecto! ✅

### 4.3. Actualizar Secrets en GitHub

Los certificados deben estar en GitHub Secrets para que el workflow los copie automáticamente a la VM en cada deploy.

**📝 ¿Por qué en GitHub Secrets?**

Los certificados están en **dos lugares**:
- **En la VM** (`~/TeachingPlanner/certs/`): Caddy los usa para servir HTTPS
- **En GitHub Secrets**: El workflow los copia a la VM automáticamente al desplegar

Esto permite que si cambias la IP o los certificados expiran, solo actualices los secrets y el siguiente deploy los copiará automáticamente, sin necesidad de SSH manual.

```bash
# En la VM, mostrar el contenido de los certificados
cat ~/TeachingPlanner/certs/cert.pem
cat ~/TeachingPlanner/certs/key.pem
```

Luego en GitHub:

1. Ve a tu repositorio: `https://github.com/murias10/TeachingPlanner`
2. **Settings** → **Secrets and variables** → **Actions**
3. Crear o actualizar estos secrets:

   **Secret: `SSL_CERT`**
   - Click en **New repository secret** (o editar si existe)
   - Name: `SSL_CERT`
   - Value: Copia **TODO** el contenido de `cert.pem`
     ```
     -----BEGIN CERTIFICATE-----
     MIIDxTCCAq2gAwIBAgIUXXXXXXXXXXXXXXXXXXXXXXXXXXXwDQYJ...
     ...
     -----END CERTIFICATE-----
     ```

   **Secret: `SSL_KEY`**
   - Click en **New repository secret** (o editar si existe)
   - Name: `SSL_KEY`
   - Value: Copia **TODO** el contenido de `key.pem`
     ```
     -----BEGIN PRIVATE KEY-----
     MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
     ...
     -----END PRIVATE KEY-----
     ```

**IMPORTANTE**: Copia el contenido COMPLETO, incluyendo las líneas `-----BEGIN` y `-----END`.

### 4.4. Verificar Certificados Localmente (Opcional)

```bash
# Probar HTTPS desde la VM
curl -k https://localhost
curl -k https://156.35.95.119

# El -k ignora errores de certificado auto-firmado
# Si devuelve HTML, funciona correctamente
```

---

## 🔄 Actualización: Cambio de IP de la Máquina Virtual

Si la Universidad cambia la IP de tu VM, necesitas regenerar los certificados y actualizar la configuración.

### Pasos a Seguir Cuando Cambia la IP:

#### 1. Actualizar el Archivo .env

```bash
# En la VM con la nueva IP
cd ~/TeachingPlanner
nano .env
```

Cambia la línea:
```env
SERVER_IP=156.35.95.XXX  # Nueva IP aquí
```

Guarda (`Ctrl+O`, `Enter`, `Ctrl+X`).

#### 2. Regenerar Certificados SSL

```bash
cd ~/TeachingPlanner/certs

# Generar nuevos certificados con la nueva IP
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/C=ES/ST=Asturias/L=Oviedo/O=Universidad de Oviedo/CN=teachingplanner.duckdns.org" \
  -addext "subjectAltName=DNS:teachingplanner.duckdns.org,DNS:localhost,IP:156.35.95.XXX,IP:127.0.0.1"

# Recuerda cambiar 156.35.95.XXX por la nueva IP real

# Establecer permisos
chmod 600 key.pem
chmod 644 cert.pem
```

#### 3. Actualizar Secrets en GitHub

Repite el **Paso 4.3** anterior:
- Copia el nuevo `cert.pem` al secret `SSL_CERT`
- Copia el nuevo `key.pem` al secret `SSL_KEY`

#### 4. Reiniciar Servicios

```bash
cd ~/TeachingPlanner

# Reiniciar webapp para que use los nuevos certificados
docker compose restart webapp

# Verificar logs
docker compose logs webapp | tail -20
```

#### 5. Verificar Acceso

```bash
# Desde la VM
curl -k https://156.35.95.XXX  # Nueva IP

# Desde tu navegador (con VPN)
https://156.35.95.XXX  # Nueva IP
```

### Checklist de Cambio de IP:

- [ ] Anotar la nueva IP asignada por la Universidad
- [ ] Actualizar `SERVER_IP` en el archivo `.env`
- [ ] Regenerar certificados SSL con la nueva IP
- [ ] Actualizar secrets `SSL_CERT` y `SSL_KEY` en GitHub
- [ ] Reiniciar servicio webapp
- [ ] Probar acceso por la nueva IP
- [ ] Actualizar documentación interna con la nueva IP
- [ ] Notificar al equipo si corresponde

---

## 🚀 Paso 5: Configurar GitHub Container Registry (GHCR)

Las imágenes Docker se almacenan en GitHub Container Registry. Debes dar permisos al runner para descargarlas.

### 4.1. Crear un Personal Access Token (PAT)

1. En GitHub, ve a **Settings** (tu perfil, no el repositorio)
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click en **Generate new token** → **Generate new token (classic)**
4. Configuración del token:
   - **Note**: `TeachingPlanner VM Runner`
   - **Expiration**: `No expiration` (o 1 año si prefieres renovarlo)
   - **Scopes**: Marca estas opciones:
     - ✅ `read:packages` (descargar imágenes)
     - ✅ `write:packages` (publicar imágenes)
     - ✅ `repo` (acceso completo al repositorio)
5. Click en **Generate token**
6. **COPIA EL TOKEN INMEDIATAMENTE** (no lo volverás a ver)

### 4.2. Configurar el Token en la VM

```bash
# Hacer login en GHCR desde la VM
echo "TU_TOKEN_AQUI" | docker login ghcr.io -u murias10 --password-stdin
```

**Salida esperada**:
```
Login Succeeded
```

### 4.3. Configurar Secret en GitHub

Para que el workflow pueda hacer push de imágenes:

1. Ve al repositorio: `https://github.com/murias10/TeachingPlanner`
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Configuración:
   - **Name**: `GHCR_TOKEN`
   - **Secret**: Pega tu Personal Access Token
5. Click en **Add secret**

---

## 🎯 Paso 6: Actualizar el Workflow de GitHub Actions

Asegúrate de que el workflow esté configurado para usar el runner de tu VM.

### 5.1. Verificar el Archivo de Workflow

En tu máquina local, abre el archivo:

```
.github/workflows/deploy-selfhosted.yml
```

Verifica que la sección `runs-on` use los labels correctos:

```yaml
jobs:
  deploy:
    runs-on: [self-hosted, vm-uniovi]  # O los labels que configuraste
```

### 5.2. Verificar Variables de Entorno del Workflow

El workflow debe tener configuradas estas variables:

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  DEPLOY_PATH: ~/TeachingPlanner
```

---

## 🚀 Paso 7: Realizar el Primer Deploy

### 7.1. Hacer Push a main

Desde tu máquina local:

```bash
# Navegar al directorio del proyecto
cd /ruta/a/TeachingPlanner

# Verificar que estás en la rama main
git branch
# Debe mostrar: * main

# Añadir todos los cambios
git add .

# Hacer commit
git commit -m "chore: configurar despliegue en VM UniOvi"

# Push a GitHub
git push origin main
```

### 7.2. Monitorear la Ejecución en GitHub

1. Ve a: `https://github.com/murias10/TeachingPlanner/actions`
2. Verás el workflow "Deploy to Self-Hosted VM" ejecutándose 🔄
3. Click en él para ver el progreso en tiempo real

**Fases del deploy**:

| Fase | Descripción | Duración Aprox. |
|------|-------------|-----------------|
| 🔍 Checkout | Descarga código | 10s |
| 🧪 Unit Tests | Tests unitarios backend | 30s-1min |
| 🧪 E2E Tests | Tests end-to-end | 1-2min |
| 🏗️ Build Images | Construye imágenes Docker | 3-5min |
| 📦 Push to GHCR | Sube imágenes al registry | 1-2min |
| 🚀 Deploy | Despliega en la VM | 1min |

**Tiempo total estimado**: 7-12 minutos (el primer deploy es más lento)

### 7.3. Verificar el Deploy en la VM

Mientras el workflow se ejecuta, conéctate a la VM:

```bash
# Conectar por SSH
ssh usuario@ip_vm

# Ir al directorio de la aplicación
cd ~/TeachingPlanner

# Ver logs en tiempo real
docker compose logs -f
```

Cuando veas mensajes como:
```
webapp_1    | Server is running on port 80
gateway_1   | Gateway listening on port 3000
```

¡El despliegue fue exitoso! 🎉

### 7.4. Verificar que Todos los Servicios Están Corriendo

```bash
# Ver estado de todos los containers
docker compose ps
```

**Salida esperada**:

```
NAME                       STATUS        PORTS
webapp                     Up           0.0.0.0:80->80/tcp
gateway                    Up           0.0.0.0:3000->3000/tcp
planner_service            Up           3001/tcp
auth_service               Up           3002/tcp
user_service               Up           3003/tcp
planner_database           Up           3306/tcp
management_database        Up           3307/tcp
```

Todos los servicios deben mostrar **STATUS = Up** ✅

### 7.5. Probar la Aplicación

Abre tu navegador:

```
http://IP_DE_TU_VM
```

O si configuraste un dominio:

```
https://teachingplanner.uniovi.es
```

Deberías ver la interfaz de TeachingPlanner cargándose correctamente.

---

## 🔄 Flujo de Deploy Continuo

Una vez configurado todo, el proceso de deploy es muy simple:

### Para Desplegar Cambios

```bash
# En tu máquina local, después de hacer cambios:
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

**¡Eso es todo!** El workflow se ejecuta automáticamente y:

1. ✅ Ejecuta tests unitarios
2. ✅ Ejecuta tests E2E
3. ✅ Construye imágenes Docker
4. ✅ Sube imágenes a GHCR
5. ✅ Se conecta al runner en tu VM
6. ✅ Descarga las nuevas imágenes
7. ✅ Reinicia los servicios con las imágenes actualizadas

### Ver el Progreso

- **GitHub Actions**: `https://github.com/murias10/TeachingPlanner/actions`
- **Logs en la VM**:
  ```bash
  ssh usuario@ip_vm
  cd ~/TeachingPlanner
  docker compose logs -f
  ```

---

## 🐛 Resolución de Problemas

### ❌ El Runner No Aparece en GitHub

**Síntomas**: No ves el runner en Settings → Actions → Runners, o aparece con estado Offline 🔴

**Solución**:

```bash
# Conectar a la VM
ssh usuario@ip_vm

# Ir al directorio del runner
cd ~/actions-runner

# Verificar estado del servicio
sudo ./svc.sh status

# Si está detenido, iniciarlo
sudo ./svc.sh start

# Ver logs del runner
tail -f _diag/Runner_*.log

# Si hay errores, reiniciar completamente
sudo ./svc.sh stop
sudo ./svc.sh start
```

Si el problema persiste:

```bash
# Ver logs del sistema
sudo journalctl -u actions.runner.* -f

# Verificar permisos
ls -la ~/actions-runner
```

### ❌ Error: Permission Denied al Usar Docker

**Síntomas**:
```
permission denied while trying to connect to the Docker daemon socket
```

**Solución**:

```bash
# Verificar que estás en el grupo docker
groups $USER

# Si NO aparece "docker", agregarte:
sudo usermod -aG docker $USER

# IMPORTANTE: Cerrar sesión y reconectar
exit
ssh usuario@ip_vm

# Probar de nuevo
docker ps
```

### ❌ Workflow Falla en "Build and Push Images"

**Síntomas**: Error al construir o subir imágenes a GHCR

**Causas comunes**:

1. **Token GHCR inválido o expirado**

   Solución:
   ```bash
   # En la VM, verificar login
   docker logout ghcr.io

   # Login de nuevo con tu token
   echo "TU_TOKEN" | docker login ghcr.io -u murias10 --password-stdin
   ```

2. **Secret `GHCR_TOKEN` no configurado en GitHub**

   Solución:
   - Ve a Settings → Secrets and variables → Actions
   - Verifica que existe `GHCR_TOKEN`
   - Si no existe o expiró, créalo de nuevo

3. **Permisos insuficientes del token**

   Solución:
   - Genera un nuevo PAT con scopes: `read:packages`, `write:packages`, `repo`

### ❌ Servicios No Inician Correctamente

**Síntomas**: `docker compose ps` muestra servicios con estado "Exited" o "Restarting"

**Diagnóstico**:

```bash
cd ~/TeachingPlanner

# Ver logs del servicio problemático
docker compose logs webapp
docker compose logs planner_database
docker compose logs gateway

# Ver logs de todos los servicios
docker compose logs
```

**Causas comunes**:

1. **Variables de entorno incorrectas**

   ```bash
   # Verificar archivo .env
   cat .env

   # Comparar con la plantilla de esta guía
   # Verificar que no hay espacios extra, comillas incorrectas, etc.
   ```

2. **Base de datos no está lista**

   ```bash
   # Ver logs de la base de datos
   docker compose logs planner_database

   # Si la BD se está inicializando, esperar 1-2 minutos
   # Los servicios backend se reiniciarán automáticamente
   ```

3. **Puerto ya en uso**

   ```bash
   # Verificar puertos ocupados
   sudo lsof -i :80
   sudo lsof -i :3000

   # Si hay otro servicio usando el puerto, detenerlo
   sudo systemctl stop nginx  # Ejemplo
   ```

**Solución general**:

```bash
# Reiniciar todos los servicios
docker compose down
docker compose up -d

# Seguir logs en tiempo real
docker compose logs -f
```

### ❌ Error: No Space Left on Device

**Síntomas**:
```
Error: no space left on device
```

**Diagnóstico**:

```bash
# Ver espacio en disco
df -h

# Ver uso de Docker
docker system df
```

**Solución**:

```bash
# Limpiar imágenes y containers no usados
docker system prune -a -f

# Limpiar volúmenes (CUIDADO: puede borrar datos)
docker volume ls
docker volume prune -f

# Verificar espacio liberado
df -h
```

**Prevención**:

```bash
# Configurar limpieza automática semanal
# Crear script de limpieza
cat > ~/cleanup-docker.sh << 'EOF'
#!/bin/bash
docker system prune -a -f
docker volume prune -f
EOF

chmod +x ~/cleanup-docker.sh

# Programar con cron (ejecutar cada domingo a las 3am)
crontab -e
# Agregar línea:
# 0 3 * * 0 ~/cleanup-docker.sh >> ~/cleanup-docker.log 2>&1
```

### ❌ Base de Datos No Persiste Datos

**Síntomas**: Los datos se pierden al reiniciar los servicios

**Causa**: Los volúmenes de Docker no están configurados correctamente

**Solución**:

```bash
# Verificar volúmenes
docker volume ls

# Debe mostrar:
# teachingplanner_planner_db_data
# teachingplanner_management_db_data

# Si no existen, verificar docker-compose.yml
cd ~/TeachingPlanner
cat docker-compose.yml | grep -A 5 volumes

# Recrear servicios con volúmenes
docker compose down
docker compose up -d
```

### ❌ Error de Conexión entre Servicios

**Síntomas**: Los servicios no pueden comunicarse entre sí

**Diagnóstico**:

```bash
# Verificar que todos los servicios están en la misma red
docker network ls
docker network inspect teachingplanner_default

# Probar conectividad desde un container
docker exec -it gateway ping planner_database
docker exec -it webapp ping gateway
```

**Solución**:

```bash
# Recrear la red de Docker
docker compose down
docker network prune -f
docker compose up -d
```

### ❌ Workflow Falla en Tests

**Síntomas**: Los tests fallan en CI pero funcionan localmente

**Causas comunes**:

1. **Dependencias desactualizadas**

   ```bash
   # En tu máquina local
   cd backend
   npm install
   npm test

   # Si los tests pasan, hacer commit del package-lock.json actualizado
   git add package-lock.json
   git commit -m "chore: actualizar dependencias"
   git push
   ```

2. **Variables de entorno faltantes en CI**

   - Verificar que el workflow tiene todas las variables necesarias
   - Los tests E2E pueden necesitar configuración especial

3. **Tests flaky (inestables)**

   - Revisar los logs del workflow en GitHub Actions
   - Identificar qué test falla
   - Aumentar timeouts si es necesario

---

## 📝 Comandos Útiles para el Día a Día

### Gestión de Servicios Docker

```bash
# Ir al directorio de la aplicación
cd ~/TeachingPlanner

# Ver estado de todos los servicios
docker compose ps

# Ver logs en tiempo real (todos los servicios)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f webapp
docker compose logs -f gateway
docker compose logs -f planner_service

# Ver logs con timestamps
docker compose logs -f --timestamps

# Ver últimas 100 líneas de logs
docker compose logs --tail=100

# Reiniciar todos los servicios
docker compose restart

# Reiniciar un servicio específico
docker compose restart webapp

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker compose down -v

# Iniciar servicios
docker compose up -d

# Iniciar y seguir logs
docker compose up
```

### Gestión del Runner de GitHub

```bash
# Ver estado del runner
cd ~/actions-runner
sudo ./svc.sh status

# Reiniciar el runner
sudo ./svc.sh restart

# Detener el runner
sudo ./svc.sh stop

# Iniciar el runner
sudo ./svc.sh start

# Ver logs del runner
cat _diag/Runner_*.log

# Ver logs en tiempo real del servicio
sudo journalctl -u actions.runner.* -f

# Ver información del runner
cat .runner
```

### Mantenimiento y Monitoreo

```bash
# Ver uso de disco
df -h

# Ver uso detallado de un directorio
du -sh ~/TeachingPlanner/*

# Ver uso de espacio de Docker
docker system df

# Ver uso de recursos por container (CPU, RAM)
docker stats

# Ver procesos en cada container
docker compose top

# Inspeccionar un container específico
docker inspect webapp

# Ver variables de entorno de un container
docker exec webapp env

# Ejecutar comando en un container
docker exec -it webapp sh
docker exec -it planner_database mysql -u root -p
```

### Backups de Base de Datos

```bash
# Backup de la base de datos Planner
docker exec planner_database mysqldump -u root -p"$PLANNER_DATABASE_ROOT_PASSWORD" planner_db > backup_planner_$(date +%Y%m%d).sql

# Backup de la base de datos Management
docker exec management_database mysqldump -u root -p"$MANAGEMENT_DATABASE_ROOT_PASSWORD" management_db > backup_management_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i planner_database mysql -u root -p"$PLANNER_DATABASE_ROOT_PASSWORD" planner_db < backup_planner_20240315.sql
```

### Actualización del Sistema

```bash
# Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Actualizar Docker a la última versión
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Reiniciar Docker
sudo systemctl restart docker

# Verificar versiones
docker --version
docker compose version
```

---

## 🔐 Seguridad y Buenas Prácticas

### Protección de Credenciales

```bash
# Verificar permisos del archivo .env
ls -la ~/TeachingPlanner/.env
# Debe ser: -rw------- (600)

# Si no es así, corregir:
chmod 600 ~/TeachingPlanner/.env

# Nunca hagas commit del archivo .env
# Ya está en .gitignore, pero verifica:
cat .gitignore | grep .env
```

### Configuración de Firewall

Si la VM está expuesta a internet, configura un firewall:

```bash
# Instalar UFW (si no está instalado)
sudo apt install -y ufw

# Permitir SSH (IMPORTANTE: hazlo ANTES de habilitar el firewall)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS (si expones la app directamente)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ver reglas antes de habilitar
sudo ufw show added

# Habilitar firewall
sudo ufw enable

# Ver estado
sudo ufw status verbose
```

### Configurar HTTPS con Let's Encrypt (Opcional)

Si tienes un dominio público:

```bash
# Instalar Certbot
sudo apt install -y certbot

# Obtener certificado (detén los servicios primero)
docker compose down
sudo certbot certonly --standalone -d teachingplanner.uniovi.es

# Los certificados se guardan en:
# /etc/letsencrypt/live/teachingplanner.uniovi.es/

# Configurar renovación automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Actualizar docker-compose.yml para usar los certificados
```

### Rotación de Secretos

Cambia las contraseñas periódicamente:

```bash
# 1. Editar .env con nuevas contraseñas
nano ~/TeachingPlanner/.env

# 2. Recrear servicios
docker compose down
docker compose up -d

# 3. Verificar que todo funciona
docker compose ps
docker compose logs
```

### Monitoreo de Seguridad

```bash
# Ver intentos de login SSH fallidos
sudo grep "Failed password" /var/log/auth.log | tail -20

# Ver conexiones activas
sudo netstat -tuln

# Ver procesos escuchando en puertos
sudo lsof -i -P -n | grep LISTEN

# Actualizar sistema regularmente
sudo apt update && sudo apt list --upgradable
```

---

## 📊 Monitoreo y Logs

### Configurar Rotación de Logs

Los logs de Docker pueden crecer mucho. Configura rotación:

```bash
# Crear archivo de configuración de Docker daemon
sudo nano /etc/docker/daemon.json
```

Agrega:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Reinicia Docker:

```bash
sudo systemctl restart docker
docker compose up -d
```

### Ver Estadísticas de Uso

```bash
# Uso de CPU y RAM por container
docker stats --no-stream

# Uso de disco
docker system df -v

# Uso de red
docker network inspect teachingplanner_default | grep -A 20 Containers
```

---

## ✅ Checklist de Configuración Completa

Marca cada ítem cuando lo completes:

**Preparación de la VM**:
- [ ] Conexión VPN a la red de la Universidad
- [ ] Acceso SSH funcionando
- [ ] Sistema actualizado (`sudo apt update && upgrade`)
- [ ] Docker instalado y funcionando
- [ ] Usuario agregado al grupo docker
- [ ] `docker ps` funciona sin sudo

**Configuración del Runner**:
- [ ] Runner descargado e instalado
- [ ] Runner configurado con labels correctos
- [ ] Runner instalado como servicio (`sudo ./svc.sh status` → active)
- [ ] Runner aparece como **Idle** 🟢 en GitHub

**Configuración de la Aplicación**:
- [ ] Directorio `~/TeachingPlanner` creado
- [ ] Archivo `.env` creado y configurado
- [ ] Valores sensibles en `.env` actualizados (passwords, secrets, SMTP)
- [ ] Permisos de `.env` establecidos en `600`
- [ ] Personal Access Token (PAT) creado en GitHub
- [ ] Login en GHCR exitoso (`docker login ghcr.io`)
- [ ] Secret `GHCR_TOKEN` configurado en GitHub

**Deploy y Verificación**:
- [ ] Primer push a `main` realizado
- [ ] Workflow ejecutado exitosamente en GitHub Actions
- [ ] Todos los servicios corriendo (`docker compose ps` → todos "Up")
- [ ] Aplicación accesible desde navegador
- [ ] Logs de servicios sin errores críticos

**Seguridad** (Opcional pero recomendado):
- [ ] Firewall configurado (`ufw`)
- [ ] Rotación de logs configurada
- [ ] Backups de base de datos probados
- [ ] HTTPS configurado (si aplica)

---

## 🎯 Resumen Rápido

### Para Desplegar Cambios:

```bash
# En tu máquina local:
git add .
git commit -m "mensaje descriptivo"
git push origin main
```

### Para Verificar el Deploy:

```bash
# 1. En GitHub:
# https://github.com/murias10/TeachingPlanner/actions

# 2. En la VM:
ssh usuario@ip_vm
cd ~/TeachingPlanner
docker compose ps
docker compose logs -f
```

### Para Solucionar Problemas:

```bash
# En la VM:
cd ~/TeachingPlanner

# Ver logs
docker compose logs

# Reiniciar servicios
docker compose restart

# Ver estado del runner
cd ~/actions-runner && sudo ./svc.sh status
```

---

## 📞 Soporte y Recursos Adicionales

### Documentación Oficial

- **Docker**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **GitHub Actions**: https://docs.github.com/en/actions
- **Self-hosted Runners**: https://docs.github.com/en/actions/hosting-your-own-runners

### Comandos de Diagnóstico Completo

Si necesitas reportar un problema, ejecuta estos comandos y guarda la salida:

```bash
# Información del sistema
echo "=== SYSTEM INFO ===" > diagnostic.txt
uname -a >> diagnostic.txt
df -h >> diagnostic.txt
free -h >> diagnostic.txt

# Información de Docker
echo "=== DOCKER INFO ===" >> diagnostic.txt
docker --version >> diagnostic.txt
docker compose version >> diagnostic.txt
docker ps -a >> diagnostic.txt
docker system df >> diagnostic.txt

# Estado de servicios
echo "=== SERVICES STATUS ===" >> diagnostic.txt
cd ~/TeachingPlanner
docker compose ps >> diagnostic.txt
docker compose logs --tail=100 >> diagnostic.txt

# Estado del runner
echo "=== RUNNER STATUS ===" >> diagnostic.txt
cd ~/actions-runner
sudo ./svc.sh status >> diagnostic.txt
tail -50 _diag/Runner_*.log >> diagnostic.txt

# Ver el archivo generado
cat diagnostic.txt
```

---

## 🎓 Notas Específicas para la Universidad de Oviedo

### Acceso VPN

- **VPN Client**: GlobalProtect o el cliente proporcionado por la universidad
- **Configuración**: Contactar con el Centro de Servicios Informáticos (CSI)
- **Soporte VPN**: https://si.uniovi.es/vpn

### Red Interna

- La VM debe estar en la red interna de la universidad
- Verifica con el administrador de sistemas que los puertos necesarios están abiertos:
  - Puerto 80 (HTTP)
  - Puerto 443 (HTTPS, si se configura)
  - Puerto 22 (SSH)

### Consideraciones de Firewall Institucional

Si el firewall de la universidad bloquea algunas conexiones:

```bash
# Verificar conectividad a GitHub
ping github.com
curl -I https://github.com

# Verificar conectividad a GHCR
curl -I https://ghcr.io

# Si hay problemas, contactar con el CSI
```

---

¡Configuración completa! 🚀

Tu aplicación TeachingPlanner ahora se despliega automáticamente en tu VM de la Universidad de Oviedo cada vez que haces push a la rama `main`.
