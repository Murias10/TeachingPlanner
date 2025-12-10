# Stage 1: Build con Node.js
FROM node:23-alpine3.20 AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json vite.config.ts ./

# Instalar dependencias de producción
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Servir con Caddy
FROM caddy:2.8-alpine

# Copiar archivos construidos
COPY --from=builder /app/dist /srv

# Copiar configuración de Caddy
COPY Caddyfile /etc/caddy/Caddyfile

# Caddy expone 80 (HTTP) y 443 (HTTPS) automáticamente
EXPOSE 80 443

# Caddy maneja SSL automáticamente
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]