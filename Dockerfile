# Imagen base ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json primero (para aprovechar la cache de Docker)
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer el puerto donde corre tu API (ajústalo si usas otro)
EXPOSE 3000

# Comando por defecto
CMD ["npm", "start"]
