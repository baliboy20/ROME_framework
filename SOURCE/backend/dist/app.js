import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { appConfig, isDevelopment } from '@/config/app.config.js';
import { dbConfig } from '@/config/database.config.js';
import authRoutes from '@/routes/auth.routes.js';
import emailRoutes from '@/routes/email.routes.js';
import scrapingRoutes from '@/routes/scraping.routes.js';
import articlesRoutes from '@/routes/articles.routes.js';
const app = express();
// Security middleware
app.use(helmet());
// CORS configuration
const corsOrigins = appConfig.corsOrigin.includes(',')
    ? appConfig.corsOrigin.split(',').map(origin => origin.trim())
    : appConfig.corsOrigin;
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const limiter = rateLimit({
    windowMs: appConfig.rateLimitWindowMs,
    max: appConfig.rateLimitMax,
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Session configuration
app.use(session({
    secret: appConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: dbConfig.uri,
        dbName: dbConfig.dbName,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: !isDevelopment(),
        httpOnly: true,
        maxAge: appConfig.sessionMaxAge
    },
    name: 'mfe.session'
}));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: appConfig.version,
        environment: appConfig.nodeEnv
    });
});
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/articles', articlesRoutes);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({
        error: 'Server Error',
        message: isDevelopment() ? message : 'An error occurred',
        ...(isDevelopment() && { stack: error.stack })
    });
});
export default app;
//# sourceMappingURL=app.js.map