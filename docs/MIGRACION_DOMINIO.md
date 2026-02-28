# 🚀 Guía SIMPLIFICADA: Cambio a dominio uniovi.es

## ✅ Situación actual (VERIFICADA)

- ✅ **HTTPS ya funciona**: `https://planificador.ingenieriainformatica.uniovi.es`
- ✅ **Certificado oficial activo**: `*.ingenieriainformatica.uniovi.es` (GEANT TLS)
- ✅ **Válido hasta**: 26 Noviembre 2026
- ✅ **Arquitectura**: Reverse proxy de la universidad → Tu aplicación

**Conclusión:** La infraestructura SSL está lista. Solo necesitas actualizar configuraciones.

---

## 📝 PASO 1: Actualizar variables de entorno

### 1.1. Backup del .env actual

```bash
cd c:\Users\murias10\Desktop\TeachingPlanner
cp .env .env.backup
```

### 1.2. Editar `.env`

Abre el archivo `.env` y cambia SOLO estas 3 líneas:

```env
# Línea 30 - ANTES:
DOMAIN=teachingplanner.duckdns.org
# DESPUÉS:
DOMAIN=planificador.ingenieriainformatica.uniovi.es

# Línea 55 - ANTES:
FRONTEND_URL=http://localhost:5173
# DESPUÉS:
FRONTEND_URL=https://planificador.ingenieriainformatica.uniovi.es

# Línea 62 - ANTES:
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
# DESPUÉS:
GOOGLE_REDIRECT_URI=https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback
```

### ✅ Verificar cambios:

```bash
cat .env | grep -E "^DOMAIN=|^FRONTEND_URL=|^GOOGLE_REDIRECT_URI="
```

**Resultado esperado:**
```
DOMAIN=planificador.ingenieriainformatica.uniovi.es
FRONTEND_URL=https://planificador.ingenieriainformatica.uniovi.es
GOOGLE_REDIRECT_URI=https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback
```

---

## 📝 PASO 2: Actualizar Google OAuth

### 2.1. Acceder a Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Selecciona tu proyecto: **TeachingPlanner**
3. Menú lateral → **APIs y servicios** → **Credenciales**
4. Click en tu credencial OAuth existente

### 2.2. Agregar nuevas URLs

**En "Orígenes de JavaScript autorizados", AGREGAR:**
```
https://planificador.ingenieriainformatica.uniovi.es
```

**En "URIs de redirección autorizados", AGREGAR:**
```
https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback
```

### 2.3. Configuración final

**Debe quedar así (mantén localhost para desarrollo local):**

**Orígenes autorizados:**
- `http://localhost:5173`
- `https://planificador.ingenieriainformatica.uniovi.es` ← NUEVO

**URIs de redirección:**
- `http://localhost:8080/api/auth/google/callback`
- `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback` ← NUEVO

### 2.4. Guardar

Click **"Guardar"** y espera ~2-5 minutos para que los cambios propaguen.

### ✅ Verificar:

Refresca la página de credenciales y confirma que ambas URLs aparecen.

---

## 📝 PASO 3: Desplegar cambios en servidor

### 3.1. Conectar al servidor

```bash
ssh tu_usuario@156.35.95.119
```

### 3.2. Ir al directorio del proyecto

```bash
cd /ruta/del/proyecto/TeachingPlanner
```

### 3.3. Copiar .env actualizado desde tu PC

**Desde tu PC (otra terminal):**
```bash
scp c:\Users\murias10\Desktop\TeachingPlanner\.env tu_usuario@156.35.95.119:/ruta/del/proyecto/TeachingPlanner/
```

O edita manualmente el `.env` en el servidor con `nano` o `vi`.

### 3.4. Verificar que el .env se actualizó

```bash
cat .env | grep DOMAIN
```

**Debe mostrar:**
```
DOMAIN=planificador.ingenieriainformatica.uniovi.es
```

### 3.5. Recrear containers con nueva configuración

```bash
# Detener containers
docker-compose -f docker-compose.selfhosted.yml down

# Iniciar con nueva configuración
docker-compose -f docker-compose.selfhosted.yml up -d
```

