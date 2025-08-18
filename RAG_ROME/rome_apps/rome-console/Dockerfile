FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY rome-console/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy console source files
COPY rome-console/ .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S console -u 1001

# Change ownership
RUN chown -R console:nodejs /app
USER console

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

EXPOSE 8081

CMD ["npm", "start"]