# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy build-time env vars satisfy the zod validator during `next build`.
# Real credentials are injected at runtime via docker-compose env_file.
RUN GOOGLE_SERVICE_ACCOUNT_EMAIL=build@placeholder.invalid \
    GOOGLE_PRIVATE_KEY="build-placeholder" \
    GOOGLE_SHEET_ID=build-placeholder \
    npm run build

# ── Stage 3: run (minimal) ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Bind inside the container; docker-compose restricts the host side to 127.0.0.1
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone build includes its own node_modules copy
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
