# 5.1 Manual de Instalación

## Introducción

Este manual está dirigido a un perfil técnico con conocimientos básicos de terminal, Docker y administración de sistemas Linux. Su objetivo es proporcionar toda la información necesaria para reproducir la instalación de TeachingPlanner desde cero, tanto en un entorno local de desarrollo como en un servidor de producción.

La aplicación está compuesta por los siguientes elementos:

- **4 microservicios Node.js/Express** (autenticación, gestión de usuarios, planificación y gateway)
- **2 bases de datos MariaDB 10.6** (una para planificación y otra para gestión de usuarios)
- **1 aplicación web React 19** servida por el servidor web Caddy

Todos los componentes se orquestan mediante Docker Compose. En producción, las imágenes Docker se construyen automáticamente mediante GitHub Actions y se almacenan en GitHub Container Registry (GHCR).

El manual cubre tres escenarios de instalación:

1. **Entorno local de desarrollo**: Docker Compose para los microservicios y las bases de datos, con el servidor de desarrollo de Vite para la webapp.
2. **Despliegue en máquina virtual con acceso público**: imágenes de GHCR, integración continua y entrega continua (CI/CD) mediante GitHub Actions con acceso SSH al servidor.
3. **Despliegue en máquina virtual en red privada**: runner auto-hospedado de GitHub Actions instalado directamente en la VM, necesario cuando el servidor no es accesible desde internet.

---

## Arquitectura de la aplicación

```mermaid
flowchart TD
    Browser["Cliente (navegador)"]

    Browser -->|"HTTPS :443"| Webapp

    subgraph Webapp["webapp — Caddy"]
        W1["Sirve la SPA de React"]
        W2["Redirige /api/* al gateway_service"]
    end

    Webapp -->|"HTTP :8080"| Gateway

    subgraph Gateway["gateway_service"]
        G1["Enruta peticiones a los microservicios"]
    end

    Gateway --> Auth["auth_service\n:5003"]
    Gateway --> User["user_service\n:5002"]
    Gateway --> Planner["planner_service\n:5001"]

    Auth --> MgmtDB["management_database :3306\nMariaDB 10.6"]
    User --> MgmtDB
    Planner --> PlannerDB["planner_database :3306\nMariaDB 10.6"]
```

Los microservicios `auth_service` y `user_service` comparten la base de datos `management_database`. El microservicio `planner_service` utiliza de forma exclusiva `planner_database`.

---

## 5.1.1 Requisitos previos

### Para el entorno local de desarrollo

| Herramienta | Versión mínima | Propósito |
|---|---|---|
| Git | 2.x | Obtener el código fuente |
| Docker Engine | 24.x | Ejecutar los contenedores |
| Docker Compose Plugin | 2.20 | Orquestar los servicios |
| Node.js | 22 LTS | Ejecutar la webapp en modo desarrollo |
| npm | 10.x | Gestionar las dependencias de la webapp |

### Para el despliegue en máquina virtual

| Herramienta | Versión mínima | Propósito |
|---|---|---|
| Git | 2.x | Clonar el repositorio |
| Docker Engine | 24.x | Ejecutar los contenedores |
| Docker Compose Plugin | 2.20 | Orquestar los servicios |
| OpenSSL | cualquiera | Generar certificados SSL autofirmados |

Se recomienda Ubuntu 22.04 LTS (o superior) como sistema operativo del servidor. Los puertos 22 (SSH), 80 (HTTP) y 443 (HTTPS) deben estar accesibles.

---

## 5.1.2 Obtención del código fuente

```bash
git clone https://github.com/murias10/teachingplanner.git
cd TeachingPlanner
```

---

## 5.1.3 Entorno local de desarrollo

El flujo habitual de desarrollo combina Docker Compose para los microservicios y las bases de datos con el servidor de desarrollo de Vite para la webapp. Esta separación permite que los cambios en el código del frontend se reflejen instantáneamente en el navegador mediante hot-module replacement (HMR) sin necesidad de reconstruir ni reiniciar ningún contenedor. Si se modifica algún microservicio, sí es necesario reconstruir únicamente ese contenedor.

### Paso 1 — Configurar las variables de entorno

Copiar la plantilla y editar el fichero resultante:

```bash
cp .env.template .env
```

A continuación se describe cada variable de entorno. Todas ellas son leídas por los servicios en tiempo de ejecución a través de Docker Compose.

#### Base de datos de planificación (utilizada por `planner_service`)

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `PLANNER_DATABASE_ROOT_PASSWORD` | Contraseña del usuario `root` de MariaDB | `rootpassword` |
| `PLANNER_DATABASE_DATABASE` | Nombre de la base de datos que se creará | `planner_db` |
| `PLANNER_DATABASE_USER` | Usuario de la aplicación en MariaDB | `planner_user` |
| `PLANNER_DATABASE_PASSWORD` | Contraseña del usuario de la aplicación | `planner_password` |
| `PLANNER_DATABASE_PORT` | Puerto de escucha de MariaDB | `3306` |
| `PLANNER_DATABASE_HOST` | Nombre del contenedor (resuelto por DNS interno de Docker) | `planner_database` |

