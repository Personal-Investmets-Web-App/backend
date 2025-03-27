# Etapa de construcción
FROM node:22-alpine AS build

WORKDIR /app

# Copia archivos de package.json y package-lock.json primero para aprovechar el caché de Docker
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Construye la aplicación
RUN npm run build

# Etapa de producción
FROM node:22-alpine AS production

WORKDIR /app

# Copiar desde la etapa de construcción solo lo necesario
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Variables de entorno para producción
ENV NODE_ENV=production

# Crea un usuario no privilegiado para ejecutar la aplicación
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Cambia la propiedad de los archivos al usuario no privilegiado
RUN chown -R nestjs:nodejs /app

# Usa el usuario no privilegiado
USER nestjs

# Expone el puerto configurado en las variables de entorno
EXPOSE 443

# Comando para iniciar la aplicación
CMD ["node", "dist/src/main.js"]