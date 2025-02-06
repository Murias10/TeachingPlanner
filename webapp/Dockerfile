# Stage 1: Build con Node.js 22
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json vite.config.js ./

# Instalar dependencias de producción
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Variables de entorno para el build (personaliza según necesites)
ARG VITE_API_BASE_URL="https://api.tudominio.com"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Build de producción
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:1.25-alpine

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