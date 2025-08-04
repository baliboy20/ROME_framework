// =================================
// PM2 ECOSYSTEM CONFIGURATION
// =================================
// Production process management for Medium Flutter Extractor Backend

export default {
  apps: [
    {
      // Main application
      name: 'mfe-backend',
      script: 'dist/index.js',
      cwd: '/app',
      
      // Process management
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      
      // Performance & Memory
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
      node_args: '--max-old-space-size=2048',
      
      // Restart behavior
      autorestart: true,
      watch: false, // Don't watch in production
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'debug'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      
      // Logging
      log_file: '/app/logs/combined.log',
      out_file: '/app/logs/out.log',
      error_file: '/app/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Process title
      instance_var: 'INSTANCE_ID',
      
      // Graceful shutdown
      shutdown_with_message: true
    },
    
    // Background worker for scraping tasks (optional)
    {
      name: 'mfe-scraper-worker',
      script: 'dist/workers/scraper.js',
      cwd: '/app',
      
      // Single instance for worker
      instances: 1,
      exec_mode: 'fork',
      
      // Memory management
      max_memory_restart: '2G',
      
      // Restart behavior
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'scraper',
        LOG_LEVEL: 'info'
      },
      
      // Logging
      log_file: '/app/logs/scraper-worker.log',
      out_file: '/app/logs/scraper-out.log',
      error_file: '/app/logs/scraper-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Only start if worker script exists
      ignore_watch: ['node_modules', 'logs'],
      
      // Cron restart (restart daily at 2 AM)
      cron_restart: '0 2 * * *'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1', 'production-server-2'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/medium-flutter-extractor.git',
      path: '/var/www/mfe-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'ls -la'
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/medium-flutter-extractor.git',
      path: '/var/www/mfe-backend-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};