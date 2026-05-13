# Multi-stage Dockerfile for Web (React + Vite)
# Stage 1: Build
FROM node:20-slim AS builder


LABEL maintainer="Liveon Team"
LABEL description="Liveon Web Dashboard - Production Build"

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:1.25-alpine

LABEL maintainer="Liveon Team"
LABEL description="Liveon Web Dashboard - Production Runtime"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/app-config.template.js /opt/liveon/app-config.template.js
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:80/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
