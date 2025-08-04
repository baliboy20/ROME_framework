# Revised Business Requirements Document (BRD)
## Medium Flutter Link Extractor - Post Gap Analysis

**Document Version**: 2.0 (Revised)  
**Date**: 2025-07-28  
**Status**: FINAL - Ready for Development  
**PMA**: Architecture Review Complete

---

## Executive Summary
Web application that automatically extracts Flutter-related articles from Medium Daily Digest emails, enables bulk content scraping, and stores articles in MongoDB for future reference. This revised BRD incorporates gap analysis findings and resolves technology conflicts.

## Key Decision Resolutions
🔴 **RESOLVED**: Frontend technology standardized to **Flutter Web** (not React)  
🔴 **RESOLVED**: ESM module system complexity accepted with esbuild bundling  
🔴 **CLARIFIED**: Smart content extraction rules defined for Medium articles

---

## Core Features (MVP) - REVISED

### 1. Email Processing ✅ UNCHANGED
- OAuth2 Gmail integration (read-only scope)
- Filter emails by: subject "Medium Daily Digest", date range, keywords
- Extract hyperlinks containing "flutter" (case-insensitive)

### 2. Link Management UI ✅ TECHNOLOGY UPDATED
- **Platform**: Flutter Web (Material Design)
- Sortable/filterable DataTable2: checkbox, title, URL, email date
- Bulk selection controls with intuitive UX
- **NEW**: Real-time scraping progress via WebSocket connection
- **NEW**: Desktop support capability (future enhancement)

### 3. Content Scraping ✅ ENHANCED SPECIFICATIONS
- Parallel scraping (max 5 concurrent)
- **DEFINED**: Smart content extraction rules:
  - Target Medium article containers: `article` tags
  - Remove navigation, ads, sidebar content
  - Preserve code blocks, images, and formatting
  - Extract author metadata when available
- Save as Markdown with **specified frontmatter**:
  ```markdown
  ---
  title: "Article Title"
  author: "Author Name"
  url: "https://medium.com/..."
  scraped_date: "2025-07-28"
  email_date: "2025-07-27"
  word_count: 1500
  reading_time: "6 min"
  tags: ["flutter", "mobile", "dart"]
  ---
  ```
- Retry logic with exponential backoff (3 attempts)

### 4. File Management ✅ CLARIFIED
- Server-side storage: `/data/articles/{yyyy-mm-dd}/`
- **NEW**: Duplicate detection by URL hash
- In-browser Markdown preview using flutter_markdown
- One-click MongoDB persistence with metadata indexing

---

## Technical Stack - FINALIZED

### Frontend (LOCKED IN)
- **Framework**: Flutter 3.19.0+ (Web primary, Desktop capable)
- **State Management**: Riverpod 2.5.0
- **HTTP Client**: Dio 5.4.0 with Retrofit
- **UI Library**: Material Design 3 components
- **Build Target**: Web-first, desktop-ready

### Backend (CONFIRMED)
- **Runtime**: Node.js 20.11.0 LTS
- **Framework**: Express 4.19.2 with ESM configuration
- **Module System**: ESM with CommonJS interop via esbuild
- **Database**: MongoDB 6.5.0 (native driver)
- **Libraries**: 
  - Gmail API client (googleapis 134.0.0)
  - Puppeteer 22.6.0 (dynamic content)
  - Cheerio 1.0.0-rc.12 (static parsing)
  - Marked 12.0.0 (Markdown conversion)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Environment**: dotenv configuration
- **Process Management**: PM2 (production)

---

## Enhanced Data Models

### EmailFilter (Updated)
```typescript
interface EmailFilter {
  dateRange: { start: Date; end: Date };
  keywords: string[];
  subjects: string[]; // NEW: Multiple subject patterns
}
```

### Article (Enhanced)
```typescript
interface Article {
  title: string;
  url: string;
  content: string;
  metadata: {
    emailDate: Date;
    scrapedAt: Date;
    wordCount: number;
    readingTime: string; // "5 min read"
    author?: string; // NEW
    publishDate?: Date; // NEW
    tags: string[]; // NEW
    sourceEmail: string; // NEW: Email ID reference
  };
  filePath: string;
  contentHash: string; // NEW: Duplicate detection
}
```

---

## API Endpoints - FINAL

### Authentication
- `POST /api/auth/gmail` - Initiate OAuth2 flow
- `GET /api/auth/callback` - Handle OAuth callback
- `POST /api/auth/refresh` - Refresh access token

### Email Operations
- `POST /api/emails/fetch` - Query Gmail with enhanced filters
- `GET /api/emails/{id}/links` - Extract links from specific email

### Content Operations
- `POST /api/links/scrape` - Batch scrape with progress tracking
- `GET /api/links/progress/{batchId}` - Real-time scraping status
- `POST /api/links/validate` - Pre-scrape URL validation

