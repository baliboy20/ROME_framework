# Revised System Requirements Specification (SRS)
## Medium Flutter Link Extractor - Technical Implementation Guide

**Document Version**: 2.0 (Post Gap Analysis)  
**Date**: 2025-07-28  
**Status**: FINAL - Development Ready  
**PMA**: Technical Architecture Approved

---

## Document Revision Summary

### Key Changes from Original SRS
🔴 **RESOLVED**: ESM/CommonJS interop strategy defined with esbuild  
🔴 **CLARIFIED**: Flutter Web as primary target (desktop secondary)  
🔴 **ENHANCED**: MongoDB schema with proper indexing strategy  
🔴 **ADDED**: Real-time progress tracking via WebSocket  
🔴 **SPECIFIED**: Content extraction algorithms for Medium articles

---

## 1. System Architecture Overview

### 1.1 Technology Stack - FINALIZED

#### Frontend Stack
- **Framework**: Flutter SDK 3.19.0+ (Stable Channel)
- **Target Platforms**: Web (primary), Desktop (future)
- **State Management**: Riverpod 2.5.0 with code generation
- **HTTP Client**: Dio 5.4.0 with Retrofit 4.1.0
- **UI Framework**: Material Design 3 components
- **Build Tool**: Flutter Web Compiler with CanvasKit renderer

#### Backend Stack
- **Runtime**: Node.js 20.11.0 LTS (with ESM support)
- **Framework**: Express 4.19.2
- **Module System**: ESM with CommonJS interop via esbuild
- **Database Driver**: MongoDB native driver 6.5.0
- **Authentication**: Google APIs (googleapis 134.0.0)
- **Web Scraping**: Puppeteer 22.6.0 + Cheerio 1.0.0-rc.12
- **Process Management**: PM2 5.3.0

#### Development Tools
- **Build System**: esbuild 0.20.0 (ESM bundling)
- **TypeScript**: 5.4.0 with ESM configuration
- **Testing**: Jest 29.7.0 with ESM support
- **Linting**: ESLint 8.57.0 with TypeScript rules

---

## 2. Module System Architecture - RESOLVED

### 2.1 ESM/CommonJS Interop Strategy

#### Root package.json Configuration
```json
{
  "name": "medium-flutter-extractor",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.11.0"
  },
  "workspaces": ["backend", "frontend"]
}
```

#### Backend ESM Configuration
```json
{
  "name": "mfe-backend",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && node build.js",
    "dev": "tsx watch --esm src/index.ts",
    "start": "node dist/index.js"
  }
}
```

#### TypeScript Configuration (ESM)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

### 2.2 Import Resolution Strategy

#### ESM-First Imports
```typescript
// Native ESM imports
import { MongoClient } from 'mongodb';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

// CommonJS with default import
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Google APIs (CommonJS)
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
```

#### Build Configuration (esbuild)
```javascript
// build.js
import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
    `
  }
});
```

---

## 3. Database Design - ENHANCED

### 3.1 MongoDB Schema Design

#### Articles Collection
```typescript
interface Article {
  _id: ObjectId;
  title: string;
  url: string;
  urlHash: string;           // NEW: SHA-256 for deduplication
  content: string;           // Full Markdown content
  rawHtml?: string;          // NEW: Original HTML (optional)
  
  // Metadata
  emailDate: Date;
  scrapedAt: Date;
  lastUpdated: Date;         // NEW: For tracking changes
  wordCount: number;
  readingTime: string;       // "5 min read"
  
  // Author information
  author?: {
    name: string;
    url?: string;
    avatar?: string;
  };
  
  // Categorization
  keywords: string[];        // Extracted keywords
  tags: string[];           // User-defined tags
  category: 'flutter' | 'dart' | 'mobile' | 'web' | 'general';
  
  // Source tracking
  sourceEmail: {
    id: string;              // Gmail message ID
    subject: string;
    date: Date;
  };
  
  // File system
  filePath: string;          // Relative path in storage
  
  // Status
  status: 'pending' | 'scraped' | 'failed' | 'archived';
  scrapeAttempts: number;    // NEW: Retry tracking
  lastError?: string;        // NEW: Error tracking
}
```

#### Email Digest Collection
```typescript
interface EmailDigest {
  _id: ObjectId;
  messageId: string;         // Gmail message ID
  subject: string;
  date: Date;
  processedAt: Date;
  
  // Links found
  linksFound: number;
  flutterLinks: string[];
  allLinks: string[];
  
