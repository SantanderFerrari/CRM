# ── Stage 1: dependencies ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ──────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Own files as non-root
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]