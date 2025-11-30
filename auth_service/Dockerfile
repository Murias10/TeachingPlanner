# Etapa 1: Build
FROM node:23-alpine AS builder

WORKDIR /app

# Copiar archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Etapa 2: Producción
FROM node:23-alpine

WORKDIR /app

# Copiar solo los archivos necesarios desde la etapa de build
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copiar archivo de inicialización de datos
COPY --from=builder /app/init-data.sql ./init-data.sql

# Expone el puerto de la API
EXPOSE 3000

# Ejecuta la app compilada
CMD ["node", "dist/index.js"]
