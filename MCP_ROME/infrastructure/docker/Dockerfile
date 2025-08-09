# MCP Documentation Server Dockerfile
# Node.js 18 Alpine base for production deployment

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory and set ownership
WORKDIR /app
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=node:node . .

# Expose MCP server port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Start the MCP server
CMD ["npm", "start"]