### 3.6. Verificar logs

```bash
# Ver logs de todos los servicios
docker-compose -f docker-compose.selfhosted.yml logs -f

# O específicamente de user_service (que envía emails)
docker logs -f user_service
```

### ✅ Verificar:

**Sin errores de:**
- "connection refused"
- "certificate error"
- "network timeout"

---

## 📝 PASO 4: Probar emails con dominio correcto

### 4.1. Crear un usuario de prueba

1. Accede a: `https://planificador.ingenieriainformatica.uniovi.es`
2. Intenta crear un nuevo usuario
3. Revisa el email de activación recibido

### 4.2. Verificar URL en email

El email **DEBE contener:**
```
https://planificador.ingenieriainformatica.uniovi.es/activate/...
```

El email **NO debe contener:**
```
http://localhost:5173/activate/...
```

### ✅ Si el email tiene el dominio correcto → PASO 4 COMPLETO

### ❌ Si sigue usando localhost:

**Debugging:**
```bash
# Conectar al servidor
ssh tu_usuario@156.35.95.119

# Verificar que user_service tiene la variable correcta
docker exec user_service printenv FRONTEND_URL

# Debe mostrar:
# https://planificador.ingenieriainformatica.uniovi.es
```

**Si muestra localhost:**
```bash
# Recrear containers forzando rebuild
docker-compose -f docker-compose.selfhosted.yml up -d --force-recreate user_service
```

---

## 📝 PASO 5: Probar Google Calendar OAuth

### 5.1. Acceder a la aplicación

```
https://planificador.ingenieriainformatica.uniovi.es
```

### 5.2. Intentar conectar Google Calendar

1. Login en la aplicación
2. Ve a la sección de Google Calendar / Sincronización
3. Click en "Conectar con Google Calendar"

### 5.3. Verificar flujo OAuth

**Debe:**
1. Redirigir a Google (`accounts.google.com`)
2. Mostrar pantalla de permisos de Google Calendar
3. Después de aceptar, redirigir a:
   ```
   https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback?code=...
   ```
4. Volver a la aplicación con conexión exitosa

### ✅ Si el flujo funciona sin errores → PASO 5 COMPLETO

### ❌ Errores comunes:

**Error: "redirect_uri_mismatch"**
- Causa: Google aún no tiene la URL autorizada
- Solución: Espera 5 minutos más o verifica que guardaste en Google Cloud Console

**Error: "invalid_client"**
- Causa: Credenciales incorrectas
- Solución: Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `.env` son correctos

---

## 📝 PASO 6: Verificación final

### Checklist completo:

```
□ Variables .env actualizadas (DOMAIN, FRONTEND_URL, GOOGLE_REDIRECT_URI)
□ Google Cloud Console tiene URLs nuevas
□ Containers reiniciados con nueva configuración
□ Aplicación accesible en https://planificador.ingenieriainformatica.uniovi.es
□ Candado verde en navegador (HTTPS válido)
□ Emails usan dominio nuevo (no localhost)
□ Google OAuth funciona correctamente
□ Sin errores en navegador (F12 → Console)
```

### Prueba de humo (smoke test):

1. **HTTPS funciona:**
   ```bash
   curl -I https://planificador.ingenieriainformatica.uniovi.es
   ```
   Debe devolver: `HTTP/1.1 200 OK`

2. **Certificado es válido:**
   - Abre en navegador: `https://planificador.ingenieriainformatica.uniovi.es`
   - Click en candado → Ver certificado
   - Debe decir: `*.ingenieriainformatica.uniovi.es`

3. **No hay Mixed Content:**
   - F12 → Console
   - No debe haber warnings de "Mixed Content"

4. **API funciona:**
   ```bash
   curl https://planificador.ingenieriainformatica.uniovi.es/api/health
   ```
   O la ruta de health check que tengas.

---

## 🐛 Troubleshooting

### Problema 1: Emails siguen usando localhost

