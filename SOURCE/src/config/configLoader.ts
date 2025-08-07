/**
 * Configuration Loader Implementation
 * DevOps Engineer: Luc
 * 
 * Loads and validates environment-specific configurations
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

export interface WeaviateConfig {
  url: string;
  timeout: number;
  retries: number;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

export interface LoggingConfig {
  level: string;
  format: string;
  filename: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

export interface ProcessingConfig {
  chunkSize: number;
  overlap: number;
  maxFileSize: string;
}

export interface HealthConfig {
  timeout: number;
  interval: number;
}

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: boolean | string;
    credentials: boolean;
  };
}

export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    endpoint: string;
  };
  traces: {
    enabled: boolean;
    sampling: number;
  };
}

export interface AppConfig {
  server: ServerConfig;
  weaviate: WeaviateConfig;
  openai: OpenAIConfig;
  logging: LoggingConfig;
  cache: CacheConfig;
  processing: ProcessingConfig;
  health: HealthConfig;
  security?: SecurityConfig;
  monitoring?: MonitoringConfig;
}

export class ConfigLoader {
  private config: AppConfig | null = null;
  private readonly environment: string;
  private readonly configDir: string;

  constructor(configDir?: string) {
    this.environment = process.env.NODE_ENV || 'development';
    this.configDir = configDir || join(process.cwd(), 'infrastructure', 'config');
  }

  public load(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // Load environment-specific configuration
    const configPath = join(this.configDir, `${this.environment}.json`);
    
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
      const configContent = readFileSync(configPath, 'utf8');
      const rawConfig = JSON.parse(configContent);
      
      // Interpolate environment variables
      const interpolatedConfig = this.interpolateEnvironmentVariables(rawConfig);
      
      // Validate configuration
      this.config = this.validateConfig(interpolatedConfig);
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private interpolateEnvironmentVariables(obj: any): any {
    if (typeof obj === 'string') {
      // Replace ${VAR_NAME} patterns with environment variables
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        const envValue = process.env[varName];
        if (envValue === undefined) {
          throw new Error(`Environment variable ${varName} is not defined`);
        }
        return envValue;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateEnvironmentVariables(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateEnvironmentVariables(value);
      }
      return result;
    }

    return obj;
  }

  private validateConfig(config: any): AppConfig {
    // Validate required sections
    const requiredSections = ['server', 'weaviate', 'openai', 'logging', 'cache', 'processing', 'health'];
    
    for (const section of requiredSections) {
      if (!config[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }

    // Validate server configuration
    this.validateServerConfig(config.server);
    
    // Validate Weaviate configuration
    this.validateWeaviateConfig(config.weaviate);
    
    // Validate OpenAI configuration
    this.validateOpenAIConfig(config.openai);

    // Validate logging configuration
    this.validateLoggingConfig(config.logging);

    // Validate cache configuration
    this.validateCacheConfig(config.cache);

    // Validate processing configuration
    this.validateProcessingConfig(config.processing);

    // Validate health configuration
    this.validateHealthConfig(config.health);

    return config as AppConfig;
  }

  private validateServerConfig(server: any): void {
    if (typeof server.port !== 'number' || server.port < 1 || server.port > 65535) {
      throw new Error('Invalid server port: must be a number between 1 and 65535');
    }

    if (typeof server.host !== 'string' || server.host.trim() === '') {
      throw new Error('Invalid server host: must be a non-empty string');
    }

    if (typeof server.environment !== 'string') {
      throw new Error('Invalid server environment: must be a string');
    }
  }

  private validateWeaviateConfig(weaviate: any): void {
    if (typeof weaviate.url !== 'string' || !weaviate.url.startsWith('http')) {
      throw new Error('Invalid Weaviate URL: must be a valid HTTP/HTTPS URL');
    }

    if (typeof weaviate.timeout !== 'number' || weaviate.timeout < 1000) {
      throw new Error('Invalid Weaviate timeout: must be a number >= 1000ms');
    }

    if (typeof weaviate.retries !== 'number' || weaviate.retries < 0) {
      throw new Error('Invalid Weaviate retries: must be a non-negative number');
    }
  }

  private validateOpenAIConfig(openai: any): void {
    if (typeof openai.apiKey !== 'string' || !openai.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key: must be a string starting with "sk-"');
    }

    if (typeof openai.model !== 'string' || openai.model.trim() === '') {
      throw new Error('Invalid OpenAI model: must be a non-empty string');
    }

    if (typeof openai.timeout !== 'number' || openai.timeout < 1000) {
      throw new Error('Invalid OpenAI timeout: must be a number >= 1000ms');
    }
  }

  private validateLoggingConfig(logging: any): void {
    const validLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
    if (!validLevels.includes(logging.level)) {
      throw new Error(`Invalid logging level: must be one of ${validLevels.join(', ')}`);
    }

    const validFormats = ['json', 'simple', 'dev'];
    if (!validFormats.includes(logging.format)) {
      throw new Error(`Invalid logging format: must be one of ${validFormats.join(', ')}`);
    }
  }

  private validateCacheConfig(cache: any): void {
    if (typeof cache.enabled !== 'boolean') {
      throw new Error('Invalid cache enabled: must be a boolean');
    }

    if (cache.enabled) {
      if (typeof cache.ttl !== 'number' || cache.ttl < 0) {
        throw new Error('Invalid cache TTL: must be a non-negative number');
      }

      if (typeof cache.maxSize !== 'number' || cache.maxSize < 1) {
        throw new Error('Invalid cache maxSize: must be a positive number');
      }
    }
  }

  private validateProcessingConfig(processing: any): void {
    if (typeof processing.chunkSize !== 'number' || processing.chunkSize < 100) {
      throw new Error('Invalid processing chunkSize: must be a number >= 100');
    }

    if (typeof processing.overlap !== 'number' || processing.overlap < 0) {
      throw new Error('Invalid processing overlap: must be a non-negative number');
    }

    if (typeof processing.maxFileSize !== 'string') {
      throw new Error('Invalid processing maxFileSize: must be a string');
    }
  }

  private validateHealthConfig(health: any): void {
    if (typeof health.timeout !== 'number' || health.timeout < 1000) {
      throw new Error('Invalid health timeout: must be a number >= 1000ms');
    }

    if (typeof health.interval !== 'number' || health.interval < 5000) {
      throw new Error('Invalid health interval: must be a number >= 5000ms');
    }
  }

  public reload(): AppConfig {
    this.config = null;
    return this.load();
  }

  public get(): AppConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  public getEnvironment(): string {
    return this.environment;
  }
}

// Singleton instance
let configInstance: ConfigLoader | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = new ConfigLoader();
  }
  return configInstance.get();
}

export function reloadConfig(): AppConfig {
  if (!configInstance) {
    configInstance = new ConfigLoader();
  }
  return configInstance.reload();
}