/**
 * MongoDB Connection Pool Manager
 * Medium Flutter Link Extractor - Database Connection Layer
 * 
 * @author Ashok (Data Architect)
 * @date 2025-07-28
 * @version 1.0.0
 * 
 * Provides optimized MongoDB connection pooling with:
 * - Connection lifecycle management
 * - Health monitoring
 * - Automatic reconnection
 * - Performance metrics
 * - Connection pool sizing based on load
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import EventEmitter from 'events';

/**
 * Connection Pool Configuration
 * Optimized for the Medium Link Extractor workload
 */
const DEFAULT_POOL_CONFIG = {
  // Connection limits
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
  
  // Timeouts (milliseconds)
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
  socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 30000,
  serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 10000,
  
  // Connection lifecycle
  maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 300000, // 5 minutes
  maxConnecting: parseInt(process.env.DB_MAX_CONNECTING) || 2,
  
  // Monitoring
  monitorCommands: process.env.NODE_ENV === 'development',
  heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY) || 10000,
  
  // Write concern
  writeConcern: {
    w: process.env.DB_WRITE_CONCERN || 'majority',
    wtimeout: parseInt(process.env.DB_WRITE_TIMEOUT) || 10000
  },
  
  // Read preference
  readPreference: process.env.DB_READ_PREFERENCE || 'primary',
  
  // Retry logic
  retryWrites: true,
  retryReads: true,
  
  // Server API version (for MongoDB Atlas)
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false, // Allow text indexes
    deprecationErrors: false
  }
};

/**
 * MongoDB Connection Pool Manager
 */
class ConnectionPoolManager extends EventEmitter {
  constructor(uri, databaseName, config = {}) {
    super();
    
    this.uri = uri;
    this.databaseName = databaseName;
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    
    // State management
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.isConnecting = false;
    
    // Metrics
    this.metrics = {
      connectionsCreated: 0,
      connectionsDestroyed: 0,
      commandsExecuted: 0,
      commandErrors: 0,
      connectionErrors: 0,
      averageResponseTime: 0,
      lastConnectedAt: null,
      uptime: 0
    };
    
    this.startTime = Date.now();
    
    // Health check interval
    this.healthCheckInterval = null;
    
    // Bind event handlers
    this._setupEventHandlers();
  }

  /**
   * Initialize connection pool
   */
  async connect() {
    if (this.isConnected) {
      return this.db;
    }

    if (this.isConnecting) {
      return this._waitForConnection();
    }

    this.isConnecting = true;
    this.emit('connecting');

    try {
      console.log('🔗 Initializing MongoDB connection pool...');
      
      // Create MongoDB client with optimized configuration
      this.client = new MongoClient(this.uri, this.config);
      
      // Connect with timeout
      await this.client.connect();
      
      // Get database reference
      this.db = this.client.db(this.databaseName);
      
      // Test connection
      await this.db.command({ ping: 1 });
      
      // Update state
      this.isConnected = true;
      this.isConnecting = false;
      this.metrics.lastConnectedAt = new Date();
      
      // Start health monitoring
      this._startHealthCheck();
      
      console.log(`✅ Connected to MongoDB: ${this.databaseName}`);
      console.log(`📊 Pool config: min=${this.config.minPoolSize}, max=${this.config.maxPoolSize}`);
      
      this.emit('connected', this.db);
      
      return this.db;
      
    } catch (error) {
      this.isConnecting = false;
      this.metrics.connectionErrors++;
      
      console.error('❌ MongoDB connection failed:', error.message);
      this.emit('error', error);
      
      throw error;
    }
  }

