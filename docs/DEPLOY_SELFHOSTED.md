# 🚀 Guía de Deploy con Self-Hosted GitHub Actions Runner

Esta guía describe cómo configurar un runner auto-hospedado de GitHub Actions en tu máquina virtual privada para automatizar el despliegue de TeachingPlanner.

---

## 📋 Requisitos Previos

- ✅ Máquina virtual con Ubuntu/Debian
- ✅ Acceso SSH a la VM
- ✅ Conexión VPN configurada (si la VM está en red privada)
- ✅ Permisos de administrador en el repositorio de GitHub

---

## ⚡ Paso 1: Preparar la Máquina Virtual

### 1.1. Conectarse a la VM

```bash
# Conectar VPN (si es necesario)
# Luego conectar por SSH
ssh tu_usuario@ip_de_la_vm
```

### 1.2. Instalar Dependencias

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose (si no está incluido)
sudo apt install docker-compose-plugin -y

# Cerrar sesión y reconectar para aplicar cambios de grupo
exit
```

Reconecta por SSH:
```bash
ssh tu_usuario@ip_de_la_vm
```

### 1.3. Verificar Instalación

```bash
# Verificar Docker
docker --version
docker compose version

# Probar Docker sin sudo
docker ps
```

---

## 🤖 Paso 2: Configurar Self-Hosted Runner

### 2.1. Obtener Token de GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/murias10/TeachingPlanner`
2. Navega a **Settings** → **Actions** → **Runners**
3. Click en **New self-hosted runner**
4. Selecciona **Linux** como sistema operativo
5. **NO CIERRES ESTA PÁGINA** - necesitarás los comandos

### 2.2. Instalar el Runner en la VM

Ejecuta en la VM (usa los comandos exactos de GitHub):

```bash
# Crear directorio para el runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Descargar el runner (copia el comando exacto de GitHub)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extraer el archivo
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configurar el runner (copia el comando exacto de GitHub con tu token)
./config.sh --url https://github.com/murias10/TeachingPlanner --token TU_TOKEN_AQUI
```

Durante la configuración responde:
- **Runner name**: Presiona `Enter` (acepta default) o escribe `vm-private-runner`
- **Runner group**: Presiona `Enter` (default)
- **Labels**: Escribe `self-hosted,vm-private` y presiona `Enter`
- **Work folder**: Presiona `Enter` (default)

### 2.3. Instalar como Servicio del Sistema

```bash
# Instalar como servicio
sudo ./svc.sh install

# Iniciar el servicio
sudo ./svc.sh start

# Verificar estado
sudo ./svc.sh status
```

Deberías ver: `Active: active (running)`

### 2.4. Verificar en GitHub

1. Vuelve a **Settings** → **Actions** → **Runners** en GitHub
2. Deberías ver tu runner con estado **Idle** 🟢
3. Si aparece el punto verde, está listo

---

## 📁 Paso 3: Configurar Directorio de la Aplicación

### 3.1. Crear Directorio y Archivo .env

```bash
# Crear directorio
mkdir -p ~/TeachingPlanner
cd ~/TeachingPlanner

# Crear archivo .env
nano .env
```

### 3.2. Configurar Variables de Entorno

Pega esta configuración en el archivo `.env` (ajusta los valores):

```env
# Dominio
DOMAIN=tu-dominio.com

# Webapp
WEBAPP_HOST=webapp
WEBAPP_PORT=80

# Gateway
GATEWAY_SERVICE_HOST=gateway
GATEWAY_SERVICE_PORT=3000

# Planner Service
PLANNER_SERVICE_HOST=planner_service
PLANNER_SERVICE_PORT=3001

# Auth Service
AUTH_SERVICE_HOST=auth_service
AUTH_SERVICE_PORT=3002

# User Service
USER_SERVICE_HOST=user_service
USER_SERVICE_PORT=3003

# Base de datos Planner
PLANNER_DATABASE_HOST=planner_database
PLANNER_DATABASE_PORT=3306
PLANNER_DATABASE_USER=planner_user
PLANNER_DATABASE_PASSWORD=TuPasswordSeguro123!
PLANNER_DATABASE_DATABASE=planner_db
PLANNER_DATABASE_ROOT_PASSWORD=TuRootPasswordSeguro123!

# Base de datos Management
MANAGEMENT_DATABASE_HOST=management_database
MANAGEMENT_DATABASE_PORT=3307
MANAGEMENT_DATABASE_USER=management_user
MANAGEMENT_DATABASE_PASSWORD=TuPasswordSeguro456!
MANAGEMENT_DATABASE_DATABASE=management_db
MANAGEMENT_DATABASE_ROOT_PASSWORD=TuRootPasswordSeguro456!

# JWT Secret (mínimo 32 caracteres)
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro_minimo_32_caracteres

# SMTP (Gmail ejemplo - usa App Password, no tu contraseña normal)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password_de_16_caracteres
SMTP_FROM=noreply@tu-dominio.com

# Frontend URL
FRONTEND_URL=https://tu-dominio.com
```

