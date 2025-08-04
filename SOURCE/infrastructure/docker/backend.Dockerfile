# =================================
# BACKEND DOCKERFILE - PRODUCTION
# =================================
# Multi-stage build for optimized production image

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY backend/package*.json ./
COPY package*.json ../

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY backend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install system dependencies for runtime
RUN apk add --no-cache \
    tini \
    dumb-init \
    curl \
    ca-certificates \
    && update-ca-certificates

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY --from=builder /app/ecosystem.config.js ./

# Create necessary directories
RUN mkdir -p /app/data/articles /app/data/logs /app/data/temp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "dist/index.js"]