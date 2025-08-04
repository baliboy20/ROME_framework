# Medium Flutter Link Extractor - Production Setup

This system extracts and manages Medium articles from email digests without requiring OAuth authentication.

## System Architecture

- **Backend**: Node.js/Express API server (port 3000)
- **Frontend**: Flutter Web application
- **Database**: MongoDB for article storage
- **Real-time**: WebSocket for progress tracking

## Prerequisites

- Node.js 20.11.0+
- Flutter 3.19.0+
- MongoDB 6.0+
- Python 3 (for serving production build)

## Quick Start

### 1. Start MongoDB
```bash
# If using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6

# Or if MongoDB is installed locally
mongod --dbpath /path/to/data
```

### 2. Start Backend Server
```bash
cd SOURCE/backend
npm install
npm run dev
```

The backend will start at http://localhost:3000

### 3. Run Frontend (Development)
```bash
cd SOURCE/frontend
flutter run -d web-server --web-port=8080
```

Access the app at http://localhost:8080

### 4. Build Frontend (Production)
```bash
cd SOURCE/frontend
./build_web.sh

# Serve production build
cd build/web
python3 -m http.server 8080
```

## Features

- **Email Filtering**: Filter emails by date range and keywords
- **Article Extraction**: Extract links from Medium digest emails
- **Content Scraping**: Fetch full article content with Puppeteer
- **Markdown Viewer**: View article content with syntax highlighting
- **Real-time Progress**: Track scraping progress via WebSocket
- **Batch Processing**: Process multiple articles concurrently

## API Endpoints

The backend exposes these endpoints (no authentication required):

- `POST /api/emails/fetch` - Fetch emails based on filter criteria
- `GET /api/emails` - List all processed emails
- `POST /api/scraping/batch` - Start batch article scraping
- `GET /api/articles` - List all articles with pagination
- `GET /api/articles/:id/content` - Get article markdown content

## Configuration

### Backend Environment Variables
Create `.env` file in `SOURCE/backend/`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/medium-extractor
NODE_ENV=development
```

### Frontend Configuration
The frontend connects to `http://localhost:3000` by default. To change:
```bash
flutter run -d web-server --dart-define=API_BASE_URL=http://your-api-url
```

## Production Deployment

### Backend
1. Set production environment variables
2. Build TypeScript: `npm run build`
3. Start with PM2: `npm run start:pm2`

### Frontend
1. Build production bundle: `flutter build web --release`
2. Deploy `build/web/` directory to your web server
3. Configure CORS in backend for your domain

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongosh` to test connection
- Verify port 3000 is available: `lsof -i :3000`
- Check logs: `npm run dev` shows detailed errors

### Frontend connection issues
- Verify backend is running at http://localhost:3000
- Check browser console for CORS errors
- Ensure WebSocket connection at ws://localhost:3000

### Email fetching returns empty
- The system expects actual Gmail integration
- For testing, you can modify the backend to return mock data

## Architecture Notes

- **No Authentication**: System runs without OAuth for simplicity
- **Local Development**: Optimized for local development and testing
- **Production Ready**: Can be deployed with proper environment configuration
- **Scalable**: Queue-based scraping supports concurrent processing