Guarda y cierra:
- Presiona `Ctrl+O` → `Enter` (guardar)
- Presiona `Ctrl+X` (salir)

### 3.3. Proteger el Archivo .env

```bash
# Establecer permisos restrictivos
chmod 600 .env

# Verificar
ls -la .env
# Debe mostrar: -rw------- (solo tu usuario puede leer/escribir)
```

---

## 🚀 Paso 4: Realizar el Primer Deploy

### 4.1. Commit y Push desde tu Máquina Local

```bash
# En tu máquina LOCAL (no en la VM)
cd /ruta/a/TeachingPlanner

# Añadir cambios
git add .

# Commit
git commit -m "feat: configurar self-hosted runner deployment"

# Push a main
git push origin main
```

### 4.2. Monitorear el Deploy

1. Ve a GitHub → **Actions**: `https://github.com/murias10/TeachingPlanner/actions`
2. Verás el workflow "Deploy to Self-Hosted VM" ejecutándose
3. Click en él para ver cada paso:
   - 🧪 Tests unitarios
   - 🧪 Tests E2E
   - 🏗️ Build y push de imágenes a GHCR
   - 🚀 Deploy en tu VM

### 4.3. Verificar Deploy en la VM

```bash
# Conecta a la VM
ssh tu_usuario@ip_vm

# Ve al directorio
cd ~/TeachingPlanner

# Verifica que los servicios están corriendo
docker compose ps

# Deberías ver todos los servicios como "Up"
# Ver logs
docker compose logs -f
```

---

## 🔄 Flujo de Deploy Continuo

### Deploys Futuros

Para cada cambio que quieras desplegar:

```bash
# En tu máquina LOCAL
git add .
git commit -m "descripción del cambio"
git push origin main
```

**¡Eso es todo!** El workflow se ejecuta automáticamente:
1. ✅ Ejecuta tests
2. ✅ Construye imágenes Docker
3. ✅ Sube imágenes a GitHub Container Registry
4. ✅ Se conecta al runner en tu VM
5. ✅ Descarga nuevas imágenes
6. ✅ Reinicia servicios

### Ver Progreso del Deploy

- GitHub → **Actions** → Click en el workflow más reciente
- Cada paso muestra logs detallados

---

## 🐛 Troubleshooting

### ❌ El Runner no aparece en GitHub

**Síntomas**: No ves el runner en Settings → Actions → Runners

```bash
# Verificar estado del servicio
cd ~/actions-runner
sudo ./svc.sh status

# Si no está corriendo, iniciarlo
sudo ./svc.sh start

# Ver logs para diagnóstico
cat _diag/Runner_*.log
```

### ❌ Error: Permission denied con Docker

**Síntomas**: `permission denied while trying to connect to the Docker daemon`

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Verificar que se agregó
groups $USER

# Cerrar sesión y reconectar
exit
ssh tu_usuario@ip_vm

# Probar Docker
docker ps
```

### ❌ El Workflow falla al descargar imágenes

**Síntomas**: Error en paso "Descargar últimas imágenes desde GHCR"

```bash
# En la VM, probar login manual a GHCR
echo "$GITHUB_TOKEN" | docker login ghcr.io -u murias10 --password-stdin

# Intentar pull manual de una imagen
docker pull ghcr.io/murias10/teachingplanner-webapp:latest

# Verificar que las imágenes existen en GitHub
# Ve a: https://github.com/murias10?tab=packages
```

### ❌ Servicios no inician correctamente

**Síntomas**: `docker compose ps` muestra servicios con estado "Exited" o "Restarting"

```bash
cd ~/TeachingPlanner

# Ver logs del servicio problemático
docker compose logs webapp
docker compose logs planner_database

# Verificar configuración del .env
cat .env

# Reiniciar servicios
docker compose down
docker compose up -d

# Seguir logs en tiempo real
docker compose logs -f
```

### ❌ Sin espacio en disco

**Síntomas**: Errores de "no space left on device"

```bash
# Verificar espacio
df -h

