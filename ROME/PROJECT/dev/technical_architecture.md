# Technical Architecture Document
## Medium Flutter Link Extractor System

### System Overview
A web-based application that extracts Flutter-related articles from Medium Daily Digest emails, scrapes content, and stores in MongoDB for searchable reference.

## Architecture Principles
- **Modular Design**: Clear separation of concerns with minimal coupling
- **Scalability**: Horizontal scaling capability for scraping operations
- **Security First**: OAuth2, input validation, rate limiting
- **Fault Tolerance**: Graceful degradation, retry mechanisms
- **Performance**: Concurrent operations, efficient caching

## High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Flutter Web    │────▶│  Node.js Backend │────▶│    MongoDB      │
│  Application    │     │  (Express + ESM) │     │   Database      │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         
         │                       ├─────────────────┐       
         │                       │                 ▼       
         │                       │          ┌─────────────┐
         │                       │          │   Gmail     │
         │                       │          │    API      │
         │                       │          └─────────────┘
         │                       │                         
         │                       ├─────────────────┐       
         │                       │                 ▼       
         │                       │          ┌─────────────┐
         │                       │          │  Puppeteer  │
         │                       │          │  Scraping   │
         │                       │          └─────────────┘
         │                       │                         
         └───────────────────────┴──────────▶ File System 
                                              /data/articles
```

## Module Breakdown

### 1. Authentication Module (🟡 SEMI-BLOCKING)
**Purpose**: Handle Gmail OAuth2 authentication flow
**Dependencies**: None
**Interfaces**:
```typescript
interface AuthService {
  authenticate(): Promise<OAuth2Client>
  refreshToken(token: string): Promise<OAuth2Client>
  validateToken(token: string): Promise<boolean>
}
```

### 2. Email Service Module (🔴 BLOCKING)
**Purpose**: Fetch and parse Medium digest emails
**Dependencies**: Authentication Module
**Interfaces**:
```typescript
interface EmailService {
  fetchDigests(filter: EmailFilter): Promise<EmailDigest[]>
  extractLinks(digest: EmailDigest): Promise<ArticleLink[]>
}
```

### 3. Scraper Service Module (🟢 NON-BLOCKING)
**Purpose**: Extract article content from Medium URLs
**Dependencies**: None (can run independently)
**Interfaces**:
```typescript
interface ScraperService {
  scrapeUrl(url: string): Promise<ScrapedContent>
  scrapeMultiple(urls: string[], concurrency: number): AsyncGenerator<ScrapedContent>
}
```

### 4. Storage Service Module (🟡 SEMI-BLOCKING)
**Purpose**: Handle file operations and MongoDB persistence
**Dependencies**: Database configuration
**Interfaces**:
```typescript
interface StorageService {
  saveToFile(article: Article): Promise<string>
  saveToDatabase(article: Article): Promise<ObjectId>
  listArticles(query: ArticleQuery): Promise<Article[]>
}
```

### 5. API Gateway Module (🟡 SEMI-BLOCKING)
**Purpose**: RESTful API endpoints and middleware
**Dependencies**: All service modules
**Endpoints**:
- `POST /api/auth/login` - Initiate OAuth flow
- `POST /api/emails/fetch` - Query Gmail inbox
- `POST /api/links/scrape` - Batch scrape URLs
- `GET /api/articles` - List saved articles
- `POST /api/articles` - Save to MongoDB

### 6. Frontend Application Module
**Purpose**: User interface for email browsing and article management
**Components**:
- EmailFilterForm
- ArticleTable (with selection)
- ProgressIndicator
- MarkdownViewer
- BulkActionControls

## Data Flow

### 1. Email Fetch Flow
```
User Input → API Request → Auth Check → Gmail API → Parse Emails → Extract Links → Return to UI
```

### 2. Scraping Flow
```
Selected URLs → Queue Manager → Concurrent Scraper → Content Extraction → Markdown Conversion → File Save → UI Update
```

### 3. Database Persistence Flow
```
Saved File → Read Metadata → Create Article Document → MongoDB Insert → Index Update → Confirmation
```

## Technology Decisions

### Backend Stack
- **Runtime**: Node.js 20.11.0 LTS (ESM native support)
- **Framework**: Express 4.19.2 (with ESM configuration)
- **Database**: MongoDB 6.5.0 (native driver)
- **Scraping**: Puppeteer 22.6.0 (dynamic content)
- **HTML Parsing**: Cheerio 1.0.0-rc.12 (ESM compatible)

### Frontend Stack
- **Framework**: Flutter 3.19.0 (Web + Desktop)
- **State Management**: Riverpod 2.5.0
- **HTTP Client**: Dio 5.4.0
- **UI Components**: Material Design + Custom widgets

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Environment Management**: dotenv
- **Process Management**: PM2 (production)
- **Monitoring**: Built-in health checks

## Security Architecture

### Authentication
- OAuth2 with PKCE flow
- Refresh token rotation
- Secure credential storage

### API Security
- Helmet.js security headers
- CORS with origin validation
- Rate limiting per endpoint
- Input validation (Joi/Zod)

### Data Security
- MongoDB connection encryption
- File system permissions
- No credential logging
- Environment variable isolation

## Performance Optimizations

### Concurrency Control
- Maximum 5 concurrent scrapes
- Queue-based task management
- Resource pooling for Puppeteer

### Caching Strategy
- Gmail API response caching (15 min)
- Scraped content deduplication
- MongoDB query result caching

### Monitoring
- Request/response timing
- Scraping success rates
- API quota usage tracking
- Error rate monitoring

## Deployment Architecture

### Development Environment
```yaml
- Node.js local
- MongoDB local/Docker
- Hot reload enabled
- Debug logging
```

### Production Environment
```yaml
- Docker containers
- MongoDB Atlas/Self-hosted
- SSL/TLS enabled
- Production logging
```

## Error Handling Strategy

### Graceful Degradation
1. Gmail API failures → Show cached results
2. Scraping failures → Mark as failed, continue batch
3. Database failures → Queue for retry
4. Network failures → Exponential backoff

### User Feedback
- Clear error messages
- Progress indicators
- Retry options
- Fallback UI states

## Testing Architecture

### Unit Testing
- Service layer: 80% coverage
- Utility functions: 100% coverage
- Mock external dependencies

### Integration Testing
- API endpoint testing
- Database operation testing
- OAuth flow testing

### E2E Testing
- Critical user journeys
- Cross-browser testing
- Performance benchmarks

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Session storage in MongoDB
- Load balancer ready

### Vertical Scaling
- Puppeteer worker processes
- MongoDB connection pooling
- Caching layer (Redis ready)

## Module Interface Contracts

### Email Module → Scraper Module
```typescript
interface ScrapingRequest {
  urls: string[]
  priority: 'high' | 'normal' | 'low'
  metadata: EmailMetadata
}
```

### Scraper Module → Storage Module
```typescript
interface StorageRequest {
  content: string
  metadata: ArticleMetadata
  format: 'markdown' | 'html'
}
```

### Storage Module → API Module
```typescript
interface StorageResponse {
  id: ObjectId
  filePath: string
  status: 'saved' | 'failed'
}
```

This architecture ensures clean separation of concerns, scalability, and maintainability while meeting all business requirements.