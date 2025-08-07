# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci


# Stage 3: Build
FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 4: Production image
FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache postgresql-client

# Copy only what's needed
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# ✅ This ensures the generated client exists
RUN npx prisma generate

CMD ["node", "dist/index.js"]
