/**
 * /generate-env-config skill (Tier 1)
 * Generates environment configuration files from design specifications
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateEnvConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory, environments = ['development', 'staging', 'production'] } = params;

    try {
      const filesGenerated = [];

      // Ensure output directory exists
      fs.mkdirSync(output_directory, { recursive: true });

      // Load tech stack and other design specs
      const techStackFile = path.join(design_directory, 'tech-stack.json');
      const techStack = fs.existsSync(techStackFile) ? JSON.parse(fs.readFileSync(techStackFile, 'utf8')) : null;

      // Generate .env.example (template with placeholders)
      const exampleEnv = this.generateEnvTemplate(techStack);
      const examplePath = path.join(output_directory, '.env.example');
      fs.writeFileSync(examplePath, exampleEnv);
      filesGenerated.push('.env.example');

      // Generate environment-specific configs
      environments.forEach(env => {
        const envConfig = this.generateEnvForEnvironment(env, techStack);
        const envPath = path.join(output_directory, `.env.${env}`);
        fs.writeFileSync(envPath, envConfig);
        filesGenerated.push(`.env.${env}`);
      });

      return {
        files_generated: filesGenerated,
        environment_count: environments.length
      };

    } catch (error) {
      throw new Error(`Environment configuration generation failed: ${error.message}`);
    }
  }

  static generateEnvTemplate(techStack) {
    let config = '# Environment Configuration Template\n';
    config += '# Copy this file to .env and fill in actual values\n\n';

    // Node environment
    config += '# Application\n';
    config += 'NODE_ENV=development\n';
    config += 'PORT=3000\n';
    config += 'API_VERSION=v1\n\n';

    // Database
    if (techStack?.database?.primary) {
      config += '# Database\n';
      config += 'DB_HOST=localhost\n';
      config += 'DB_PORT=5432\n';
      config += 'DB_NAME=app_db\n';
      config += 'DB_USER=postgres\n';
      config += 'DB_PASSWORD=<your-db-password>\n';
      config += 'DB_SSL=false\n';
      config += 'DB_POOL_MIN=2\n';
      config += 'DB_POOL_MAX=10\n\n';
    }

    // Redis Cache
    if (techStack?.database?.cache) {
      config += '# Cache\n';
      config += 'REDIS_HOST=localhost\n';
      config += 'REDIS_PORT=6379\n';
      config += 'REDIS_PASSWORD=<your-redis-password>\n';
      config += 'CACHE_TTL=3600\n\n';
    }

    // Authentication
    if (techStack?.authentication?.strategy) {
      config += '# Authentication\n';
      config += 'JWT_SECRET=<your-jwt-secret-min-32-chars>\n';
      config += 'JWT_EXPIRY=1h\n';
      config += 'JWT_REFRESH_SECRET=<your-refresh-secret-min-32-chars>\n';
      config += 'JWT_REFRESH_EXPIRY=7d\n';
      config += 'BCRYPT_ROUNDS=10\n\n';
    }

    // CORS
    config += '# CORS\n';
    config += 'CORS_ORIGIN=http://localhost:3000,http://localhost:4200\n\n';

    // Logging
    config += '# Logging\n';
    config += 'LOG_LEVEL=debug\n';
    config += 'LOG_FORMAT=json\n\n';

    // Monitoring (if applicable)
    if (techStack?.monitoring) {
      config += '# Monitoring\n';
      config += 'PROMETHEUS_ENABLED=false\n';
      config += 'METRICS_PORT=9090\n\n';
    }

    // API Rate Limiting
    config += '# Rate Limiting\n';
    config += 'RATE_LIMIT_WINDOW_MS=60000\n';
    config += 'RATE_LIMIT_MAX_REQUESTS=100\n\n';

    // External Services
    config += '# External Services\n';
    config += 'EMAIL_SERVICE_API_KEY=<your-email-service-key>\n';
    config += 'STORAGE_SERVICE_KEY=<your-storage-key>\n';

    return config;
  }

  static generateEnvForEnvironment(environment, techStack) {
    let config = `# Environment Configuration - ${environment.toUpperCase()}\n`;
    config += `# Auto-generated: ${new Date().toISOString()}\n\n`;

    const envConfigs = {
      development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'app_dev',
        REDIS_HOST: 'localhost',
        CORS_ORIGIN: 'http://localhost:3000,http://localhost:4200',
        LOG_LEVEL: 'debug',
        DB_SSL: false
      },
      staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        DB_HOST: 'staging-db.example.com',
        DB_PORT: 5432,
        DB_NAME: 'app_staging',
        REDIS_HOST: 'staging-redis.example.com',
        CORS_ORIGIN: 'https://staging.example.com',
        LOG_LEVEL: 'info',
        DB_SSL: true
      },
      production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'prod-db.example.com',
        DB_PORT: 5432,
        DB_NAME: 'app_production',
        REDIS_HOST: 'prod-redis.example.com',
        CORS_ORIGIN: 'https://example.com',
        LOG_LEVEL: 'warn',
        DB_SSL: true
      }
    };

    const envVars = envConfigs[environment] || envConfigs.development;

    // Application
    config += '# Application\n';
    config += `NODE_ENV=${envVars.NODE_ENV}\n`;
    config += `PORT=${envVars.PORT}\n`;
    config += 'API_VERSION=v1\n\n';

    // Database
    config += '# Database\n';
    config += `DB_HOST=${envVars.DB_HOST}\n`;
    config += `DB_PORT=${envVars.DB_PORT}\n`;
    config += `DB_NAME=${envVars.DB_NAME}\n`;
    config += 'DB_USER=<set-in-secrets>\n';
    config += 'DB_PASSWORD=<set-in-secrets>\n';
    config += `DB_SSL=${envVars.DB_SSL}\n`;
    config += 'DB_POOL_MIN=2\n';
    config += `DB_POOL_MAX=${environment === 'production' ? 20 : 10}\n\n`;

    // Redis
    config += '# Cache\n';
    config += `REDIS_HOST=${envVars.REDIS_HOST}\n`;
    config += 'REDIS_PORT=6379\n';
    config += 'REDIS_PASSWORD=<set-in-secrets>\n';
    config += 'CACHE_TTL=3600\n\n';

    // Authentication
    config += '# Authentication\n';
    config += 'JWT_SECRET=<set-in-secrets>\n';
    config += 'JWT_EXPIRY=1h\n';
    config += 'JWT_REFRESH_SECRET=<set-in-secrets>\n';
    config += 'JWT_REFRESH_EXPIRY=7d\n';
    config += `BCRYPT_ROUNDS=${environment === 'production' ? 12 : 10}\n\n`;

    // CORS
    config += '# CORS\n';
    config += `CORS_ORIGIN=${envVars.CORS_ORIGIN}\n\n`;

    // Logging
    config += '# Logging\n';
    config += `LOG_LEVEL=${envVars.LOG_LEVEL}\n`;
    config += 'LOG_FORMAT=json\n\n';

    // Rate Limiting
    config += '# Rate Limiting\n';
    config += 'RATE_LIMIT_WINDOW_MS=60000\n';
    config += `RATE_LIMIT_MAX_REQUESTS=${environment === 'production' ? 60 : 100}\n`;

    return config;
  }
}

module.exports = GenerateEnvConfig;
