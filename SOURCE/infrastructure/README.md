# Infrastructure & Environment Setup

This directory contains all infrastructure configuration and environment setup files for the Medium Flutter Link Extractor project.

## 🏗️ Directory Structure

```
infrastructure/
├── configs/           # Configuration files
│   └── nginx.conf    # Nginx configuration for production
├── docker/           # Docker configurations (optional)
│   ├── backend.Dockerfile
│   ├── backend.dev.Dockerfile
│   ├── frontend.Dockerfile
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
└── scripts/          # Automation scripts
    ├── setup-env.js  # Environment setup automation
    └── health-check.js # System health verification
```

## 🚀 Quick Start

### 1. Run Environment Setup
```bash
# Automated setup (recommended)
npm run env:setup

# Or run directly
node infrastructure/scripts/setup-env.js
```

### 2. Configure Environment
```bash
# Copy and edit environment variables
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Start Development
```bash
# Start backend in development mode
npm run dev

# Or start all services
npm run dev:all
```

## 📋 Environment Requirements

### System Requirements
- **Node.js**: 20.11.0+ (ESM support required)
- **npm**: 10.0.0+
- **MongoDB**: 6.5.0+ (local or Atlas)
- **Flutter**: 3.19.0+ (for frontend development)

### Development Tools
- **TypeScript**: 5.4.0+ with ESM configuration
- **PM2**: For production process management
- **Git**: For version control and hooks

## 🔧 Configuration Files

### Package Management
- **`../package.json`**: Root workspace configuration with npm workspaces
- **`../backend/package.json`**: Backend-specific dependencies and scripts
- **`../backend/tsconfig.json`**: TypeScript configuration with ESM support
- **`../backend/build.js`**: esbuild configuration for production builds

### Environment Configuration
- **`../.env.example`**: Template with all required environment variables
- **`../.env`**: Your actual configuration (created from template)

### Process Management
- **`../backend/ecosystem.config.js`**: PM2 configuration for production deployment

## 🌍 Environment Variables

### Critical Variables (Required)
```bash
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/medium_extractor

# Gmail API
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Optional Variables
- **Scraping Configuration**: Puppeteer settings, concurrency limits
- **Performance Tuning**: Memory limits, cache settings
- **Monitoring**: Health check intervals, logging levels
- **Security**: Rate limiting, CORS origins

See `.env.example` for complete documentation.

## 🛠️ Available Scripts

### Root Level Scripts
```bash
npm run dev              # Start backend development server
npm run dev:all          # Start both backend and frontend
npm run build            # Build both backend and frontend
npm run test             # Run all tests
npm run lint             # Lint backend code
npm run health           # Check system health
npm run env:setup        # Run environment setup
```

### Backend Specific Scripts
```bash
cd backend
npm run dev              # Development server with hot reload
npm run build            # Production build with esbuild
npm run start            # Start production server
npm run start:pm2        # Start with PM2 process manager
npm run test             # Run Jest tests
npm run test:coverage    # Run tests with coverage report
npm run lint             # ESLint code checking
npm run typecheck        # TypeScript type checking
```

## 🏥 Health Checks

### Automated Health Check
```bash
npm run health
# Or directly
node infrastructure/scripts/health-check.js
```

### Manual Verification
```bash
# Check backend API
curl http://localhost:3000/health

# Check MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Check Node.js version
node --version  # Should be 20.11.0+
```

## 🔒 Security Considerations

### Environment Security
- Never commit `.env` files to version control
- Use different `.env` files for different environments
- Rotate API keys and secrets regularly
- Use strong, unique passwords for databases

### Production Security
- Enable HTTPS in production
- Configure proper CORS origins
- Set up rate limiting
- Use security headers (Helmet.js)
- Regular security audits: `npm audit`

## 📚 Development Workflow

### 1. Initial Setup
```bash
git clone <repository>
cd medium-flutter-extractor
npm run env:setup
```

### 2. Daily Development
```bash
npm run dev              # Start development
npm run health           # Check system status
npm run test             # Run tests before commits
```

### 3. Before Deployment
```bash
npm run build            # Build production assets
npm run test             # Run full test suite
npm audit                # Check for vulnerabilities
```

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" errors
- Ensure you're using Node.js 20.11.0+
- Check that `"type": "module"` is in package.json
- Verify import statements use `.js` extensions for local files

#### MongoDB connection issues
- Check MongoDB is running: `brew services start mongodb/brew/mongodb-community`
- Verify connection string in `.env`
- Test connection: `mongosh --eval "db.adminCommand('ping')"`

#### Port already in use
- Check what's using the port: `lsof -i :3000`
- Kill the process or change PORT in `.env`

#### Permission errors
- Check file permissions: `ls -la infrastructure/scripts/`
- Make scripts executable: `chmod +x infrastructure/scripts/*.js`

#### Environment variable issues
- Copy `.env.example` to `.env`
- Check for typos in variable names
- Ensure no spaces around `=` in `.env` file

### Debug Mode
Enable verbose logging:
```bash
DEBUG_MODE=true npm run dev
```

### Log Files
Check logs in:
- Development: Console output
- Production: `./logs/` directory
- PM2 logs: `pm2 logs mfe-backend`

## 🚀 Production Deployment

### Using PM2
```bash
npm run build
npm run start:pm2
```

### Using Docker (Optional)
```bash
npm run docker:build
npm run docker:prod
```

### Environment Setup
1. Create production `.env` file
2. Set `NODE_ENV=production`
3. Configure production MongoDB URI
4. Set up SSL certificates
5. Configure reverse proxy (Nginx)

## 📞 Support

### Getting Help
- Check this README first
- Review the troubleshooting section
- Check logs for error messages
- Test with health check script

### Resources
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [MongoDB Connection Guide](https://docs.mongodb.com/drivers/node/current/quick-start/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)

---

**Environment Setup completed by DevOps Engineer (Luc)**  
**Last Updated**: 2025-07-28  
**ROME Methodology**: 7-Step Protocol ✅