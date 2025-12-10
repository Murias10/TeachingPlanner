# 🔒 Configuración HTTPS con Caddy

## ✅ Arquitectura Actual

La aplicación utiliza **Caddy** como servidor web para manejar SSL/HTTPS automáticamente.

### Archivos de Configuración:
- ✅ `webapp/Dockerfile` - Configuración multi-stage con Caddy
- ✅ `webapp/Caddyfile` - Configuración del servidor Caddy
- ✅ `docker-compose.yml` - Configuración de puertos y volúmenes
- ✅ `docker-compose.dev.yml` - Configuración para desarrollo
- ✅ `.env` - Variable `DOMAIN` para determinar el entorno

---

## 🔧 Cómo Funciona

### **Detección Automática de Entorno**

Caddy determina automáticamente si está en **desarrollo** o **producción** basándose en la variable de entorno `DOMAIN`:

```env
DOMAIN=localhost          # Desarrollo (HTTP)
DOMAIN=tudominio.com      # Producción (HTTPS automático)
```

Esta variable se lee en la primera línea del `Caddyfile`:

```caddyfile
{$DOMAIN:localhost} {
    # ... configuración
}
```

**Comportamiento según el valor:**

| Entorno | `DOMAIN` | Puerto 80 | Puerto 443 | SSL |
|---------|----------|-----------|------------|-----|
| **Desarrollo** | `localhost` | Sirve HTTP | Expuesto pero sin uso | ❌ No |
| **Producción** | `tudominio.com` | Redirige a HTTPS | Sirve HTTPS | ✅ Automático |

---

### **Flujo en Desarrollo (localhost)**

