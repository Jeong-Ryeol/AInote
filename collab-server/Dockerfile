FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY collab-server/package.json collab-server/package-lock.json* ./
RUN npm ci || npm install

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY collab-server/src ./src
COPY collab-server/tsconfig.json ./tsconfig.json
COPY collab-server/package.json ./package.json
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 1234

CMD ["node", "dist/index.js"]
