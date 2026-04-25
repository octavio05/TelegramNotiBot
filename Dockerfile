# --- Etapa de construcción ---
FROM node:20-alpine AS builder

# Instalar herramientas necesarias para pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias (incluyendo dev)
RUN pnpm install --frozen-lockfile

# Copiar código fuente y configuración de TS
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript a JavaScript (esto crea la carpeta dist)
RUN pnpm run build

# Eliminar dependencias de desarrollo para aligerar node_modules
RUN pnpm install --prod --frozen-lockfile --ignore-scripts


# --- Etapa de ejecución ---
FROM node:20-alpine AS runner

RUN apk add --no-cache tzdata

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production

# Copiar solo lo necesario desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Crear directorio de logs y ajustar permisos para el usuario 'node'
RUN mkdir logs && chown node:node logs

# Usar el usuario no privilegiado integrado en la imagen de node
USER node

# Iniciar la aplicación
# Se asume que el punto de entrada principal es dist/index.js
CMD ["node", "dist/index.js"]
