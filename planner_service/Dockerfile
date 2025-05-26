# Imagen base ligera con Node.js
FROM node:23-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json 

# Instala dependencias de producción
RUN npm ci

# Copia el resto de los archivos de la aplicación
COPY . .

# Expone el puerto que usa la API (cambia si usas otro)
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]