1. Usuario accede a `http://localhost:80`
2. Caddy detecta que `DOMAIN=localhost`
3. Caddy **no intenta** obtener certificado SSL (Let's Encrypt no emite certificados para localhost)
4. Sirve la aplicación directamente por HTTP

```
Usuario → http://localhost:80 → Caddy → App (HTTP)
```

---

### **Flujo en Producción (dominio real)**

#### **Primera vez (obtención de certificado):**

1. Usuario accede a `http://tudominio.com:80`
2. Caddy detecta que `DOMAIN=tudominio.com` (dominio real)
3. Caddy automáticamente:
   - Contacta a Let's Encrypt vía puerto 80
   - Valida que eres dueño del dominio (desafío HTTP-01)
   - Obtiene certificado SSL (válido 90 días)
   - Guarda el certificado en volumen Docker `caddy_data`
   - Configura HTTPS en puerto 443
   - Redirige automáticamente HTTP → HTTPS

```
Usuario → http://tudominio.com:80 → Caddy (redirige) → https://tudominio.com:443
                                            ↓
                                    Let's Encrypt (valida)
                                            ↓
                                    Certificado SSL ✅
```

#### **Visitas posteriores:**

1. Usuario accede a `http://tudominio.com` o `https://tudominio.com`
2. Caddy redirige automáticamente a HTTPS si es HTTP
3. Sirve la app con certificado SSL válido

```
Usuario → https://tudominio.com:443 → Caddy (SSL) → App
```

#### **Renovación automática:**

- Caddy revisa diariamente si el certificado expira pronto
- Si faltan ~30 días para expirar, Caddy renueva automáticamente
- No requiere intervención manual ni scripts cron
- El certificado se renueva cada 60 días (antes de los 90 días de expiración)

---

## 📂 Configuración de Archivos

### **1. Caddyfile (`webapp/Caddyfile`)**

```caddyfile
{$DOMAIN:localhost} {
    # Directorio raíz de la aplicación React
    root * /srv

    # Compresión automática (reduce tamaño de respuestas)
    encode gzip zstd

    # Servir archivos estáticos
    file_server

    # SPA - todas las rutas van a index.html (React Router)
    try_files {path} /index.html

    # Headers de seguridad automáticos
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"

        # Cache para assets estáticos (CSS, JS, imágenes)
        @static {
            path *.ico *.css *.js *.gif *.jpg *.jpeg *.png *.svg *.woff *.woff2 *.ttf *.eot
        }
        Cache-Control "public, max-age=31536000, immutable" @static
    }

    # Logs a stdout (visibles con docker logs webapp)
    log {
        output stdout
        format console
    }
}
```

**Explicación detallada:**

- **`{$DOMAIN:localhost}`**: Lee variable de entorno `DOMAIN`, usa `localhost` si no existe
- **`root * /srv`**: Directorio donde están los archivos de React (copiados en Dockerfile)
- **`encode gzip zstd`**: Comprime respuestas automáticamente (menor uso de ancho de banda)
- **`file_server`**: Sirve archivos estáticos (HTML, CSS, JS, imágenes)
- **`try_files {path} /index.html`**: Esencial para SPAs - si el archivo no existe, sirve `index.html` (React Router maneja la ruta)
- **Headers de seguridad**: Protección contra XSS, clickjacking, etc.
- **Cache-Control**: Assets estáticos con hash en nombre pueden cachearse permanentemente

---

### **2. Dockerfile (`webapp/Dockerfile`)**

```dockerfile
# Stage 1: Build con Node.js
FROM node:23-alpine3.20 AS builder

WORKDIR /app
COPY package.json package-lock.json vite.config.ts ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Servir con Caddy
FROM caddy:2.8-alpine

# Copiar archivos construidos desde stage anterior
COPY --from=builder /app/dist /srv

# Copiar configuración de Caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Permisos seguros
RUN chown -R caddy:caddy /srv && \
    chmod -R 755 /srv

# Caddy expone 80 (HTTP) y 443 (HTTPS) automáticamente
EXPOSE 80 443

# Iniciar Caddy con la configuración
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
```

**Explicación:**

- **Multi-stage build**: Etapa 1 construye la app, etapa 2 solo incluye los archivos necesarios (imagen más pequeña)
- **`COPY --from=builder /app/dist /srv`**: Copia solo archivos compilados (no node_modules ni código fuente)
- **`chown -R caddy:caddy /srv`**: Caddy corre como usuario no-root por seguridad
- **`EXPOSE 80 443`**: Declara puertos (documentación, no abre puertos automáticamente)

---

### **3. Docker Compose (`docker-compose.yml`)**

```yaml
webapp:
  container_name: ${WEBAPP_HOST}
  image: ghcr.io/murias10/teachingplanner/webapp:latest
  ports:
    - "${WEBAPP_PORT}:80"    # Puerto HTTP (desarrollo y validación Let's Encrypt)
    - "443:443"              # Puerto HTTPS (solo producción)
  env_file:
    - .env
  volumes:
    - caddy_data:/data       # Certificados SSL persistentes
    - caddy_config:/config   # Configuración Caddy persistente
  # ... resto de configuración

volumes:
  caddy_data:      # Almacena certificados SSL
  caddy_config:    # Almacena configuración runtime de Caddy
```

**Explicación de puertos:**

- **`${WEBAPP_PORT}:80`**: Mapea puerto del host (ej: 80) → puerto 80 del container
  - **Desarrollo**: Sirve HTTP directamente
  - **Producción**: Let's Encrypt usa este puerto para validar dominio

- **`443:443`**: Puerto HTTPS
  - **Desarrollo**: Expuesto pero no usado (Caddy no activa SSL para localhost)
  - **Producción**: Sirve HTTPS con certificado SSL válido

**Explicación de volúmenes:**

- **`caddy_data`**: Almacena certificados SSL de Let's Encrypt
  - Persiste entre reinicios del container
  - Evita regenerar certificados en cada deploy
  - Sin este volumen, perderías certificados al recrear container

- **`caddy_config`**: Configuración runtime de Caddy
  - Cachés, estado interno, etc.

---

### **4. Variables de Entorno (`.env`)**

```env
DOMAIN=localhost          # Cambiar a dominio real en producción
WEBAPP_PORT=80           # Puerto HTTP del host
```

**Valores según entorno:**

| Entorno | `DOMAIN` | `WEBAPP_PORT` | Resultado |
|---------|----------|---------------|-----------|
| **Desarrollo local** | `localhost` | `80` | `http://localhost:80` |
| **Producción** | `tudominio.com` | `80` | `https://tudominio.com` (redirige automáticamente) |
| **Producción con puerto custom** | `tudominio.com` | `8080` | `https://tudominio.com` (acceso interno por 8080, público por 80/443) |

---

## 🚀 Cómo Usar

### **Desarrollo Local (HTTP)**

1. Asegúrate de tener `DOMAIN=localhost` en `.env`

2. Inicia los containers:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

3. Accede a: `http://localhost:80`

> **Nota:** No necesitas configurar nada para HTTPS en desarrollo. Caddy detecta automáticamente que es localhost y sirve HTTP sin SSL.

---

### **Producción (HTTPS Automático)**

#### **1. Configurar DNS**

Antes de desplegar, tu dominio debe apuntar a tu servidor:

```bash
# Verificar que el dominio apunta a tu servidor
nslookup tudominio.com

# Debe devolver la IP de tu servidor
```

Si no apunta, configura un registro DNS tipo **A**:
- **Host**: `@` (o el subdominio que uses)
- **Valor**: IP de tu servidor
- **TTL**: 3600 (o el predeterminado)

#### **2. Configurar Firewall**

Asegúrate de que los puertos están abiertos:

```bash
# Ver estado del firewall
sudo ufw status

# Abrir puertos necesarios
sudo ufw allow 80/tcp    # HTTP (validación Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS

# Verificar que están abiertos
sudo netstat -tuln | grep -E ':(80|443)'
```

#### **3. Configurar Variable `DOMAIN`**

Edita `.env`:

```env
DOMAIN=tudominio.com    # Tu dominio real
WEBAPP_PORT=80
```

> ⚠️ **Importante**: Usa el dominio exacto (con o sin `www` según tu configuración DNS)

#### **4. Desplegar**

```bash
# Desplegar con docker-compose
docker-compose up -d --build

# Ver logs para confirmar obtención de certificado
docker logs -f webapp
```

**Logs esperados:**

```
[INFO] Obtaining certificate for tudominio.com
[INFO] Successfully obtained certificate
[INFO] Serving HTTPS on :443
```

#### **5. Verificar**

1. Accede a `http://tudominio.com` → Debe redirigir a `https://tudominio.com`
2. Accede a `https://tudominio.com` → Debe mostrar candado verde en navegador
3. Verifica certificado en navegador: Debe decir "Issued by: Let's Encrypt"

---

## 📝 Notas Importantes

### **Persistencia de Certificados**

Los certificados SSL se almacenan en volúmenes Docker:
- **`caddy_data`**: Certificados SSL
- **`caddy_config`**: Configuración Caddy

**Ventajas:**
- ✅ Certificados persisten al reiniciar/recrear containers
- ✅ No hay límite de rate limit de Let's Encrypt (5 certificados/dominio/semana)
- ✅ Renovación automática funciona correctamente

**Importante:**
- ⚠️ Si eliminas el volumen `caddy_data`, se perderán los certificados y Caddy los regenerará
- ⚠️ No es necesario hacer backup de certificados (Caddy los regenera automáticamente si faltan)

---

### **Dominios Múltiples**

Para servir múltiples dominios (ej: `tudominio.com` y `www.tudominio.com`), edita `webapp/Caddyfile`:

```caddyfile
tudominio.com, www.tudominio.com {
    root * /srv
    encode gzip zstd
    file_server
    try_files {path} /index.html
}
```

Caddy automáticamente:
- Obtiene certificados para **ambos** dominios
- Sirve el mismo contenido en ambos
- Renueva ambos certificados automáticamente

---

### **Subdominios**

Para usar un subdominio (ej: `app.tudominio.com`):

1. Configura DNS:
   - Tipo: **A** o **CNAME**
   - Host: `app`
   - Valor: IP del servidor (o dominio principal si CNAME)

2. Edita `.env`:
   ```env
   DOMAIN=app.tudominio.com
   ```

3. Redeploy:
   ```bash
   docker-compose up -d --build
   ```

---

### **Renovación Automática de Certificados**

**¿Cuándo se renuevan?**
- Certificados Let's Encrypt son válidos por **90 días**
- Caddy los renueva automáticamente cuando faltan **~30 días** para expirar
- No requiere intervención manual ni scripts cron

**¿Cómo verificar la fecha de expiración?**

```bash
# Ver logs de renovación
docker logs webapp | grep -i renew

# Ver certificados activos
docker exec webapp caddy list-modules

# Verificar en navegador: clic en candado → Ver certificado → "Valid until"
```

**¿Qué pasa si falla la renovación?**
- Caddy reintenta automáticamente
- Si falla repetidamente, revisa logs: `docker logs webapp`
- Causas comunes: DNS cambió, puerto 80 bloqueado, límite de rate de Let's Encrypt

---

## 🐛 Troubleshooting

### **Error: "obtaining certificate"**

**Síntomas:**
```
[ERROR] obtaining certificate: acme: Error 403 - Forbidden
```

**Causas comunes:**

1. **Dominio no apunta al servidor**
   ```bash
   # Verificar DNS
   nslookup tudominio.com
   # Debe devolver la IP de tu servidor
   ```

   **Solución**: Espera propagación DNS (hasta 24-48 horas) o verifica configuración DNS

2. **Puerto 80 bloqueado**
   ```bash
   # Verificar que puerto 80 está abierto
   sudo netstat -tuln | grep :80
   ```

   **Solución**: Abre puerto 80 en firewall (`sudo ufw allow 80/tcp`)

3. **Firewall bloqueando conexiones**
   ```bash
   # Ver reglas de firewall
   sudo ufw status verbose
   ```

   **Solución**: Permite tráfico entrante en puertos 80 y 443

4. **Rate limit de Let's Encrypt**
   - Let's Encrypt permite máximo 5 certificados/dominio/semana
   - Si regeneras certificados muchas veces, puedes alcanzar el límite

   **Solución**: Espera 1 semana o usa [staging environment](https://letsencrypt.org/docs/staging-environment/) para pruebas

---

### **Error: "Connection refused" en HTTPS**

**Síntomas:**
- `http://tudominio.com` funciona
- `https://tudominio.com` devuelve "Connection refused"

**Causa:** Puerto 443 no está mapeado o bloqueado

**Solución:**

1. Verifica `docker-compose.yml`:
   ```yaml
   ports:
     - "80:80"
     - "443:443"  # Debe estar presente
   ```

2. Verifica firewall:
   ```bash
   sudo ufw allow 443/tcp
   ```

3. Reinicia container:
   ```bash
   docker-compose restart webapp
   ```

---

### **Certificado "inválido" en localhost**

**Síntomas:**
- Navegador muestra "Tu conexión no es privada"
- Certificado dice "self-signed" o "auto-firmado"

**Causa:** Esto es **normal** en localhost. Caddy no puede obtener certificado real de Let's Encrypt para localhost.

**Solución:**

1. **Usar HTTP en desarrollo:**
   ```
   http://localhost:80  (sin HTTPS)
   ```

2. **Aceptar certificado auto-firmado:**
   - Chrome/Edge: Clic en "Avanzado" → "Continuar a localhost"
   - Firefox: Clic en "Avanzado" → "Aceptar riesgo y continuar"

3. **Para producción:** Usa un dominio real configurado en `DOMAIN`

---

### **Ver logs de Caddy**

```bash
# Ver logs en tiempo real
docker logs -f webapp

# Ver últimas 100 líneas
docker logs --tail 100 webapp

# Filtrar por errores
docker logs webapp | grep -i error

# Filtrar por certificados
docker logs webapp | grep -i certificate
```

---

## 📚 Recursos

- **[Documentación de Caddy](https://caddyserver.com/docs/)** - Documentación oficial completa
- **[Caddyfile Syntax](https://caddyserver.com/docs/caddyfile)** - Referencia de sintaxis
- **[Let's Encrypt](https://letsencrypt.org/)** - Cómo funcionan los certificados SSL gratuitos
- **[ACME Protocol](https://letsencrypt.org/docs/challenge-types/)** - Tipos de desafíos de validación
- **[Rate Limits Let's Encrypt](https://letsencrypt.org/docs/rate-limits/)** - Límites de emisión de certificados

---

## ✨ Ventajas de Caddy

| Característica | Caddy | Alternativas (Nginx/Apache) |
|----------------|-------|----------------------------|
| **SSL automático** | ✅ Configuración cero | ❌ Requiere Certbot + scripts |
| **Renovación automática** | ✅ Sin cron jobs | ❌ Requiere cron job |
| **HTTP/2** | ✅ Automático | ⚠️ Requiere configuración |
| **Líneas de config** | 8 líneas | 40+ líneas |
| **Headers de seguridad** | ✅ Incluidos por defecto | ❌ Configuración manual |
| **Redirección HTTP→HTTPS** | ✅ Automática | ❌ Configuración manual |
| **Compresión** | ✅ Gzip/Zstandard incluidos | ⚠️ Requiere módulos |
| **Configuración SPA** | 1 línea (`try_files`) | 5+ líneas |

---

## 🔐 Seguridad

### **Headers de Seguridad Automáticos**

Caddy incluye automáticamente:

```
X-Content-Type-Options: nosniff        # Previene MIME type sniffing
X-Frame-Options: SAMEORIGIN            # Previene clickjacking
X-XSS-Protection: 1; mode=block        # Protección XSS en navegadores antiguos
```

### **HTTPS por Defecto**

- En producción, **todo** el tráfico es HTTPS
- HTTP redirige automáticamente a HTTPS
- Certificados válidos con cadena de confianza completa
- TLS 1.2+ (versiones antiguas deshabilitadas)

### **Permisos del Container**

- Caddy corre como usuario `caddy` (no root)
- Archivos con permisos 755 (lectura para todos, escritura solo para caddy)
- Principio de menor privilegio aplicado
