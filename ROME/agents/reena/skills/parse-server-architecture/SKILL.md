# Parse Server Architecture

**ID**: parse-server-architecture
**Category**: Backend / Server Configuration
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Configure production-ready Parse Server with proper initialization, dependencies, and core architecture patterns

## Inputs

- tech-stack.md (backend requirements)
- data-model.md (database structure)

## Outputs

- Parse Server initialization (index.js)
- Dependencies configuration (package.json)
- Environment variables (.env template)
- Health check endpoint

## Server Initialization Pattern

```javascript
// index.js - Entry Point
require('dotenv').config();

const parseServer = new ParseServer({
  databaseURI: process.env.DATABASE_URI,
  cloud: path.join(__dirname, 'cloud/main.js'),
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,
  emailAdapter: customAdapter,
  liveQuery: { classNames: [...] },
  allowClientClassCreation: false, // ALWAYS false in production
  sessionLength: 31536000, // 1 year
  verifyUserEmails: true,
  enableExpressErrorHandler: false
});

await parseServer.start();
app.use('/parse', parseServer.app);
```

## Essential Dependencies

```json
{
  "parse-server": "^6.x",
  "express": "^4.18.x",
  "parse-dashboard": "^5.x",
  "dotenv": "^17.x",
  "cors": "^2.8.x",
  "stripe": "^19.x",
  "nodemailer": "^7.x",
  "cloudinary": "^2.x"
}
```

## Key Configuration Options

| Option | Production Value |
|--------|------------------|
| `databaseURI` | From .env, never hardcoded |
| `cloud` | `path.join(__dirname, 'cloud/main.js')` |
| `masterKey` | Strong random string, rotate regularly |
| `allowClientClassCreation` | **ALWAYS false** |
| `verifyUserEmails` | true in production |
| `sessionLength` | 31536000 (1 year) |

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Sections 1, 2, 13)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
