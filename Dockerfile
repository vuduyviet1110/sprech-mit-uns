# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if native packages needed
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci || npm install --legacy-peer-deps

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Nuxt 3 application
ENV NODE_ENV=production
RUN npm run build && if [ -d "app/.output" ]; then mv app/.output ./.output; fi

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy output from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start Nuxt Nitro server
CMD ["node", ".output/server/index.mjs"]