  // Processing status
  status: 'discovered' | 'processed' | 'failed';
  articles: ObjectId[];      // References to Article documents
}
```

### 3.2 Database Indexes - OPTIMIZED

```javascript
// Performance indexes
db.articles.createIndex({ "urlHash": 1 }, { unique: true });
db.articles.createIndex({ "emailDate": -1 });
db.articles.createIndex({ "scrapedAt": -1 });
db.articles.createIndex({ "status": 1, "scrapeAttempts": 1 });

// Search indexes
db.articles.createIndex({ "title": "text", "content": "text", "keywords": "text" });
db.articles.createIndex({ "tags": 1 });
db.articles.createIndex({ "category": 1 });
db.articles.createIndex({ "author.name": 1 });

// Compound indexes for common queries
db.articles.createIndex({ "status": 1, "emailDate": -1 });
db.articles.createIndex({ "category": 1, "emailDate": -1 });

// Email digest indexes
db.emailDigests.createIndex({ "messageId": 1 }, { unique: true });
db.emailDigests.createIndex({ "date": -1 });
db.emailDigests.createIndex({ "status": 1 });
```

---

## 4. Backend Services Architecture

### 4.1 Gmail Service Implementation

```typescript
// src/services/GmailService.ts
export class GmailService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;
  
  async initialize(): Promise<void> {
    const credentials = await this.loadCredentials();
    this.auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uris[0]
    );
    
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }
  
  async fetchDigests(filter: EmailFilter): Promise<gmail_v1.Schema$Message[]> {
    const query = this.buildQuery(filter);
    
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });
    
    return this.fetchFullMessages(response.data.messages || []);
  }
  
  private buildQuery(filter: EmailFilter): string {
    const parts = [
      `subject:"${filter.subject}"`,
      `after:${Math.floor(filter.dateRange.start.getTime() / 1000)}`,
      `before:${Math.floor(filter.dateRange.end.getTime() / 1000)}`
    ];
    
    if (filter.keywords.length > 0) {
      parts.push(`(${filter.keywords.map(k => `"${k}"`).join(' OR ')})`);
    }
    
    return parts.join(' ');
  }
}
```

### 4.2 Content Scraping Service - ENHANCED

```typescript
// src/services/ScraperService.ts
export class ScraperService {
  private browser: Browser | null = null;
  private queue: PQueue;
  
  constructor() {
    this.queue = new PQueue({ 
      concurrency: 5,
      interval: 1000,
      intervalCap: 10
    });
  }
  
  async scrapeArticle(url: string): Promise<ScrapedContent> {
    return this.queue.add(async () => {
      const page = await this.browser!.newPage();
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Medium-specific content extraction
        const content = await page.evaluate(() => {
          // Remove unwanted elements
          const unwanted = document.querySelectorAll(
            'nav, header, footer, .sidebar, .ad, [data-ad]'
          );
          unwanted.forEach(el => el.remove());
          
          // Get main article content
          const article = document.querySelector('article') || 
                         document.querySelector('[data-testid="storyContent"]') ||
                         document.querySelector('main');
          
          if (!article) throw new Error('Article content not found');
          
          // Extract metadata
          const title = document.querySelector('h1')?.textContent || '';
          const author = document.querySelector('[data-testid="authorName"]')?.textContent || '';
          const publishDate = document.querySelector('time')?.getAttribute('datetime') || '';
          
          return {
            html: article.innerHTML,
            title: title.trim(),
            author: author.trim(),
            publishDate: publishDate,
            wordCount: article.textContent?.split(/\s+/).length || 0
          };
        });
        
        // Convert to Markdown
        const turndown = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bulletListMarker: '-'
        });
        
        const markdown = turndown.turndown(content.html);
        
        return {
          ...content,
          markdown,
          scrapedAt: new Date(),
          readingTime: this.calculateReadingTime(content.wordCount)
        };
        
      } finally {
        await page.close();
      }
    });
  }
  
  private calculateReadingTime(wordCount: number): string {
    const wpm = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wpm);
    return `${minutes} min read`;
  }
}
```

### 4.3 Real-time Progress Tracking

```typescript
// src/services/ProgressService.ts
export class ProgressService {
  private io: Server;
  private progress: Map<string, BatchProgress> = new Map();
  
