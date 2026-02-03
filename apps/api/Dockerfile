FROM node:24-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install all dependencies (needed for build)
RUN pnpm install --frozen-lockfile --filter=api

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN pnpm build

# Deploy stage - create standalone production bundle
FROM deps AS deployer
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api ./apps/api

# Use pnpm deploy to create a standalone bundle with resolved dependencies
RUN pnpm deploy --filter=api --prod /app/deployed

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy the deployed standalone bundle
COPY --from=deployer /app/deployed ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
