# =================================
# BACKEND DOCKERFILE - DEVELOPMENT
# =================================
# Optimized for development with hot reload

FROM node:20-alpine

# Install system dependencies
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
    freetype-dev \
    curl \
    git

# Install Puppeteer dependencies for development
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ttf-freefont

# Configure Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY package*.json ../

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY backend/ ./

# Create data directories
RUN mkdir -p /app/data/articles /app/data/logs /app/data/temp

# Expose ports
EXPOSE 3000 9229

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start development server with hot reload
CMD ["npm", "run", "dev"]