  constructor(server: any) {
    this.io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL }
    });
  }
  
  startBatch(batchId: string, totalUrls: number): void {
    this.progress.set(batchId, {
      id: batchId,
      total: totalUrls,
      completed: 0,
      failed: 0,
      status: 'running',
      startTime: new Date(),
      results: []
    });
    
    this.broadcast(batchId);
  }
  
  updateProgress(batchId: string, result: ScrapedContent | Error): void {
    const batch = this.progress.get(batchId);
    if (!batch) return;
    
    if (result instanceof Error) {
      batch.failed++;
    } else {
      batch.completed++;
      batch.results.push(result);
    }
    
    if (batch.completed + batch.failed >= batch.total) {
      batch.status = 'completed';
      batch.endTime = new Date();
    }
    
    this.broadcast(batchId);
  }
  
  private broadcast(batchId: string): void {
    const batch = this.progress.get(batchId);
    this.io.emit(`progress:${batchId}`, batch);
  }
}
```

---

## 5. Frontend Architecture - FLUTTER WEB

### 5.1 Project Structure

```
frontend/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── theme/
│   │   └── utils/
│   ├── data/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/
│   ├── presentation/
│   │   ├── pages/
│   │   ├── widgets/
│   │   └── providers/
│   └── shared/
│       ├── components/
│       └── extensions/
├── web/
├── test/
└── pubspec.yaml
```

### 5.2 State Management with Riverpod

```dart
// lib/presentation/providers/email_provider.dart
@riverpod
class EmailNotifier extends _$EmailNotifier {
  @override
  Future<List<EmailDigest>> build() async {
    return [];
  }
  
