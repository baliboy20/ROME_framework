# Parse Server Deployment

**ID**: parse-server-deployment
**Category**: Backend / Deployment & Testing
**Phase**: P5 (Generation) or P6 (Delivery)
**Robot**: Reena

## Purpose

Configure Parse Server for production deployment with testing, monitoring, and environment management

## Inputs

- tech-stack.md (deployment target)
- use-cases.md (performance requirements)

## Outputs

- Environment variable configuration (.env)
- Integration test suite
- Health check endpoints
- Logging & monitoring setup
- Deployment checklist

## Environment Variables

```env
# Server Config
PORT=1337
SERVER_URL=https://api.example.com/parse
PUBLIC_SERVER_URL=https://api.example.com/parse

# Parse Config
APP_ID=your-app-id
MASTER_KEY=your-secret-master-key

# Database
DATABASE_URI=mongodb://localhost:27017/database-name

# Email (SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-email@example.com
EMAIL_FROM=noreply@example.com

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Features
ALLOW_CLIENT_CLASS_CREATION=false
VERIFY_USER_EMAILS=true
```

## Testing Pattern

```javascript
const { expect } = require('chai');

describe('Cloud Function Tests', () => {
  before(() => {
    Parse.initialize('appId');
    Parse.serverURL = 'http://localhost:1337/parse';
  });

  it('should create object', async () => {
    const obj = new Parse.Object('ClassName');
    obj.set('field', 'value');
    const saved = await obj.save();

    expect(saved.id).to.exist;
    expect(saved.get('field')).to.equal('value');
  });

  after(async () => {
    // Cleanup
    const query = new Parse.Query('ClassName');
    const objects = await query.find({ useMasterKey: true });
    await Parse.Object.destroyAll(objects, { useMasterKey: true });
  });
});
```

## Logging Pattern

```javascript
Parse.Cloud.define('myFunction', async (request) => {
  console.log(`🔄 Starting myFunction`, request.params);

  try {
    const result = await someOperation();
    console.log(`✅ Operation succeeded`, { result });
    return result;
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    throw error;
  }
});

// Emoji legend:
// ✅ Success
// ❌ Error
// 🔄 In progress
// ⚠️ Warning
```

## Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    serverURL: parseServerConfig.serverURL
  });
});
```

## Deployment Checklist

**Pre-Production**:
- [ ] Set `allowClientClassCreation = false`
- [ ] Set `verifyUserEmails = true`
- [ ] Rotate `masterKey` and `appId`
- [ ] Configure proper `emailAdapter`
- [ ] Set up SSL/TLS for `serverURL`
- [ ] Configure `CORS` with specific origins
- [ ] Test all Cloud Functions
- [ ] Set up monitoring & logging
- [ ] Configure database backups
- [ ] Run security audit on schemas

## Quick Start Commands

```bash
npm run dev                    # Start with nodemon
npm test                       # Run all tests
npm run seed                   # Seed test data

# Health Check
curl http://localhost:1337/health
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Sections 11, 12, 13, 14, 16)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
