# Configuración de Google OAuth 2.0 para TeachingPlanner

## Requisitos previos
- Cuenta de Google
- Dominio válido (puede ser gratuito como DuckDNS)

---

## Paso 1: Obtener un dominio (si no tienes uno)

### Opción recomendada: DuckDNS (gratis)
1. Ve a [duckdns.org](https://www.duckdns.org)
2. Inicia sesión con tu cuenta Google
3. En "sub domain", escribe el nombre que quieras (ej: `teachingplanner`)
4. Click "add domain"
5. En "current ip", pon la IP de tu servidor: `156.35.95.65`
6. Click "update ip"

Tu dominio será: `teachingplanner.duckdns.org`

---

## Paso 2: Crear proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Inicia sesión con tu cuenta Google
3. En la barra superior, click en el selector de proyectos → **"Nuevo Proyecto"**
4. Configura:
   - **Nombre**: `TeachingPlanner`
   - **Organización**: Sin organización
5. Click **"Crear"**
6. Espera y asegúrate de que el proyecto está seleccionado

---

## Paso 3: Habilitar Google Calendar API

1. Menú lateral (☰) → **"APIs y servicios"** → **"Biblioteca"**
2. Buscar: `Google Calendar API`
3. Click en el resultado → **"Habilitar"**

---

## Paso 4: Configurar pantalla de consentimiento OAuth

1. Menú lateral → **"APIs y servicios"** → **"Pantalla de consentimiento OAuth"**
2. Tipo de usuario: **"Externo"** → Click **"Crear"**

### Información de la app:
- **Nombre de la app**: `TeachingPlanner`
- **Correo de asistencia**: tu email
- **Logo**: (opcional)

### Información de contacto del desarrollador:
- **Correos electrónicos**: tu email

Click **"Guardar y continuar"**

### Permisos (Scopes):
1. Click **"Añadir o quitar permisos"**
2. Buscar `calendar`
3. Marcar: `https://www.googleapis.com/auth/calendar`
4. Click **"Actualizar"** → **"Guardar y continuar"**

### Usuarios de prueba:
1. Click **"+ Add users"**
2. Añadir emails de los administradores que probarán la app
3. Click **"Añadir"** → **"Guardar y continuar"**

Click **"Volver al panel"**

---

## Paso 5: Crear credenciales OAuth 2.0

1. Menú lateral → **"APIs y servicios"** → **"Credenciales"**
2. Click **"+ Crear credenciales"** → **"ID de cliente OAuth"**

### Configuración:
- **Tipo de aplicación**: `Aplicación web`
- **Nombre**: `TeachingPlanner Web Client`

### Orígenes de JavaScript autorizados:
```
http://localhost:5173
https://teachingplanner.duckdns.org
```

### URIs de redirección autorizados:
```
http://localhost:8080/api/auth/google/callback
https://teachingplanner.duckdns.org/api/auth/google/callback
```

3. Click **"Crear"**

### ⚠️ IMPORTANTE: Guardar credenciales
Aparecerá una ventana con:
- **ID de cliente**: `xxxx.apps.googleusercontent.com`
- **Secreto del cliente**: `GOCSPX-xxxx`

**Copia y guarda ambos valores ahora. El secreto solo se muestra una vez.**

---

## Paso 6: Configurar variables de entorno

Añadir al archivo `.env` del servidor:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=https://teachingplanner.duckdns.org/api/auth/google/callback

# Clave de cifrado para tokens (genera con: openssl rand -hex 32)
ENCRYPTION_KEY=tu_clave_de_32_caracteres_hex
```

---

## Paso 7: Generar clave de cifrado

Los tokens de Google se almacenan cifrados en la base de datos. Necesitas generar una clave:

```bash
# En Linux/Mac:
openssl rand -hex 32

# En Windows (PowerShell):
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Copia el resultado y pégalo en `ENCRYPTION_KEY` del archivo `.env`.

---

## Notas importantes

| Aspecto | Detalle |
|---------|---------|
| **Estado "En pruebas"** | Solo usuarios añadidos en "Usuarios de prueba" pueden usar OAuth |
| **Límite usuarios de prueba** | Máximo 100 usuarios |
| **Expiración de tokens** | En modo pruebas, expiran cada 7 días |
| **VPN** | No afecta al funcionamiento de OAuth |

---

## Actualizar Caddyfile y CORS

Si usas un nuevo dominio, recuerda actualizar:

### 1. Caddyfile (webapp/Caddyfile)
Añadir el nuevo dominio a la configuración.

### 2. CORS whitelist (gateway_service/src/app.ts)
Añadir el nuevo dominio a la lista blanca:
```typescript
"https://teachingplanner.duckdns.org",
"http://teachingplanner.duckdns.org",
```

### 3. Certificado SSL
Generar nuevo certificado que incluya el dominio.

---

## Credenciales (RELLENAR)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
ENCRYPTION_KEY=
```

---

## Uso en la aplicacion

Una vez configurado:

1. Un usuario ADMIN debe ir a **Configuracion** en la webapp
2. Click en **"Conectar con Google"**
3. Autorizar el acceso a Google Calendar
4. Ir a la pagina de **Calendarios**
5. Seleccionar los calendarios que quiere sincronizar
6. Usar el botón **Sincronizar** para lanzar la sincronización manualmente

### Endpoints disponibles

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/auth/google/initiate` | Inicia el flujo OAuth |
| GET | `/api/auth/google/callback` | Callback de Google |
| POST | `/api/auth/google/disconnect` | Desconecta cuenta Google |
| GET | `/api/auth/google/status` | Estado de conexion |
| GET | `/api/calendar-sync` | Lista syncs del usuario |
| POST | `/api/calendar-sync` | Crea nuevo sync |
| DELETE | `/api/calendar-sync/:id` | Elimina sync |
| PATCH | `/api/calendar-sync/:id/toggle` | Activa/desactiva sync |
| POST | `/api/calendar-sync/:id/sync-now` | Sincroniza inmediatamente |