  Future<void> fetchEmails(EmailFilter filter) async {
    state = const AsyncValue.loading();
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final emails = await apiService.fetchEmails(filter);
      state = AsyncValue.data(emails);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

// lib/presentation/providers/scraping_provider.dart
@riverpod
class ScrapingNotifier extends _$ScrapingNotifier {
  @override
  ScrapingState build() {
    return const ScrapingState.idle();
  }
  
  Future<void> scrapeUrls(List<String> urls) async {
    state = ScrapingState.loading(total: urls.length);
    
    final apiService = ref.read(apiServiceProvider);
    final batchId = await apiService.startScraping(urls);
    
    // Listen to WebSocket progress
    final socketService = ref.read(socketServiceProvider);
    socketService.listenToProgress(batchId, (progress) {
      state = ScrapingState.loading(
        total: progress.total,
        completed: progress.completed,
        failed: progress.failed,
      );
    });
  }
}
```

### 5.3 UI Components

```dart
// lib/presentation/widgets/article_table.dart
class ArticleTable extends ConsumerWidget {
  const ArticleTable({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articles = ref.watch(articlesProvider);
    
    return articles.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorWidget(error),
      data: (articleList) => DataTable2(
        columnSpacing: 12,
        horizontalMargin: 12,
        minWidth: 800,
        columns: const [
          DataColumn2(label: Text('Select'), fixedWidth: 60),
          DataColumn2(label: Text('Title'), size: ColumnSize.L),
          DataColumn2(label: Text('Author'), size: ColumnSize.S),
          DataColumn2(label: Text('Date'), size: ColumnSize.S),
          DataColumn2(label: Text('Status'), fixedWidth: 100),
        ],
        rows: articleList.map((article) => DataRow2(
          cells: [
            DataCell(Checkbox(
              value: ref.watch(selectedArticlesProvider).contains(article.id),
              onChanged: (selected) => _toggleSelection(ref, article.id),
            )),
            DataCell(Text(article.title)),
            DataCell(Text(article.author ?? 'Unknown')),
            DataCell(Text(_formatDate(article.emailDate))),
            DataCell(_buildStatusChip(article.status)),
          ],
        )).toList(),
      ),
    );
  }
}
```

---

## 6. API Design - RESTFUL WITH WEBSOCKETS

### 6.1 RESTful Endpoints

```typescript
// Authentication
POST   /api/auth/google/init     // Start OAuth flow
GET    /api/auth/google/callback // Handle OAuth callback
POST   /api/auth/refresh         // Refresh access token
DELETE /api/auth/logout          // Revoke tokens

// Email Management
POST   /api/emails/fetch         // Fetch emails with filter
GET    /api/emails               // List processed emails
GET    /api/emails/:id           // Get specific email
GET    /api/emails/:id/links     // Get links from email

// Article Scraping
POST   /api/scraping/batch       // Start batch scraping
GET    /api/scraping/batch/:id   // Get batch status
DELETE /api/scraping/batch/:id   // Cancel batch

// Article Management
GET    /api/articles             // List articles (paginated)
POST   /api/articles             // Create article
GET    /api/articles/:id         // Get specific article
PUT    /api/articles/:id         // Update article
DELETE /api/articles/:id         // Delete article
GET    /api/articles/:id/content // Get markdown content

// File Operations
GET    /api/files/articles       // List article files
GET    /api/files/articles/:path // Download article file
POST   /api/files/export         // Export articles (ZIP)
```

### 6.2 WebSocket Events

```typescript
// Progress tracking
'scraping:started'      // Batch scraping started
'scraping:progress'     // Progress update
'scraping:completed'    // Batch completed
'scraping:error'        // Scraping error

// Real-time updates
'article:created'       // New article saved
'article:updated'       // Article modified
'email:processed'       // New email digest processed
```

---

## 7. Deployment Architecture

### 7.1 Docker Configuration

```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
COPY credentials ./credentials
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```dockerfile
# Frontend Dockerfile
FROM cirrusci/flutter:stable AS builder
WORKDIR /app
COPY pubspec.* ./
RUN flutter pub get
COPY . .
RUN flutter build web --release

FROM nginx:alpine
COPY --from=builder /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### 7.2 Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/medium_extractor
    volumes:
      - ./data:/app/data
      - ./credentials:/app/credentials
    depends_on:
      - mongo
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
      
  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=medium_extractor

volumes:
  mongo_data:
```

---

## 8. Testing Strategy - COMPREHENSIVE

### 8.1 Backend Testing

```json
// Jest configuration for ESM
{
  "preset": "ts-jest/presets/default-esm",
  "extensionsToTreatAsEsm": [".ts"],
  "globals": {
    "ts-jest": {
      "useESM": true
    }
  },
  "moduleNameMapper": {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  "testEnvironment": "node",
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### 8.2 Flutter Testing

```dart
// test/widget_test.dart
void main() {
  group('ArticleTable Widget Tests', () {
    testWidgets('displays loading indicator when loading', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            articlesProvider.overrideWith((ref) => const AsyncValue.loading()),
          ],
          child: const MaterialApp(home: ArticleTable()),
        ),
      );
      
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
    
    testWidgets('displays articles when loaded', (tester) async {
      final mockArticles = [
        Article(id: '1', title: 'Test Article', /* ... */),
      ];
      
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            articlesProvider.overrideWith((ref) => AsyncValue.data(mockArticles)),
          ],
          child: const MaterialApp(home: ArticleTable()),
        ),
      );
      
      expect(find.text('Test Article'), findsOneWidget);
    });
  });
}
```

---

## 9. Performance Requirements - QUANTIFIED

### 9.1 Backend Performance
- **Response Time**: 95th percentile < 500ms for API calls
- **Throughput**: 100 requests/second sustained
- **Memory Usage**: < 512MB baseline, < 1GB during scraping
- **Database Queries**: < 100ms for indexed queries

### 9.2 Frontend Performance
- **Initial Load**: < 3 seconds to interactive
- **Navigation**: < 200ms between routes
- **Table Rendering**: < 500ms for 100 articles
- **Bundle Size**: < 2MB compressed

### 9.3 Scraping Performance
- **Single Article**: < 10 seconds average
- **Batch Processing**: 10 articles in < 30 seconds
- **Retry Logic**: Max 3 attempts with exponential backoff
- **Success Rate**: > 95% for accessible Medium articles

---

## 10. Security Implementation

### 10.1 Authentication Flow
```typescript
// OAuth2 PKCE implementation
const generateCodeChallenge = async (): Promise<{challenge: string, verifier: string}> => {
  const codeVerifier = crypto.randomBytes(128).toString('base64url');
  const challenge = crypto.createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { challenge, verifier: codeVerifier };
};
```

### 10.2 Rate Limiting
```typescript
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', rateLimiter);
```

---

## 11. Monitoring & Observability

### 11.1 Health Checks
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      gmail: await checkGmailApiHealth(),
      storage: await checkStorageHealth(),
    }
  };
  
  res.json(health);
});
```

### 11.2 Logging Strategy
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

---

## 12. Migration & Deployment Plan

### 12.1 Environment Setup Checklist
- [ ] Node.js 20.11.0 installed and verified
- [ ] MongoDB 6.5.0+ running and accessible
- [ ] Flutter 3.19.0+ with web support enabled
- [ ] Docker and Docker Compose installed
- [ ] Gmail API credentials configured
- [ ] Environment variables set
- [ ] SSL certificates for production

### 12.2 Deployment Steps
1. **Preparation Phase**
   - Set up MongoDB with indexes
   - Configure OAuth2 credentials
   - Prepare environment variables

2. **Backend Deployment**
   - Build backend with esbuild
   - Run database migrations
   - Start backend services
   - Verify health checks

3. **Frontend Deployment**
   - Build Flutter web application
   - Deploy to web server/CDN
   - Configure reverse proxy
   - Test end-to-end functionality

4. **Production Verification**
   - Run automated test suite
   - Verify OAuth flow
   - Test scraping functionality
   - Monitor performance metrics

---

**Document Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Ready**: ✅ All technical specifications defined  
**Next Phase**: Robot developer task execution  
**Review Date**: 2025-07-28 (Complete)