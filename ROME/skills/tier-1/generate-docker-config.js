/**
 * /generate-docker-config skill (Tier 1)
 * Generates Docker configuration files
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateDockerConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory, node_version = '18-alpine' } = params;

    try {
      const filesGenerated = [];

      // Generate Dockerfile
      const dockerfile = this.generateDockerfile(node_version);
      fs.writeFileSync(path.join(output_directory, 'Dockerfile'), dockerfile);
      filesGenerated.push('Dockerfile');

      // Generate .dockerignore
      const dockerignore = this.generateDockerignore();
      fs.writeFileSync(path.join(output_directory, '.dockerignore'), dockerignore);
      filesGenerated.push('.dockerignore');

      // Generate docker-compose.yml
      const compose = this.generateDockerCompose(node_version);
      fs.writeFileSync(path.join(output_directory, 'docker-compose.yml'), compose);
      filesGenerated.push('docker-compose.yml');

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`Docker configuration generation failed: ${error.message}`);
    }
  }

  static generateDockerfile(nodeVersion) {
    return `# Multi-stage build for Node.js application
FROM node:${nodeVersion} AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:${nodeVersion}

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
`;
  }

  static generateDockerignore() {
    return `node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
.DS_Store
*.log
dist
coverage
.vscode
.idea
`;
  }

  static generateDockerCompose(nodeVersion) {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=\${NODE_ENV:-development}
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    networks:
      - app-network

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=\${DB_NAME:-app_db}
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
`;
  }
}

module.exports = GenerateDockerConfig;
