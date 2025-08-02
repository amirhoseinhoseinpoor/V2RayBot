# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Build
FROM base AS builder
# COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json package-lock.json ./
RUN npm install -g npm@latest
COPY prisma ./prisma
COPY . .
RUN npx prisma generate
RUN npm run build && ls -la /usr/src/app/dist

# Stage 4: Production image
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json .

# Fix entrypoint
CMD ["node", "dist/index.js"]