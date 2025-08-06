const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import database configuration
const databaseConfig = require('./config/database');

// Import Swagger documentation
const { setupSwagger } = require('./config/swagger');

// Import error handling middleware
const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const blogRoutes = require('./routes/blogRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Connect to database
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_mgmt';
    await databaseConfig.connect(mongoUri);
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    process.exit(1);
  }
};

// Initialize database connection
connectDatabase();

// Setup Swagger documentation
setupSwagger(app);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   description: Current environment
 */

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API information and available endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project Management API v1.0
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: active
 *                 database:
 *                   type: string
 *                   description: Database connection status  
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     projects:
 *                       type: string
 *                       example: /api/v1/projects
 *                     tasks:
 *                       type: string
 *                       example: /api/v1/tasks
 *                     blogs:
 *                       type: string
 *                       example: /api/v1/blogs
 *                     files:
 *                       type: string
 *                       example: /api/v1/files
 *                     health:
 *                       type: string
 *                       example: /health
 */

// API routes
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Project Management API v1.0',
    version: '1.0.0',
    status: 'active',
    database: databaseConfig.getConnectionStatus(),
    endpoints: {
      projects: '/api/v1/projects',
      tasks: '/api/v1/tasks',
      blogs: '/api/v1/blogs',
      files: '/api/v1/files',
      health: '/health',
      docs: '/api/docs'
    }
  });
});

// Mount routes
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/files', fileRoutes);

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8090;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;