# Ver uso de Docker
docker system df

# Limpiar imágenes y containers antiguos
docker system prune -a -f

# Limpiar volúmenes no usados (cuidado: puede borrar datos)
docker volume prune -f
```

### ❌ Reiniciar completamente el runner

**Síntomas**: El runner tiene problemas persistentes

```bash
cd ~/actions-runner

# Detener y desinstalar
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Obtener nuevo token de GitHub
# Ve a Settings → Actions → Runners → New self-hosted runner

# Reconfigurar con el nuevo token
./config.sh --url https://github.com/murias10/TeachingPlanner --token NUEVO_TOKEN

# Reinstalar como servicio
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

---

## 📝 Comandos Útiles

### Gestión de Servicios Docker

```bash
cd ~/TeachingPlanner

# Ver estado de todos los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f webapp
docker compose logs -f gateway
docker compose logs -f auth_service

# Reiniciar todos los servicios
docker compose restart

# Reiniciar un servicio específico
docker compose restart webapp

# Detener todos los servicios
docker compose down

# Iniciar servicios
docker compose up -d
```

### Gestión del Runner

```bash
# Ver estado del runner
cd ~/actions-runner
sudo ./svc.sh status

# Reiniciar el runner
sudo ./svc.sh stop
sudo ./svc.sh start

# Ver logs del runner
cat _diag/Runner_*.log

# Ver logs del servicio del sistema
sudo journalctl -u actions.runner.* -f
```

### Mantenimiento

```bash
# Ver uso de disco
df -h

# Ver uso de espacio de Docker
docker system df

# Limpiar imágenes antiguas
docker image prune -f

# Limpieza completa (cuidado: elimina todo lo no usado)
docker system prune -a --volumes
```

---

## 🔐 Seguridad y Buenas Prácticas

### Proteger Credenciales

```bash
# Permisos restrictivos para .env
cd ~/TeachingPlanner
chmod 600 .env
ls -la .env  # Debe mostrar: -rw-------
```

### Configurar Firewall (Opcional)

```bash
# Permitir solo SSH
sudo ufw allow 22/tcp

# Si expones la aplicación directamente (sin proxy externo)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
sudo ufw status
```

### Mantener el Sistema Actualizado

```bash
# Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Verificar actualizaciones de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Limitar Acceso al Runner

- ✅ El runner solo ejecuta workflows de tu repositorio
- ✅ Revisa regularmente los logs en `~/actions-runner/_diag/`
- ✅ No compartas el token de configuración del runner
- ✅ Usa labels específicos (`self-hosted,vm-private`) para control

---

## ✅ Checklist de Configuración

Verifica que todo esté listo:

- [ ] Docker instalado y funcionando (`docker ps`)
- [ ] Usuario agregado al grupo docker (sin necesidad de `sudo`)
- [ ] Runner instalado y corriendo como servicio
- [ ] Runner aparece como **Idle** en GitHub
- [ ] Directorio `~/TeachingPlanner` creado
- [ ] Archivo `.env` configurado con valores correctos
- [ ] Permisos de `.env` establecidos en `600`
- [ ] Primer deploy ejecutado exitosamente
- [ ] Servicios corriendo (`docker compose ps` muestra todos "Up")
- [ ] Aplicación accesible desde el navegador

---

## 📞 Soporte y Diagnóstico

### Información del Sistema

```bash
# Versiones instaladas
docker --version
docker compose version

# Estado del runner
cd ~/actions-runner
sudo ./svc.sh status

# Recursos del sistema
df -h         # Espacio en disco
free -h       # Memoria RAM
docker stats  # Uso de recursos por container
```

### Verificar Configuración

```bash
# Variables de entorno
cd ~/TeachingPlanner
cat .env | grep -v PASSWORD  # Ver config sin mostrar passwords

# Estado de servicios
docker compose ps

# Logs recientes
docker compose logs --tail=50

# Verificar conectividad de base de datos
docker exec -it planner_database mysql -u root -p
```

---

## 🎯 Resumen

**Para deployar cambios**:
```bash
git add . && git commit -m "mensaje" && git push origin main
```

**Ver el deploy**: GitHub → Actions

**Verificar en la VM**:
```bash
ssh tu_usuario@ip_vm
cd ~/TeachingPlanner && docker compose ps
```

¡Eso es todo! Tu aplicación ahora se despliega automáticamente cada vez que haces push a `main`. 🚀