#### Base de datos de gestión (utilizada por `auth_service` y `user_service`)

| Variable | Descripción | Valor de ejemplo |
|---|---|---|
| `MANAGEMENT_DATABASE_ROOT_PASSWORD` | Contraseña del usuario `root` de MariaDB | `rootpassword` |
| `MANAGEMENT_DATABASE_DATABASE` | Nombre de la base de datos | `management_db` |
| `MANAGEMENT_DATABASE_USER` | Usuario de la aplicación | `management_user` |
| `MANAGEMENT_DATABASE_PASSWORD` | Contraseña del usuario | `management_password` |
| `MANAGEMENT_DATABASE_PORT` | Puerto de escucha | `3306` |
| `MANAGEMENT_DATABASE_HOST` | Nombre del contenedor | `management_database` |

#### Microservicios backend

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PLANNER_SERVICE_PORT` | Puerto en el que escucha el `planner_service` | `5001` |
| `PLANNER_SERVICE_HOST` | Nombre del contenedor | `planner_service` |
| `PLANNER_SERVICE_URL` | URL completa usada por el gateway para enrutar peticiones | `http://planner_service:5001` |
| `AUTH_SERVICE_PORT` | Puerto del `auth_service` | `5003` |
| `AUTH_SERVICE_HOST` | Nombre del contenedor | `auth_service` |
| `AUTH_SERVICE_URL` | URL completa | `http://auth_service:5003` |
| `USER_SERVICE_PORT` | Puerto del `user_service` | `5002` |
| `USER_SERVICE_HOST` | Nombre del contenedor | `user_service` |
| `USER_SERVICE_URL` | URL completa | `http://user_service:5002` |
| `GATEWAY_SERVICE_PORT` | Puerto del `gateway_service` | `8080` |
| `GATEWAY_SERVICE_HOST` | Nombre del contenedor | `gateway_service` |

#### Aplicación web

| Variable | Descripción | Valor |
|---|---|---|
| `WEBAPP_PORT` | Puerto externo expuesto por Caddy (HTTP) | `3000` |
| `WEBAPP_HOST` | Nombre del contenedor de la webapp | `webapp` |
| `DOMAIN` | Dominio que Caddy utiliza para servir la aplicación. Con `localhost` sirve en HTTP; con un dominio real activa HTTPS con el certificado montado | `localhost` en desarrollo |
| `FRONTEND_URL` | URL base del frontend, usada por `user_service` para construir los enlaces de los correos de activación y recuperación de contraseña | `http://localhost:5173` en desarrollo |

#### Seguridad y autenticación

| Variable | Descripción | Cómo generarla |
|---|---|---|
| `JWT_SECRET` | Clave secreta para firmar y verificar los tokens JWT. Mínimo 32 caracteres | `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | Clave de 32 bytes en hexadecimal para cifrar los tokens de Google OAuth almacenados en la base de datos | `openssl rand -hex 32` |

#### Correo electrónico (SMTP)

La funcionalidad de envío de correos (activación de cuentas y recuperación de contraseña) requiere configurar un servidor SMTP.

| Variable | Descripción | Ejemplo para Gmail |
|---|---|---|
| `SMTP_HOST` | Dirección del servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto del servidor SMTP | `587` |
| `SMTP_USER` | Dirección de correo electrónico | `tu_email@gmail.com` |
| `SMTP_PASS` | Contraseña del servidor SMTP | contraseña de aplicación de 16 caracteres |
| `SMTP_FROM` | Dirección que aparece como remitente en los correos | `noreply@tudominio.com` |

> **Nota sobre Gmail**: para usar Gmail como servidor SMTP es obligatorio utilizar una **contraseña de aplicación** (App Password) de 16 caracteres, no la contraseña normal de la cuenta de Google. Se genera en: Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicación.

#### Expiración de tokens de recuperación de contraseña

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PASSWORD_RESET_TOKEN_EXPIRY` | Tiempo de validez del token de recuperación, en milisegundos | `1800000` (30 minutos) |
| `PASSWORD_RESET_OTP_EXPIRY` | Tiempo de validez del código OTP, en milisegundos | `900000` (15 minutos) |
| `PASSWORD_RESET_OTP_COOLDOWN` | Tiempo mínimo de espera entre solicitudes de OTP, en milisegundos | `60000` (1 minuto) |

#### Integración con Google Calendar (opcional)

La integración con Google Calendar es una funcionalidad opcional que permite exportar manualmente las planificaciones al calendario del usuario. La sincronización se lanza desde la interfaz de administración y no existe ningún proceso automático en segundo plano.

| Variable | Descripción |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID del proyecto creado en Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret del proyecto |
| `GOOGLE_REDIRECT_URI` | URI de callback OAuth registrada en Google Cloud Console (ej. `https://<dominio>/api/auth/google/callback`) |