**Síntoma:** Email contiene `http://localhost:5173/activate/...`

**Causa:** Variable `FRONTEND_URL` no se actualizó en el container

**Solución:**
```bash
# En el servidor
docker exec user_service printenv FRONTEND_URL

# Si muestra localhost:
docker-compose -f docker-compose.selfhosted.yml restart user_service

# Si sigue mal:
docker-compose -f docker-compose.selfhosted.yml up -d --force-recreate user_service
```

---

### Problema 2: Google OAuth "redirect_uri_mismatch"

**Síntoma:**
```
Error 400: redirect_uri_mismatch
The redirect URI ... does not match the ones authorized
```

**Causa:** URI no está en Google Cloud Console O cambios no propagaron

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Verifica que está exactamente: `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback`
3. Espera 5 minutos para propagación
4. Intenta de nuevo

---

### Problema 3: Mixed Content Warnings

**Síntoma:** Warnings en consola del navegador:
```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but requested an insecure resource 'http://...'.
```

**Causa:** Alguna URL hardcodeada usa `http://`

**Solución:**
```bash
# Buscar URLs hardcodeadas en el código
grep -r "http://planificador" webapp/src/
grep -r "http://teachingplanner" webapp/src/

# Verificar que VITE_GATEWAY_API_URL es relativa
cat webapp/.env.production
# Debe ser: VITE_GATEWAY_API_URL=/api
```

Si encuentras URLs hardcodeadas, cámbialas a relativas (`/api/...`) o usa HTTPS.

---

### Problema 4: Aplicación no carga / 502 Bad Gateway

**Síntoma:** Navegador muestra "502 Bad Gateway"

**Causa:** Proxy de la universidad no puede conectar con tu aplicación

**Solución:**
```bash
# Verificar que containers están corriendo
docker ps

# Verificar logs del gateway
docker logs gateway_service

# Verificar que puerto 8080 está escuchando
netstat -tuln | grep 8080
```

**Si nada funciona:**
```bash
# Reiniciar todos los servicios
docker-compose -f docker-compose.selfhosted.yml restart
```

---

## 📊 Resumen de cambios

| Qué | Valor anterior | Valor nuevo |
|-----|----------------|-------------|
| `.env` → `DOMAIN` | `teachingplanner.duckdns.org` | `planificador.ingenieriainformatica.uniovi.es` |
| `.env` → `FRONTEND_URL` | `http://localhost:5173` | `https://planificador.ingenieriainformatica.uniovi.es` |
| `.env` → `GOOGLE_REDIRECT_URI` | `http://localhost:8080/api/auth/google/callback` | `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback` |
| Google OAuth → Orígenes | Solo localhost | + `https://planificador.ingenieriainformatica.uniovi.es` |
| Google OAuth → Redirects | Solo localhost | + `https://planificador.ingenieriainformatica.uniovi.es/api/auth/google/callback` |

---

## 📞 Si algo falla

1. **Revisa logs:** `docker-compose logs -f`
2. **Revisa consola del navegador:** F12 → Console
3. **Verifica variables:** `docker exec user_service printenv | grep URL`
4. **Contacta a tu profesor** si hay problemas con la infraestructura de la universidad

---

## ✅ Señales de éxito

Sabrás que todo está bien cuando:

1. ✅ `https://planificador.ingenieriainformatica.uniovi.es` carga con candado verde
2. ✅ Emails de activación usan el dominio correcto
3. ✅ Google OAuth funciona sin errores
4. ✅ No hay warnings de "Mixed Content" en consola
5. ✅ Puedes sincronizar con Google Calendar

---

## 🎯 Tiempo estimado

- **PASO 1** (Variables .env): 5 minutos
- **PASO 2** (Google OAuth): 10 minutos
- **PASO 3** (Despliegue): 10 minutos
- **PASO 4** (Prueba emails): 5 minutos
- **PASO 5** (Prueba Google Calendar): 10 minutos
- **PASO 6** (Verificación): 5 minutos

**Total: ~45 minutos** (si todo va bien)

---

¡Buena suerte! 🚀
