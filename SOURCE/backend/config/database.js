const mongoose = require('mongoose');

class DatabaseConfig {
  constructor() {
    this.isConnected = false;
    this.connectionOptions = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    };
  }

  /**
   * Connect to MongoDB
   * @param {string} connectionString - MongoDB connection string
   * @returns {Promise<void>}
   */
  async connect(connectionString) {
    try {
      if (this.isConnected) {
        console.log('Already connected to MongoDB');
        return;
      }

      console.log('Connecting to MongoDB...');
      await mongoose.connect(connectionString, this.connectionOptions);
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      
      // Handle connection events
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (!this.isConnected) {
        console.log('Not connected to MongoDB');
        return;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
      
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return states[mongoose.connection.readyState] || 'unknown';
  }

  /**
   * Check if database is connected
   * @returns {boolean}
   */
  isDbConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get database connection info
   * @returns {object} Connection info
   */
  getConnectionInfo() {
    const connection = mongoose.connection;
    return {
      status: this.getConnectionStatus(),
      host: connection.host,
      port: connection.port,
      name: connection.name,
      readyState: connection.readyState
    };
  }

  /**
   * Setup event handlers for connection events
   * @private
   */
  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📤 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Health check for database connection
   * @returns {Promise<object>} Health check result
   */
  async healthCheck() {
    try {
      const isConnected = this.isDbConnected();
      
      if (!isConnected) {
        return {
          status: 'unhealthy',
          message: 'Database not connected',
          timestamp: new Date().toISOString()
        };
      }

      // Test database operation
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        message: 'Database connection is working',
        connectionInfo: this.getConnectionInfo(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<object>} Database stats
   */
  async getStats() {
    try {
      if (!this.isDbConnected()) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
        objects: stats.objects
      };
      
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;