import dotenv from 'dotenv';
dotenv.config();
export const appConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'Medium Flutter Extractor Backend',
    version: process.env.APP_VERSION || '1.0.0',
    // CORS settings
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    // Session settings
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    // Security settings
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/app.log',
    // File storage
    dataPath: process.env.DATA_PATH || './data',
    articlesPath: process.env.ARTICLES_PATH || './data/articles',
    // Gmail API settings
    gmailBatchSize: parseInt(process.env.GMAIL_BATCH_SIZE || '100', 10),
    // Scraping settings
    maxConcurrentScrapes: parseInt(process.env.MAX_CONCURRENT_SCRAPES || '5', 10),
    scrapeTimeout: parseInt(process.env.SCRAPE_TIMEOUT || '30000', 10),
    scrapeRetries: parseInt(process.env.SCRAPE_RETRIES || '3', 10)
};
export const isDevelopment = () => appConfig.nodeEnv === 'development';
export const isProduction = () => appConfig.nodeEnv === 'production';
export const isTest = () => appConfig.nodeEnv === 'test';
//# sourceMappingURL=app.config.js.map