Para configurar Google OAuth desde cero es necesario:
1. Crear un proyecto en [console.cloud.google.com](https://console.cloud.google.com)
2. Habilitar la Google Calendar API
3. Configurar la pantalla de consentimiento OAuth (tipo "Externo")
4. Crear credenciales de tipo "ID de cliente OAuth" para aplicación web
5. Registrar los orígenes de JavaScript autorizados y las URIs de redirección para cada entorno (desarrollo y producción)
6. Copiar el Client ID y el Client Secret al fichero `.env`

### Paso 2 — Levantar el backend y las bases de datos con Docker

El siguiente comando construye las imágenes de los microservicios desde el código fuente local y arranca todos los contenedores del backend en segundo plano:

```bash
docker-compose -f docker-compose.dev.yml up --build -d \
  planner_database management_database \
  auth_service user_service planner_service gateway_service
```

Este comando realiza las siguientes acciones:
- Construye las imágenes de los 4 microservicios a partir del código fuente
- Arranca las dos instancias de MariaDB 10.6
- Arranca los 4 microservicios Node.js
- Los esquemas de base de datos se crean automáticamente mediante TypeORM (`synchronize: true`); no es necesario ejecutar ningún script de migración manualmente
- Los usuarios iniciales del sistema se insertan desde `auth_service/init-data.sql` en el primer arranque

Los servicios tienen configurados **healthchecks**: los microservicios esperan a que las bases de datos estén disponibles antes de intentar conectarse. Para comprobar que todos los contenedores están activos:

```bash
docker-compose -f docker-compose.dev.yml ps
```

Si se realiza un cambio en el código de algún microservicio, basta con reconstruir únicamente ese contenedor, sin afectar al resto:

```bash
# Ejemplo: reconstruir y reiniciar solo el auth_service
docker-compose -f docker-compose.dev.yml up --build -d auth_service
```

### Paso 3 — Instalar dependencias de la webapp

```bash
cd webapp
npm install
```

El fichero `webapp/.env.development` ya contiene la variable necesaria para que Vite se comunique con el gateway:

```
VITE_GATEWAY_API_URL=http://localhost:8080/api
```

Este fichero está incluido en el repositorio y apunta al puerto 8080, donde Docker Compose expone el `gateway_service`. No es necesario modificarlo para el desarrollo local.

### Paso 4 — Arrancar el servidor de desarrollo de la webapp

```bash
npm run dev
```

Vite arranca en `http://localhost:5173`. Cualquier cambio guardado en el código del frontend se aplica automáticamente en el navegador sin necesidad de reiniciar ningún proceso.

### Acceso y usuarios iniciales

Abrir el navegador en: `http://localhost:5173`

Los usuarios iniciales están definidos en `auth_service/init-data.sql` y se insertan automáticamente en el primer arranque de las bases de datos:

| Identificador | Nombre | Rol | Correo electrónico | Contraseña inicial |
|---|---|---|---|---|
| `uo290009` | Diego Murias Suárez | Administrador | uo290009@uniovi.es | `123456` |
| `jrpp` | Juan Ramón Perez | Administrador | jrpp@uniovi.es | `123456` |
| `falvarez` | Fernando Álvarez García | Administrador | falvarez@uniovi.es | `123456` |
| `teacher` | Diego Murias Suárez | Profesor | teacher@uniovi.es | `123456` |

Se recomienda cambiar las contraseñas iniciales tras el primer inicio de sesión.

---

## 5.1.4 Despliegue en máquina virtual con acceso público

Esta modalidad es válida para cualquier VM accesible desde internet (Azure, AWS, VPS, etc.). La pipeline de GitHub Actions conecta al servidor mediante SSH, descarga las imágenes pre-construidas de GitHub Container Registry (GHCR) y las pone en marcha con Docker Compose.

### Paso 1 — Preparar la máquina virtual

Conectarse al servidor por SSH y ejecutar los siguientes comandos:

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git

# Instalar Docker Engine y el plugin de Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Añadir el usuario al grupo docker para evitar tener que usar sudo
sudo usermod -aG docker $USER

# Cerrar sesión y volver a conectar para que el cambio de grupo surta efecto
exit
```

Tras reconectar, verificar la instalación:

```bash
docker --version
docker compose version
docker ps   # No debe mostrar error de permisos
```

Configurar el firewall (si no está habilitado):

```bash
sudo ufw allow 22/tcp    # SSH — añadir ANTES de habilitar el firewall
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status verbose
```

### Paso 2 — Clonar el repositorio y configurar el entorno

```bash
git clone https://github.com/murias10/teachingplanner.git ~/TeachingPlanner
cd ~/TeachingPlanner
cp .env.template .env
chmod 600 .env   # Restringir el acceso: solo el propietario puede leer y escribir
nano .env
```

Variables que deben ajustarse respecto a los valores del template para un entorno de producción:

| Variable | Valor recomendado para producción |
|---|---|
| `DOMAIN` | Dominio o IP del servidor (ej. `mi-app.azure.com` o la IP pública) |
| `FRONTEND_URL` | `https://<dominio>` |
| `GOOGLE_REDIRECT_URI` | `https://<dominio>/api/auth/google/callback` |
| `JWT_SECRET` | Generado con `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | Generado con `openssl rand -hex 32` |
| `PLANNER_DATABASE_PASSWORD` | Contraseña segura, distinta al valor del template |
| `MANAGEMENT_DATABASE_PASSWORD` | Contraseña segura, distinta al valor del template |
| `PLANNER_DATABASE_ROOT_PASSWORD` | Contraseña segura, distinta al valor del template |
| `MANAGEMENT_DATABASE_ROOT_PASSWORD` | Contraseña segura, distinta al valor del template |

Proteger el fichero `.env` es importante porque contiene credenciales sensibles. El fichero está incluido en `.gitignore` y no debe añadirse nunca al control de versiones.

### Paso 3 — Generar el certificado SSL

Caddy utiliza los ficheros `cert.pem` y `key.pem` para servir la aplicación con HTTPS. En este escenario se genera un certificado autofirmado con OpenSSL.

> **Nota**: un certificado autofirmado no está emitido por una entidad de certificación reconocida, por lo que el navegador mostrará un aviso de seguridad ("Tu conexión no es privada") la primera vez que se acceda a la aplicación. Este comportamiento es esperable y puede ignorarse en entornos de uso interno o de prueba. El aviso desaparece al instalar un certificado emitido por una entidad de confianza.

```bash
mkdir -p ~/TeachingPlanner/certs
cd ~/TeachingPlanner/certs

# Generar el certificado autofirmado válido durante 365 días.
# El campo Subject Alternative Name (SAN) permite que el certificado sea
# válido tanto para el dominio como para la IP del servidor.
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/C=ES/ST=Asturias/L=Oviedo/O=TeachingPlanner/CN=<DOMINIO_O_IP>" \
  -addext "subjectAltName=DNS:<DOMINIO>,DNS:localhost,IP:<IP_DEL_SERVIDOR>,IP:127.0.0.1"

# Establecer permisos seguros
chmod 600 key.pem
chmod 644 cert.pem

# Verificar que el certificado incluye los SAN definidos
openssl x509 -in cert.pem -text -noout | grep -A 3 "Subject Alternative Name"
```

Sustituir `<DOMINIO_O_IP>`, `<DOMINIO>` e `<IP_DEL_SERVIDOR>` por los valores reales del servidor. Si la aplicación solo se va a servir por IP (sin dominio), omitir los campos `DNS:` del SAN.

El fichero `docker-compose.azure.yml` monta el directorio de certificados como volumen de solo lectura en el contenedor de Caddy (`~/TeachingPlanner/certs:/etc/caddy/certs:ro`). Caddy lee los certificados desde las rutas `/certs/cert.pem` y `/certs/key.pem`, tal como se indica en `webapp/Caddyfile`:

```
{$DOMAIN:localhost} {
    tls /certs/cert.pem /certs/key.pem
    ...
}
```

La variable de entorno `DOMAIN` controla el comportamiento de Caddy: si su valor es `localhost`, sirve la aplicación en HTTP sin SSL; si es un dominio o IP real, activa HTTPS con el certificado indicado.

### Paso 4 — Configurar los secretos en GitHub

Los certificados se almacenan como secretos del repositorio en GitHub. En cada ejecución del workflow de despliegue, los certificados se escriben automáticamente en el servidor. Esto permite renovar certificados sin necesidad de conexión SSH manual.

Pasos para crear los secretos:
1. Ir al repositorio en GitHub → Settings → Secrets and variables → Actions
2. Crear los siguientes secretos:

| Nombre del secreto | Contenido |
|---|---|
| `SSL_CERT` | Contenido completo del fichero `cert.pem`, incluyendo las líneas `-----BEGIN CERTIFICATE-----` y `-----END CERTIFICATE-----` |
| `SSL_KEY` | Contenido completo del fichero `key.pem`, incluyendo las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----` |
| `AZURE_SSH_PRIVATE_KEY` | Clave privada SSH que permite al runner conectarse al servidor |
| `AZURE_VM_IP` | Dirección IP del servidor |
| `AZURE_VM_USER` | Nombre de usuario SSH (por ejemplo, `ubuntu` o `azureuser`) |

### Paso 5 — Ejecutar el despliegue

El workflow `.github/workflows/deploy_azure.yml` se activa manualmente desde la interfaz de GitHub:

1. Ir al repositorio en GitHub → Actions → seleccionar el workflow "Deploy to Azure"
2. Clic en "Run workflow" → "Run workflow"

El workflow ejecuta las siguientes etapas de forma secuencial:

1. **Tests unitarios**: ejecutados en un runner estándar de GitHub (`ubuntu-latest`)
2. **Tests E2E**: ejecutados en un runner estándar de GitHub
3. **Build y push de imágenes**: construye las 7 imágenes Docker y las publica en GHCR bajo `ghcr.io/murias10/teachingplanner/<servicio>:latest`
4. **Despliegue**: conecta al servidor por SSH y ejecuta:
   - Escribe los certificados SSL desde los secretos al directorio `~/TeachingPlanner/certs/`
   - `docker compose down --rmi all` (detiene y elimina los contenedores e imágenes existentes)
   - `docker compose up -d --pull always --force-recreate` (descarga las nuevas imágenes y arranca los contenedores)

La duración estimada del proceso completo es de entre 7 y 12 minutos.

### Paso 6 — Verificar el despliegue

```bash
cd ~/TeachingPlanner

# Comprobar el estado de todos los contenedores
docker compose ps

# Ver los logs en tiempo real
docker compose logs -f

# Comprobar que la aplicación responde
curl -k https://<IP_O_DOMINIO>
```

Todos los servicios deben aparecer con estado `Up`. Acceder desde el navegador a `https://<IP_O_DOMINIO>`. Si el certificado es autofirmado, el navegador mostrará un aviso; aceptarlo para continuar.

---

## 5.1.5 Despliegue en máquina virtual en red privada (self-hosted)

### Por qué es necesario un runner auto-hospedado

Cuando la VM de producción se encuentra dentro de una red privada —como la red interna de la Universidad de Oviedo—, no es accesible desde internet. Un runner estándar de GitHub Actions no puede conectarse al servidor por SSH, porque la VM solo es alcanzable a través de la VPN de la universidad.

La solución consiste en instalar un **GitHub Actions runner auto-hospedado** directamente en la VM de producción. El runner, una vez instalado, se mantiene a la escucha de trabajos en GitHub y los ejecuta localmente, sin necesidad de ninguna conexión entrante desde el exterior.

La pipeline de CI/CD queda dividida en dos partes:

- **Tests y build de imágenes** (`ubuntu-latest`): se ejecutan en runners estándar de GitHub, que sí tienen acceso a internet y pueden publicar las imágenes en GHCR.
- **Despliegue** (`self-hosted`): se ejecuta en el runner instalado en la VM, que descarga las imágenes de GHCR y levanta los contenedores.

```mermaid
flowchart TD
    Push["git push origin main"]

    Push --> StdRunner

    subgraph StdRunner["ubuntu-latest runner"]
        T1["1. Tests unitarios"]
        T2["2. Tests E2E"]
        T3["3. Build y push de imágenes a GHCR"]
        T1 --> T2 --> T3
    end

    StdRunner -->|"Desencadena job 'deploy'"| SelfRunner

    subgraph SelfRunner["Self-hosted runner — dentro de la VPN"]
        D1["4. Escribe certificados SSL"]
        D2["5. docker compose pull"]
        D3["6. docker compose up -d"]
        D1 --> D2 --> D3
    end
```

### Paso 1 — Preparar la máquina virtual

El proceso de preparación es idéntico al descrito en la sección anterior: instalar Ubuntu 22.04+, Docker Engine y configurar el firewall. Véase el **Paso 1** de la sección 5.1.4.

### Paso 2 — Instalar el GitHub Actions runner auto-hospedado

#### 2.1 Obtener el token de registro

1. Ir al repositorio en GitHub → Settings → Actions → Runners → New self-hosted runner
2. Seleccionar **Linux** como sistema operativo y **x64** como arquitectura
3. Mantener la página abierta: los comandos de instalación se generan con un token único de un solo uso que expira a los pocos minutos

#### 2.2 Instalar el runner en la VM

Conectarse a la VM por SSH (desde una máquina con acceso a la VPN de la universidad) y ejecutar:

```bash
# Crear el directorio para el runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Descargar el runner (usar el comando exacto que aparece en la página de GitHub,
# ya que la versión puede variar)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extraer el archivo
tar xzf ./actions-runner-linux-x64-*.tar.gz
```

#### 2.3 Configurar el runner

```bash
# Ejecutar el script de configuración (usar el comando exacto de la página de GitHub)
./config.sh --url https://github.com/murias10/TeachingPlanner --token <TOKEN_DE_GITHUB>
```

El asistente de configuración hace las siguientes preguntas:

| Pregunta | Respuesta recomendada |
|---|---|
| Enter the name of the runner | Presionar Enter (nombre por defecto) |
| Enter the name of runner group | Presionar Enter (grupo por defecto) |
| Enter labels for this runner | `self-hosted,linux` |
| Enter name of work folder | Presionar Enter (directorio `_work`) |

#### 2.4 Instalar el runner como servicio del sistema

Para que el runner se inicie automáticamente cada vez que la VM se reinicie:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

La salida esperada incluye la línea `Active: active (running)`.

#### 2.5 Verificar en GitHub

Volver a GitHub → Settings → Actions → Runners. El runner debe aparecer listado con estado **Idle** (indicador verde). Si aparece como **Offline**, consultar los logs de diagnóstico:

```bash
cd ~/actions-runner
cat _diag/Runner_*.log
```

### Paso 3 — Configurar el entorno de la aplicación

```bash
mkdir -p ~/TeachingPlanner
cd ~/TeachingPlanner
# Copiar la plantilla desde el repositorio clonado (si está disponible) o crearla manualmente
cp .env.template .env
chmod 600 .env
nano .env
```

Además de las variables comunes de producción descritas en la sección 5.1.4, ajustar las siguientes para el entorno self-hosted con dominio de la universidad:

| Variable | Valor |
|---|---|
| `DOMAIN` | Dominio asignado (ej. `planificador.ingenieriainformatica.uniovi.es`) |
| `FRONTEND_URL` | `https://planificador.ingenieriainformatica.uniovi.es` |
| `GOOGLE_REDIRECT_URI` | `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback` |

### Paso 4 — Configurar los certificados SSL

#### Fase inicial: certificado autofirmado

Si en la fase inicial no se dispone de certificados emitidos por una entidad reconocida, se genera un certificado autofirmado. Este es el procedimiento que se utilizó durante el despliegue inicial en la máquina virtual de la Universidad de Oviedo antes de contar con los certificados oficiales.

```bash
mkdir -p ~/TeachingPlanner/certs
cd ~/TeachingPlanner/certs

openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout key.pem -out cert.pem \
  -subj "/C=ES/ST=Asturias/L=Oviedo/O=Universidad de Oviedo/CN=<IP_O_DOMINIO>" \
  -addext "subjectAltName=DNS:<DOMINIO>,DNS:localhost,IP:<IP_DE_LA_VM>,IP:127.0.0.1"

chmod 600 key.pem
chmod 644 cert.pem

# Verificar los Subject Alternative Names del certificado
openssl x509 -in cert.pem -text -noout | grep -A 3 "Subject Alternative Name"
```

#### Fase con certificados oficiales

Una vez que la universidad proporciona los certificados oficiales (en este proyecto, certificados GEANT TLS para el dominio `*.ingenieriainformatica.uniovi.es`), se sustituyen los ficheros autofirmados:

```bash
# Copiar los certificados oficiales al directorio de la aplicación
cp /ruta/al/certificado_oficial.pem ~/TeachingPlanner/certs/cert.pem
cp /ruta/a/la/clave_oficial.pem ~/TeachingPlanner/certs/key.pem
chmod 644 ~/TeachingPlanner/certs/cert.pem
chmod 600 ~/TeachingPlanner/certs/key.pem
```

El fichero `docker-compose.selfhosted.yml` monta el directorio de certificados como volumen de solo lectura en el contenedor de Caddy:

```yaml
volumes:
  - $HOME/TeachingPlanner/certs:/certs:ro
```

Caddy lee los certificados desde estas rutas, tal como se indica en `webapp/Caddyfile`:

```
{$DOMAIN:localhost} {
    tls /certs/cert.pem /certs/key.pem
    ...
}
```

### Paso 5 — Configurar el acceso a GitHub Container Registry

El runner auto-hospedado necesita autenticarse en GHCR para descargar las imágenes durante el despliegue.

#### 5.1 Crear un Personal Access Token (PAT) en GitHub

1. Ir a GitHub (perfil personal) → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clic en "Generate new token (classic)"
3. Configurar el token:
   - **Note**: `TeachingPlanner VM Runner`
   - **Expiration**: según la política del equipo
   - **Scopes**: marcar `read:packages`, `write:packages` y `repo`
4. Copiar el token inmediatamente; solo se muestra una vez

#### 5.2 Autenticarse en GHCR desde la VM

```bash
echo "<PERSONAL_ACCESS_TOKEN>" | docker login ghcr.io -u <usuario_github> --password-stdin
# Salida esperada: Login Succeeded
```

Las credenciales quedan almacenadas en `~/.docker/config.json` y el runner las utilizará en cada despliegue.

### Paso 6 — Subir los certificados como secretos de GitHub

Los certificados deben estar disponibles en GitHub Secrets. En cada ejecución del workflow, el runner los escribe en `~/TeachingPlanner/certs/` antes de arrancar los contenedores. Esto permite renovar los certificados simplemente actualizando los secretos, sin necesidad de conectarse manualmente al servidor.

Pasos para crear los secretos:
1. Ir al repositorio → Settings → Secrets and variables → Actions
2. Crear los secretos `SSL_CERT` y `SSL_KEY` con el contenido completo de los ficheros `cert.pem` y `key.pem` respectivamente

### Paso 7 — Disparar el primer despliegue

El workflow `.github/workflows/deploy_selfhosted.yml` se activa automáticamente en cada push a la rama `main`:

```bash
# Desde la máquina de desarrollo local
git add .
git commit -m "chore: configurar despliegue self-hosted"
git push origin main
```

El workflow realiza las siguientes etapas:

| Etapa | Runner | Descripción |
|---|---|---|
| Tests unitarios | `ubuntu-latest` | Ejecuta los tests de los microservicios |
| Tests E2E | `ubuntu-latest` | Ejecuta los tests de extremo a extremo de la webapp |
| Build y push de imágenes | `ubuntu-latest` | Construye y publica las 7 imágenes en GHCR |
| Despliegue | `self-hosted` | Escribe certificados, descarga imágenes y levanta contenedores |

La duración estimada es de entre 7 y 12 minutos. El primer despliegue puede tardar más, ya que las imágenes de base deben descargarse.

### Paso 8 — Monitorear y verificar el despliegue

El progreso del workflow puede seguirse en tiempo real en GitHub → Actions → seleccionar la ejecución en curso.

Para verificar el estado desde la VM (conectarse por SSH desde dentro de la VPN):

```bash
cd ~/TeachingPlanner

# Estado de todos los contenedores
docker compose ps

# Logs en tiempo real (todos los servicios)
docker compose logs -f

# Logs de un servicio concreto
docker compose logs -f gateway_service
```

Todos los servicios deben aparecer con estado `Up`. Acceder desde el navegador (con la VPN activa):

```
https://planificador.ingenieriainformatica.uniovi.es
```

---

## 5.1.6 Operaciones de mantenimiento habituales

### Gestión de contenedores

Los siguientes comandos son útiles para el mantenimiento diario de la aplicación en producción. Deben ejecutarse desde el directorio `~/TeachingPlanner` donde se encuentra el fichero `docker-compose.yml` (o el fichero de compose correspondiente al entorno).

```bash
# Ver el estado de todos los contenedores
docker compose ps

# Ver los logs en tiempo real (todos los servicios)
docker compose logs -f

# Ver los logs de un servicio concreto
docker compose logs -f gateway_service

# Ver los logs con marcas de tiempo
docker compose logs -f --timestamps

# Ver las últimas 100 líneas de logs de todos los servicios
docker compose logs --tail=100

# Reiniciar un servicio concreto
docker compose restart webapp

# Reiniciar todos los servicios
docker compose restart

# Detener todos los servicios
docker compose down

# Arrancar todos los servicios
docker compose up -d

# Ver el uso de recursos (CPU, RAM) de cada contenedor en tiempo real
docker stats
```

### Copia de seguridad de las bases de datos

```bash
# Copia de seguridad de la base de datos de planificación
docker exec planner_database mysqldump \
  -u root -p"${PLANNER_DATABASE_ROOT_PASSWORD}" planner_db \
  > backup_planner_$(date +%Y%m%d).sql

# Copia de seguridad de la base de datos de gestión
docker exec management_database mysqldump \
  -u root -p"${MANAGEMENT_DATABASE_ROOT_PASSWORD}" management_db \
  > backup_management_$(date +%Y%m%d).sql

# Restaurar una copia de seguridad
docker exec -i planner_database mysql \
  -u root -p"${PLANNER_DATABASE_ROOT_PASSWORD}" planner_db \
  < backup_planner_20240315.sql
```

### Gestión del runner auto-hospedado

```bash
cd ~/actions-runner

# Ver el estado del servicio
sudo ./svc.sh status

# Iniciar el servicio
sudo ./svc.sh start

# Detener el servicio
sudo ./svc.sh stop

# Reiniciar el servicio
sudo ./svc.sh restart

# Ver los logs de diagnóstico del runner
cat _diag/Runner_*.log

# Ver los logs del servicio systemd en tiempo real
sudo journalctl -u actions.runner.* -f
```

---

## 5.1.7 Solución de problemas frecuentes

### Los microservicios no arrancan o muestran estado "Restarting"

Las bases de datos tienen healthchecks configurados; los microservicios esperan a que estén disponibles antes de intentar establecer la conexión. Si un servicio muestra un estado inestable inmediatamente después del primer arranque, puede deberse a que la base de datos aún está inicializándose:

```bash
# Ver los logs de las bases de datos para confirmar que están listas
docker compose logs planner_database
docker compose logs management_database
```

Si la base de datos indica que está inicializándose, esperar 1-2 minutos. Los microservicios implementan un mecanismo de reintento con espera exponencial (hasta 10 intentos) antes de terminar con error.

Si el problema persiste, verificar que las variables `*_HOST`, `*_USER` y `*_PASSWORD` del `.env` coinciden exactamente con los valores usados en el fichero de Docker Compose.

### Error de permisos al ejecutar Docker

```
permission denied while trying to connect to the Docker daemon socket
```

```bash
# Verificar si el usuario pertenece al grupo docker
groups $USER

# Si "docker" no aparece en la lista:
sudo usermod -aG docker $USER
exit
# Reconectar por SSH para que el cambio surta efecto
```

### El runner auto-hospedado aparece Offline en GitHub

```bash
cd ~/actions-runner

# Ver el estado del servicio del runner
sudo ./svc.sh status

# Si el servicio está detenido, iniciarlo
sudo ./svc.sh start

# Revisar los logs para identificar la causa del error
cat _diag/Runner_*.log

# Si el error persiste, ver el log del servicio systemd
sudo journalctl -u actions.runner.* -f
```

### El navegador muestra "Tu conexión no es privada"

Este aviso es el comportamiento esperado cuando se utiliza un certificado autofirmado. El certificado no está emitido por una entidad de certificación reconocida públicamente, por lo que el navegador no puede verificar su autenticidad.

Para continuar: en Chrome/Edge, clic en "Configuración avanzada" → "Continuar a `<dirección>`"; en Firefox, clic en "Avanzado" → "Aceptar riesgo y continuar".

Este aviso desaparece cuando se instala un certificado emitido por una entidad de certificación reconocida, como los certificados GEANT TLS de la universidad.

### Error CORS al acceder desde el navegador

El `gateway_service` valida la cabecera `Origin` de las peticiones entrantes. Si se accede desde un dominio o IP que no está en la lista blanca del servicio, las peticiones serán rechazadas con un error CORS.

Verificar que las variables `DOMAIN` y/o `SERVER_IP` del fichero `.env` coinciden con el origen desde el que se accede a la aplicación. Tras modificar el `.env`, es necesario recrear los contenedores:

```bash
docker compose up -d --force-recreate gateway_service
```

### Los correos electrónicos usan `localhost` en lugar del dominio de producción

El `user_service` construye los enlaces de activación y recuperación de contraseña usando la variable de entorno `FRONTEND_URL`. Si esta variable contiene `localhost`, los correos enviados en producción tendrán enlaces incorrectos.

```bash
# Verificar el valor actual de la variable dentro del contenedor
docker exec user_service printenv FRONTEND_URL

# Si el valor es incorrecto, actualizar .env y recrear el contenedor
docker compose up -d --force-recreate user_service
```

### Google OAuth: error "redirect_uri_mismatch"

Este error indica que la URI de callback configurada en el `.env` (`GOOGLE_REDIRECT_URI`) no está registrada en Google Cloud Console, o que los cambios aún no se han propagado.

1. Ir a Google Cloud Console → APIs y servicios → Credenciales → seleccionar el cliente OAuth
2. En "URIs de redirección autorizados", verificar que la URI exacta está registrada (ej. `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback`)
3. Si no está, añadirla y guardar
4. Esperar entre 2 y 5 minutos para que los cambios se propaguen e intentar de nuevo

### Espacio en disco insuficiente

```bash
# Ver el uso de disco del sistema
df -h

# Ver el uso de disco de los recursos de Docker
docker system df

# Eliminar imágenes, contenedores y capas no usadas
docker system prune -a -f

# Verificar el espacio liberado
df -h
```

---

## 5.1.8 Discrepancias conocidas pendientes de corrección

Esta sección recoge las divergencias identificadas entre la configuración actual del proyecto y la documentación o el comportamiento esperado. Sirven de registro para futuras tareas de mejora.

### 1. Variable `REPOSITORY_NAME` no documentada

Los workflows `deploy_azure.yml` y `deploy_selfhosted.yml` utilizan la variable de Actions `vars.REPOSITORY_NAME` para construir los nombres de las imágenes en GHCR:

```yaml
tags: ghcr.io/${{ vars.REPOSITORY_NAME }}/webapp:latest
```

Esta variable debe crearse en el repositorio de GitHub como **variable de Actions** (no secreto): Settings → Secrets and variables → Actions → Variables → New repository variable. Su valor debe ser `murias10/teachingplanner`. Sin ella, el paso de build de imágenes falla con un nombre de imagen vacío.

### 2. Variable `SERVER_IP` no documentada en la tabla de variables

El `gateway_service` incluye `SERVER_IP` en su lista blanca de CORS. Cuando la aplicación se accede directamente por la IP del servidor (sin dominio), esta variable debe estar definida en el `.env` para que las peticiones del navegador no sean rechazadas.

### 3. Credenciales de las bases de datos hardcodeadas en `docker-compose.dev.yml`

El fichero `docker-compose.dev.yml` inicializa ambas instancias de MariaDB con credenciales fijas (`planner_user`/`planner_password` y `management_user`/`management_password`), en lugar de leer los valores del `.env`. TypeORM, por su parte, sí utiliza las variables del `.env` para conectarse. Como resultado, los valores del `.env` deben coincidir exactamente con los del compose para que la conexión funcione. La solución pendiente es parametrizar el compose para que lea las credenciales del `.env` de la misma forma que hacen el resto de los servicios.

### 4. Variables `MANAGEMENT_DATABASE_*` ausentes del fichero `.env.template`

El `.env.template` no incluye las variables del grupo `MANAGEMENT_DATABASE_*`, aunque el `docker-compose.dev.yml` las referencia. Deben añadirse manualmente al `.env` al configurar el entorno local de desarrollo.

### 5. Pasos del workflow `deploy_selfhosted.yml` descritos de forma incompleta

El job `deploy` del workflow realiza adicionalmente los siguientes pasos que no aparecen reflejados en la descripción de la sección 5.1.5:

1. Copia el fichero `docker-compose.selfhosted.yml` al directorio de trabajo del runner y lo renombra a `docker-compose.yml`
2. Ejecuta `docker compose down` antes de descargar las nuevas imágenes
3. Ejecuta `docker image prune -f` para liberar espacio de imágenes anteriores

### 6. Pasos del workflow `deploy_azure.yml` descritos de forma incompleta

El comando real de la etapa de bajada es `docker compose down --rmi all --remove-orphans`. La descripción de la sección 5.1.4 omite el flag `--remove-orphans`. Además, el workflow copia el fichero `docker-compose.azure.yml` al servidor vía SCP y lo renombra a `docker-compose.yml` antes de arrancar los contenedores.

### 7. Discrepancia en la ruta de montaje de los certificados SSL en el escenario Azure

El `docker-compose.azure.yml` monta el directorio de certificados en `/etc/caddy/certs` dentro del contenedor de Caddy, pero el `Caddyfile` espera encontrar los ficheros en `/certs/cert.pem` y `/certs/key.pem`. El escenario self-hosted no tiene esta discrepancia (monta el directorio directamente en `/certs`). Esta diferencia debe corregirse en el `docker-compose.azure.yml`.
