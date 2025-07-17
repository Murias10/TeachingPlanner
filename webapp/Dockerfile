# Stage 1: Build con Node.js 22
FROM node:23-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json vite.config.ts ./

# Instalar dependencias de producción
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Build de producción
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:1.28.0-alpine

# Eliminar configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/conf.d

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Establecer permisos seguros
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Puerto y comando
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]