### Article Management
- `GET /api/articles` - List with pagination and filtering
- `POST /api/articles/save` - Persist to MongoDB
- `GET /api/articles/{id}/preview` - Markdown preview
- `DELETE /api/articles/{id}` - Remove article

---

## Security Requirements - ENHANCED

### Authentication & Authorization
- OAuth2 with PKCE flow implementation
- Refresh token rotation every 7 days
- Encrypted credential storage in environment variables
- Session management with secure HTTP-only cookies

### API Security
- Rate limiting: 100 requests/minute per IP
- Request size limits: 10MB max payload
- Input sanitization with Joi validation
- CORS restricted to Flutter app origin
- Helmet.js security headers

### Data Protection
- No credential logging in any environment
- MongoDB connection with TLS encryption
- File system permissions: 640 for data files
- Environment variable validation on startup

---

## Performance Requirements - QUANTIFIED

### Response Times
- Email fetch: < 3 seconds for 100 emails
- Single article scrape: < 10 seconds
- Batch scraping: 10 articles in < 30 seconds
- UI responsiveness: < 200ms for interactions

### Throughput
- Concurrent users: 10 simultaneous
- Scraping capacity: 5 parallel operations
- Database operations: < 100ms for CRUD

### Resource Limits
- Memory usage: < 512MB baseline, < 1GB during scraping
- Disk storage: Efficient with duplicate detection
- Network: Respectful rate limiting for external sites

---

## User Experience Requirements

### Flutter Web Interface
- Responsive design: Mobile, tablet, desktop
- Material Design 3 theming
- Dark/light mode support
- Keyboard shortcuts for power users
- Offline capability for reading saved articles

### Accessibility
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode
- Semantic HTML in web build

---

## Success Metrics - MEASURABLE

### Functional Success
- [ ] Gmail OAuth working without manual intervention
- [ ] Extract 100% of Flutter links from test digest emails
- [ ] Scrape 95%+ of accessible Medium articles successfully
- [ ] Zero data loss during scraping operations
- [ ] Duplicate detection accuracy > 99%

### Performance Success
- [ ] Email fetch completes in < 3 seconds
- [ ] Batch scraping of 10 articles in < 30 seconds
- [ ] UI loads and becomes interactive in < 2 seconds
- [ ] Zero memory leaks during extended operation

### Quality Success
- [ ] Unit test coverage > 80%
- [ ] Zero critical security vulnerabilities
- [ ] Error rate < 1% for normal operations
- [ ] User satisfaction score > 8/10

---

## Error Handling & Recovery

### Graceful Degradation
1. **Gmail API failures** → Display cached results, retry with backoff
2. **Scraping failures** → Mark individual URLs as failed, continue batch
3. **Database failures** → Queue operations for retry, notify user
4. **Network failures** → Offline mode for reading, sync when reconnected

### User Communication
- Clear, actionable error messages
- Progress indicators for long operations
- Success confirmations for completed actions
- Detailed logs available for troubleshooting

---

## Future Enhancements (Phase 2)

### Advanced Features
- [ ] Multiple Gmail account support
- [ ] Custom scraping rules per domain
- [ ] Full-text search across saved articles
- [ ] Export to Notion/Obsidian/Markdown files
- [ ] Scheduled digest processing
- [ ] AI-powered article summarization
- [ ] Tags and collections management

### Integrations
- [ ] Slack/Discord notifications
- [ ] RSS feed generation
- [ ] API for third-party integrations
- [ ] Browser extension for direct saving

---

## Dependencies & Risk Mitigation

### External Dependencies
| Dependency | Risk Level | Mitigation Strategy |
|------------|------------|-------------------|
| Gmail API | Medium | Implement caching, respect quotas |
| Medium.com | High | Rotate user agents, respect robots.txt |
| MongoDB Atlas | Low | Local fallback, regular backups |
| Docker Hub | Low | Local image caching |

### Technical Risks
- **ESM/CommonJS complexity** → Resolved with esbuild bundling
- **Puppeteer resource usage** → Queue management and timeouts
- **Flutter web performance** → Lazy loading and code splitting
- **OAuth token expiry** → Automatic refresh mechanism

---

## Acceptance Criteria - FINAL

### Core Functionality
1. ✅ Successfully authenticate with Gmail using OAuth2
2. ✅ Extract 100% of Flutter-related links from test digest emails
3. ✅ Scrape and save 10 articles with complete metadata in < 30 seconds
4. ✅ Display articles in Flutter web interface with search/filter
5. ✅ Persist to MongoDB with proper indexing and duplicate detection

### Quality Gates
1. ✅ All unit tests passing with 80%+ coverage
2. ✅ Integration tests cover critical user flows
3. ✅ Security audit shows zero high-severity issues
4. ✅ Performance benchmarks meet specified requirements
5. ✅ User acceptance testing completed successfully

---

**Document Status**: APPROVED FOR DEVELOPMENT  
**Next Phase**: Technical implementation by robot developers  
**Review Date**: 2025-07-28 (Complete)