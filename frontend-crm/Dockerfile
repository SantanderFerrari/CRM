# ── Stage 1: build React app ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# REACT_APP_API_URL is injected at build time via --build-arg
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: serve with Nginx ─────────────────────────────────────────────
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built React app
COPY --from=builder /app/build .

# Copy custom nginx config (handles React Router client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]