  /**
   * Get database instance (creates connection if needed)
   */
  async getDatabase() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.db;
  }

  /**
   * Get collection with automatic connection handling
   */
  async getCollection(name) {
    const database = await this.getDatabase();
    return database.collection(name);
  }

  /**
   * Execute database operation with connection management
   */
  async executeOperation(operation, retries = 3) {
    const startTime = Date.now();
    
    try {
      const database = await this.getDatabase();
      const result = await operation(database);
      
      // Update metrics
      this.metrics.commandsExecuted++;
      this._updateResponseTime(Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      this.metrics.commandErrors++;
      
      // Handle connection errors with retry
      if (this._isConnectionError(error) && retries > 0) {
        console.warn(`⚠️  Connection error, retrying... (${retries} attempts left)`);
        
        // Reset connection state
        this.isConnected = false;
        
        // Wait before retry
        await this._sleep(1000);
        
        return this.executeOperation(operation, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    const currentTime = Date.now();
    this.metrics.uptime = currentTime - this.startTime;
    
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      databaseName: this.databaseName,
      config: {
        minPoolSize: this.config.minPoolSize,
        maxPoolSize: this.config.maxPoolSize,
        maxIdleTimeMS: this.config.maxIdleTimeMS
      },
      uptime: this.metrics.uptime,
      uptimeHuman: this._formatUptime(this.metrics.uptime)
    };
  }

  /**
   * Health check for connection pool
   */
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'disconnected',
        error: 'Not connected to database'
      };
    }

    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      await this.db.command({ ping: 1 });
      
      // Test collection access
      const collections = await this.db.listCollections().toArray();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        collections: collections.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.client && this.isConnected) {
      try {
        console.log('🔌 Disconnecting from MongoDB...');
        await this.client.close();
        
        this.isConnected = false;
        this.client = null;
        this.db = null;
        
        console.log('✅ Disconnected from MongoDB');
        this.emit('disconnected');
        
      } catch (error) {
        console.error('❌ Error during disconnect:', error.message);
        this.emit('error', error);
      }
    }
  }

  /**
   * Setup event handlers for connection monitoring
   */
  _setupEventHandlers() {
    this.on('connecting', () => {
      console.log('🔄 Connecting to MongoDB...');
    });

    this.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    this.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error.message);
    });

    this.on('disconnected', () => {
      console.log('🔌 MongoDB connection closed');
    });
  }

  /**
   * Start periodic health checks
   */
  _startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        
        if (health.status === 'unhealthy') {
          console.warn('⚠️  Database health check failed:', health.error);
          this.emit('healthCheckFailed', health);
        }
        
      } catch (error) {
        console.error('❌ Health check error:', error.message);
      }
    }, this.config.heartbeatFrequencyMS);
  }

  /**
   * Wait for connection to complete
   */
  async _waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectTimeoutMS);

      this.once('connected', (db) => {
        clearTimeout(timeout);
        resolve(db);
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Update average response time metric
   */
  _updateResponseTime(responseTime) {
    const count = this.metrics.commandsExecuted;
    const currentAvg = this.metrics.averageResponseTime;
    
    this.metrics.averageResponseTime = ((currentAvg * (count - 1)) + responseTime) / count;
  }

  /**
   * Check if error is connection-related
   */
  _isConnectionError(error) {
    const connectionErrors = [
      'MongoNetworkError',
      'MongoServerSelectionError',
      'MongoTimeoutError',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    return connectionErrors.some(errorType => 
      error.name === errorType || error.message.includes(errorType)
    );
  }

  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format uptime in human-readable format
   */
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

/**
 * Singleton connection pool instance
 */
let connectionPool = null;

/**
 * Initialize global connection pool
 */
export function initializeConnectionPool(uri, databaseName, config = {}) {
  if (connectionPool) {
    console.warn('⚠️  Connection pool already initialized');
    return connectionPool;
  }

  connectionPool = new ConnectionPoolManager(uri, databaseName, config);
  return connectionPool;
}

/**
 * Get global connection pool instance
 */
export function getConnectionPool() {
  if (!connectionPool) {
    throw new Error('Connection pool not initialized. Call initializeConnectionPool() first.');
  }
  return connectionPool;
}

/**
 * Connect to database using global pool
 */
export async function connectToDatabase() {
  const pool = getConnectionPool();
  return pool.connect();
}

/**
 * Get database instance from global pool
 */
export async function getDatabase() {
  const pool = getConnectionPool();
  return pool.getDatabase();
}

/**
 * Get collection from global pool
 */
export async function getCollection(name) {
  const pool = getConnectionPool();
  return pool.getCollection(name);
}

/**
 * Execute operation with global pool
 */
export async function executeOperation(operation, retries = 3) {
  const pool = getConnectionPool();
  return pool.executeOperation(operation, retries);
}

/**
 * Get connection pool statistics
 */
export function getPoolStats() {
  const pool = getConnectionPool();
  return pool.getPoolStats();
}

/**
 * Perform health check
 */
export async function healthCheck() {
  const pool = getConnectionPool();
  return pool.healthCheck();
}

/**
 * Graceful shutdown of connection pool
 */
export async function shutdown() {
  if (connectionPool) {
    await connectionPool.disconnect();
    connectionPool = null;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

export {
  ConnectionPoolManager,
  DEFAULT_POOL_CONFIG
};

export default {
  initializeConnectionPool,
  getConnectionPool,
  connectToDatabase,
  getDatabase,
  getCollection,
  executeOperation,
  getPoolStats,
  healthCheck,
  shutdown,
  ConnectionPoolManager,
  DEFAULT_POOL_CONFIG
};