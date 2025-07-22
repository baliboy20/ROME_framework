/**
 * ROME Project Configuration Loader
 * Centralized configuration loading utility for all Node.js services
 */

const path = require('path');
const fs = require('fs');

class RomeConfig {
  constructor() {
    this.envPath = path.join(__dirname, '.env');
    this.config = {};
    this.loaded = false;
  }

  /**
   * Load configuration from artifact/.env
   */
  load() {
    if (this.loaded) return this.config;

    try {
      // Check if .env file exists
      if (!fs.existsSync(this.envPath)) {
        throw new Error(`Configuration file not found: ${this.envPath}`);
      }

      // Load using dotenv
      require('dotenv').config({ path: this.envPath });

      // Build structured config object
      this.config = {
        // Core Services
        services: {
          mcp: {
            host: process.env.MCP_SERVER_HOST || 'localhost',
            port: parseInt(process.env.MCP_SERVER_PORT) || 3000,
            url: process.env.MCP_SERVER_URL || 'http://localhost:3000'
          },
          monitoring: {
            backend: {
              port: parseInt(process.env.RSE_MONITORING_BACKEND_PORT) || 3002,
              url: process.env.RSE_MONITORING_BACKEND_URL || 'http://localhost:3002'
            },
            frontend: {
              port: parseInt(process.env.RSE_MONITORING_FRONTEND_PORT) || 8081,
              url: process.env.RSE_MONITORING_FRONTEND_URL || 'http://localhost:8081'
            },
            websocket: {
              port: parseInt(process.env.RSE_MONITORING_WEBSOCKET_PORT) || 3003,
              url: process.env.RSE_MONITORING_WEBSOCKET_URL || 'ws://localhost:3003'
            }
          },
          weaviate: {
            scheme: process.env.WEAVIATE_SCHEME || 'http',
            host: process.env.WEAVIATE_HOST || 'localhost',
            port: parseInt(process.env.WEAVIATE_PORT) || 8080,
            url: process.env.WEAVIATE_URL || 'http://localhost:8080',
            className: process.env.WEAVIATE_CLASS_NAME || 'ROMEDocument'
          },
          coffee: {
            backend: {
              port: parseInt(process.env.COFFEE_BACKEND_PORT) || 3001,
              url: process.env.COFFEE_BACKEND_URL || 'http://localhost:3001'
            },
            frontend: {
              port: parseInt(process.env.COFFEE_FRONTEND_PORT) || 8082,
              url: process.env.COFFEE_FRONTEND_URL || 'http://localhost:8082'
            }
          }
        },

        // Authentication
        auth: {
          romeApiKey: process.env.ROME_API_KEY,
          jwtSecret: process.env.JWT_SECRET,
          openaiApiKey: process.env.OPENAI_API_KEY,
          openaiModel: process.env.OPENAI_MODEL || 'text-embedding-3-small'
        },

        // Database
        database: {
          mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee_ordering',
            database: process.env.MONGODB_DATABASE || 'coffee_ordering'
          },
          vector: {
            connectionTimeout: parseInt(process.env.VECTOR_DB_CONNECTION_TIMEOUT) || 10000,
            maxRetries: parseInt(process.env.VECTOR_DB_MAX_RETRIES) || 3,
            retryDelay: parseInt(process.env.VECTOR_DB_RETRY_DELAY) || 1000
          }
        },

        // Application
        app: {
          nodeEnv: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0',
          logLevel: process.env.LOG_LEVEL || 'info',
          logFormat: process.env.LOG_FORMAT || 'json',
          corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
          debugMode: process.env.DEBUG_MODE === 'true'
        },

        // Paths
        paths: {
          rome: process.env.ROME_DOCS_PATH,
          romeSearch: process.env.ROME_SEARCH_PATH,
          experimental: process.env.ROME_EXPERIMENTAL_PATH,
          sourceBackend: process.env.SOURCE_BACKEND_PATH,
          sourceFrontend: process.env.SOURCE_FRONTEND_PATH,
          sourceInfrastructure: process.env.SOURCE_INFRASTRUCTURE_PATH,
          artifact: process.env.ARTIFACT_PATH || __dirname,
          backup: process.env.BACKUP_LOCATION
        },

        // Search & Processing
        search: {
          defaultLimit: parseInt(process.env.DEFAULT_SEARCH_LIMIT) || 10,
          maxLimit: parseInt(process.env.MAX_SEARCH_LIMIT) || 100,
          minConfidence: parseFloat(process.env.MIN_CONFIDENCE_SCORE) || 0.5,
          maxQueryLength: parseInt(process.env.MAX_QUERY_LENGTH) || 1000,
          chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
          chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200
        },

        // Cache
        cache: {
          enabled: process.env.CACHE_ENABLED !== 'false',
          ttl: parseInt(process.env.CACHE_TTL_SECONDS) || 300,
          maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
        },

        // Monitoring
        monitoring: {
          enabled: process.env.METRICS_ENABLED !== 'false',
          interval: parseInt(process.env.METRICS_INTERVAL_SECONDS) || 10,
          healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS) || 30000,
          serviceTimeout: parseInt(process.env.SERVICE_TIMEOUT_MS) || 5000
        },

        // Security
        security: {
          apiKeyRequired: process.env.API_KEY_REQUIRED !== 'false',
          corsEnabled: process.env.CORS_ENABLED !== 'false',
          rateLimitingEnabled: process.env.RATE_LIMITING_ENABLED !== 'false',
          sslEnabled: process.env.SSL_ENABLED === 'true'
        },

        // Feature Flags
        features: {
          expertAdvisor: process.env.EXPERT_ADVISOR_ENABLED === 'true',
          advancedSearch: process.env.ADVANCED_SEARCH_ENABLED !== 'false',
          realTimeCollaboration: process.env.REAL_TIME_COLLABORATION === 'true',
          autoReindexing: process.env.AUTO_REINDEXING !== 'false'
        },

        // Ngrok
        ngrok: {
          enabled: process.env.NGROK_ENABLED === 'true',
          authToken: process.env.NGROK_AUTH_TOKEN,
          backendSubdomain: process.env.NGROK_BACKEND_SUBDOMAIN,
          frontendSubdomain: process.env.NGROK_FRONTEND_SUBDOMAIN
        }
      };

      this.loaded = true;
      console.log('✅ ROME configuration loaded from artifact/.env');
      return this.config;

    } catch (error) {
      console.error('❌ Failed to load ROME configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific configuration section
   */
  get(section) {
    if (!this.loaded) this.load();
    return this.config[section];
  }

  /**
   * Get all configuration
   */
  getAll() {
    if (!this.loaded) this.load();
    return this.config;
  }

  /**
   * Check if a service is configured
   */
  isServiceConfigured(serviceName) {
    const services = this.get('services');
    return services && services[serviceName] && services[serviceName].url;
  }

  /**
   * Get service URL by name
   */
  getServiceUrl(serviceName) {
    const services = this.get('services');
    return services?.[serviceName]?.url;
  }

  /**
   * Validate configuration
   */
  validate() {
    const required = [
      'ROME_API_KEY',
      'MCP_SERVER_PORT',
      'WEAVIATE_PORT'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    return true;
  }
}

// Export singleton instance
const romeConfig = new RomeConfig();

module.exports = {
  RomeConfig,
  config: romeConfig,
  load: () => romeConfig.load(),
  get: (section) => romeConfig.get(section),
  getAll: () => romeConfig.getAll(),
  isServiceConfigured: (service) => romeConfig.isServiceConfigured(service),
  getServiceUrl: (service) => romeConfig.getServiceUrl(service),
  validate: () => romeConfig.validate()
};