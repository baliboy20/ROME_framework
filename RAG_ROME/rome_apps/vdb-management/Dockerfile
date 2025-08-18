FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY vdb-management/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY vdb-management/ .

# Copy rome-console files
COPY rome-console/ ./rome-console

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vdb -u 1001

# Change ownership
RUN chown -R vdb:nodejs /app
USER vdb

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

EXPOSE 8081

CMD ["npm", "start"]