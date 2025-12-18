# Parse Server Expert Cheat Sheet

A structured reference for building production-ready Parse Server backends. Based on real-world patterns from an established application.

---

## 1. CORE ARCHITECTURE

### Entry Point: `index.js`

```javascript
// Pattern: Load env first, then configure
require('dotenv').config();

// Parse Server initialization with full config
const parseServer = new ParseServer({
  databaseURI: process.env.DATABASE_URI,
  cloud: path.join(__dirname, 'cloud/main.js'),
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,
  emailAdapter: customAdapter,
  liveQuery: { classNames: [...] },
  allowClientClassCreation: false // ALWAYS false in production
});

// Mount and start
await parseServer.start();
app.use('/parse', parseServer.app);
```

### Key Configuration Options

| Option | Purpose | Production Value |
|--------|---------|-------------------|
| `databaseURI` | MongoDB connection | From .env, never hardcoded |
| `cloud` | Entry to cloud functions | `path.join(__dirname, 'cloud/main.js')` |
| `masterKey` | Server-side authentication | Strong random string, rotate regularly |
| `emailAdapter` | Custom email service | Implement custom adapter class |
| `liveQuery.classNames` | Real-time updates | Only classes that need it |
| `sessionLength` | Session timeout (seconds) | 1 year = 31536000 |
| `allowClientClassCreation` | Schema auto-creation | **ALWAYS false** |
| `verifyUserEmails` | Email verification | true in production |
| `enableExpressErrorHandler` | Error response format | false (returns JSON, not HTML) |

---

## 2. DEPENDENCIES & LIBRARIES

### Essential Packages

```json
{
  "parse-server": "^6.x",
  "express": "^4.18.x",
  "parse-dashboard": "^5.x",
  "dotenv": "^17.x",
  "cors": "^2.8.x"
}
```

### Optional But Common

```json
{
  "stripe": "^19.x",                    // Payment processing
  "nodemailer": "^7.x",                 // Email handling
  "cloudinary": "^2.x",                 // Image storage
  "@parse/push-adapter": "^6.x",        // Push notifications
  "axios": "^1.x",                      // HTTP client for webhooks
  "pg-promise": "^10.x"                 // PostgreSQL (alternative DB)
}
```

### Dev Dependencies

```json
{
  "mocha": "^11.x",         // Test framework
  "chai": "^6.x",           // Assertions
  "nodemon": "^3.x"         // Development server reload
}
```

---

## 3. CLOUD FUNCTIONS ORGANIZATION

### Directory Structure

```
cloud/
├── main.js                    # Entry point, loads all functions
├── functions/
│   ├── index.js              # Main function registry
│   ├── orderFunctions.js      # Business logic for Orders
│   ├── addressFunctions.js    # Address CRUD
│   ├── userProfileFunctions.js
│   ├── paymentProcessing.js
│   ├── stripeCheckout.js
│   └── seedProducts.js        # Development utilities
├── admin/
│   ├── index.js              # Admin function registry
│   ├── auth.js               # Admin authentication
│   ├── orders.js             # Admin order management
│   ├── products.js
│   ├── users.js
│   └── [other admin modules]
├── schemas/
│   ├── Product.js            # Product schema definition
│   ├── Orders.js
│   ├── OrderPayments.js      # Submodel schemas
│   ├── Addresses.js
│   ├── indexes.js            # Database index definitions
│   └── [other models]
├── helpers/
│   ├── orderHelpers.js       # Pure utilities (no DB calls)
│   ├── orderEditValidation.js
│   ├── backwardCompatibility.js
│   └── [other helpers]
├── adapters/
│   └── smtpAdapter.js        # Email adapter implementation
├── utils/
│   └── emailService.js       # Email sending utilities
└── migrations/
    └── 001_refactor_orders.js # Data migrations
```

---

## 4. CLOUD FUNCTION PATTERNS

### Define a Basic Cloud Function

```javascript
Parse.Cloud.define('functionName', async (request) => {
  const { param1, param2 } = request.params;
  const user = request.user;

  // Validation
  if (!param1) throw new Parse.Error(400, 'param1 required');

  try {
    // Business logic
    const result = await someQuery.find({ useMasterKey: true });
    return { success: true, data: result };
  } catch (error) {
    throw new Parse.Error(500, error.message);
  }
});
```

### Authentication Triggers

```javascript
// Called after successful login
Parse.Cloud.afterLogin(async (request) => {
  const user = request.object;
  user.set('lastLogin', new Date());
  await user.save(null, { useMasterKey: true });
});

// Called before save
Parse.Cloud.beforeSave('ClassName', async (request) => {
  const obj = request.object;
  if (obj.isNew()) {
    obj.set('createdBy', request.user?.id);
  } else {
    obj.set('modifiedBy', request.user?.id);
  }
});

// Called after delete
Parse.Cloud.afterDelete('ClassName', async (request) => {
  // Cleanup logic (delete related objects, etc.)
});
```

### Error Handling Pattern

```javascript
// Parse Error codes: 100-600+
throw new Parse.Error(
  400,  // Bad request - validation failures
  'Error message'
);

throw new Parse.Error(
  401,  // Unauthorized - permission denied
  'Not authorized'
);

throw new Parse.Error(
  404,  // Not found
  'Object not found'
);

throw new Parse.Error(
  500,  // Server error - unexpected failures
  'Database error: ' + error.message
);
```

---

## 5. SCHEMA DEFINITION PATTERNS

### Basic Schema Structure

```javascript
const ProductSchema = {
  className: 'Product',
  fields: {
    // Primitives
    name: { type: 'String', required: true },
    price: { type: 'Number', required: true },
    description: { type: 'String' },

    // Arrays (store nested objects as JSON)
    variants: {
      type: 'Array',
      defaultValue: []
      // Each item: { id, name, price, stock }
    },
    images: {
      type: 'Array'
      // Each item: { url, filename, order, isPrimary }
    },

    // Pointers (relationships to other classes)
    owner: { type: 'Pointer', targetClass: '_User' },

    // Dates
    createdAt: { type: 'Date' },
    updatedAt: { type: 'Date' },

    // Admin fields
    createdBy: { type: 'String' },  // User ID
    modifiedBy: { type: 'String' }, // User ID

    // Metadata (flexible JSON)
    metadata: { type: 'Object', defaultValue: {} }
  },
  indexes: {
    'name': { 'name': 1 },
    'createdAt': { 'createdAt': -1 },
    'owner': { 'owner': 1 }
  }
};
```

### Validation Pattern

```javascript
Parse.Cloud.beforeSave('ClassName', async (request) => {
  const obj = request.object;

  // Required fields
  if (!obj.get('name')) {
    throw new Parse.Error(400, 'Name is required');
  }

  // Type validation
  if (typeof obj.get('price') !== 'number') {
    throw new Parse.Error(400, 'Price must be a number');
  }

  // Range validation
  if (obj.get('stock') < 0) {
    throw new Parse.Error(400, 'Stock cannot be negative');
  }

  // Enum validation
  const validStatus = ['active', 'inactive', 'archived'];
  if (!validStatus.includes(obj.get('status'))) {
    throw new Parse.Error(400, `Invalid status: ${obj.get('status')}`);
  }

  // Custom validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(obj.get('email'))) {
    throw new Parse.Error(400, 'Invalid email format');
  }
});
```

---

## 6. QUERYING PATTERNS

### Basic Query

```javascript
// Simple query
const query = new Parse.Query('ClassName');
query.equalTo('fieldName', value);
const results = await query.find({ useMasterKey: true });

// Multiple conditions
query.greaterThan('price', 100);
query.lessThan('price', 500);
query.containedIn('status', ['active', 'featured']);

// Sorting & limits
query.descending('createdAt');
query.limit(50);
query.skip(0);

// Pagination
query.limit(10);
query.skip((page - 1) * 10);

// Count
const count = await query.count({ useMasterKey: true });

// Batch fetch
const ids = ['id1', 'id2', 'id3'];
query.containedIn('objectId', ids);
```

### Pointer Resolution

```javascript
// Include related object
query.include('owner');  // Fetch owner User object
query.include('address'); // Fetch Address pointer

// Include nested pointers
query.include(['order', 'order.customer']);

// Conditional include
if (requestingUser.isAdmin) {
  query.include('internalNotes');
}
```

### Submodel Pattern (Nested Objects)

```javascript
// Store as Array of objects
const order = new Parse.Object('Orders');
order.set('items', [
  {
    id: 'item_1',
    name: 'Product A',
    price: 1000,
    quantity: 2
  },
  {
    id: 'item_2',
    name: 'Product B',
    price: 2000,
    quantity: 1
  }
]);
await order.save(null, { useMasterKey: true });

// Query nested objects
query.equalTo('items.name', 'Product A');

// Update nested objects
order.set('items', [/* new array */]);
await order.save(null, { useMasterKey: true });
```

---

## 7. EMAIL ADAPTER PATTERN

### Custom SMTP Adapter

```javascript
const nodemailer = require('nodemailer');

class SMTPAdapter {
  constructor(options) {
    this.options = options;
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port || 587,
      secure: options.secure || false,
      auth: options.auth ? {
        user: options.auth.user,
        pass: options.auth.pass
      } : undefined
    });
  }

  async sendMail(mail) {
    try {
      const info = await this.transporter.sendMail({
        from: this.options.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html
      });
      console.log(`✅ Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Email failed:', error);
      throw error;
    }
  }
}

module.exports = SMTPAdapter;
```

### Configuration

```javascript
const SMTPAdapter = require('./cloud/adapters/smtpAdapter');

const parseServerConfig = {
  emailAdapter: new SMTPAdapter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    fromAddress: process.env.EMAIL_FROM,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
};
```

---

## 8. WEBHOOK HANDLING PATTERN

### Webhook Endpoint

```javascript
// index.js
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    // Verify and process webhook
    await Parse.Cloud.run('handleStripeWebhook', {
      payload: payload.toString(),
      signature: signature
    }, { useMasterKey: true });

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

### Webhook Handler Cloud Function

```javascript
Parse.Cloud.define('handleStripeWebhook', async (request) => {
  const { payload, signature } = request.params;

  try {
    // Verify webhook signature (if applicable)
    // const verified = await verifySignature(payload, signature);
    // if (!verified) throw new Error('Invalid signature');

    // Parse event data
    const event = JSON.parse(payload);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled webhook: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    throw new Parse.Error(400, error.message);
  }
});
```

---

## 9. MIGRATION & BOOTSTRAP PATTERNS

### Migration Cloud Function

```javascript
Parse.Cloud.define('migrateAdminFields', async (request) => {
  let updated = 0;

  try {
    // Query objects
    const query = new Parse.Query('ClassName');
    query.limit(1000);
    const objects = await query.find({ useMasterKey: true });

    // Update each object
    for (const obj of objects) {
      if (obj.get('newField') === undefined) {
        obj.set('newField', defaultValue);
        await obj.save(null, { useMasterKey: true });
        updated++;
      }
    }

    console.log(`✅ Migrated ${updated} objects`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new Parse.Error(500, error.message);
  }
});
```

### Admin Bootstrap

```javascript
Parse.Cloud.define('bootstrapAdmin', async (request) => {
  const { email, password, fullName } = request.params;

  // Validation
  if (!email || !password || password.length < 8) {
    throw new Parse.Error(400, 'Invalid credentials');
  }

  try {
    // Check for existing admin (one-time use)
    const adminQuery = new Parse.Query(Parse.User);
    adminQuery.equalTo('isAdmin', true);
    const existing = await adminQuery.first({ useMasterKey: true });

    if (existing) {
      throw new Parse.Error(400, 'Admin already exists');
    }

    // Create admin user
    const user = new Parse.User();
    user.set('username', email.toLowerCase());
    user.set('email', email.toLowerCase());
    user.set('password', password);
    user.set('fullName', fullName);
    user.set('isAdmin', true);
    user.set('permissions', ['orders', 'products', 'users']);

    await user.signUp(null, { useMasterKey: true });

    const loggedIn = await Parse.User.logIn(email.toLowerCase(), password);

    return {
      success: true,
      userId: user.id,
      sessionToken: loggedIn.getSessionToken()
    };
  } catch (error) {
    throw new Parse.Error(500, error.message);
  }
});
```

---

## 10. PERMISSION & SECURITY PATTERNS

### Role-Based Access Control (RBAC)

```javascript
// Define roles
const adminRole = new Parse.Role('Admin', new Parse.ACL());
adminRole.getRoles().add('User'); // Admins inherit User role

const userRole = new Parse.Role('User', new Parse.ACL());

// Before save - check permissions
Parse.Cloud.beforeSave('Orders', async (request) => {
  const user = request.user;
  const obj = request.object;

  if (!user) throw new Parse.Error(401, 'Authentication required');

  // Check admin role
  const adminQuery = new Parse.Query(Parse.Role);
  adminQuery.equalTo('name', 'Admin');
  adminQuery.include('users');
  const adminRole = await adminQuery.first({ useMasterKey: true });

  const isAdmin = adminRole && adminRole.getUsers().includes(user);

  if (!isAdmin && obj.isNew()) {
    throw new Parse.Error(403, 'Only admins can create orders');
  }
});

// Query with ACL filtering
const query = new Parse.Query('Orders');
query.matchesQuery('acl', aclQuery); // Only objects user can access
```

### Master Key Patterns

```javascript
// Use master key only for admin/system operations
const adminResult = await query.find({ useMasterKey: true });

// NEVER expose master key to client
// ALWAYS verify user permissions before using useMasterKey

// Prefer user-scoped queries
const userQuery = new Parse.Query('Orders');
userQuery.equalTo('owner', request.user);
const userOrders = await userQuery.find();
```

---

## 11. LOGGING & MONITORING

### Cloud Function Logging

```javascript
Parse.Cloud.define('myFunction', async (request) => {
  // Log start
  console.log(`🔄 Starting myFunction with params:`, request.params);

  try {
    const result = await someOperation();

    // Log success
    console.log(`✅ Operation succeeded`, { result });
    return result;
  } catch (error) {
    // Log error
    console.error(`❌ Operation failed: ${error.message}`, {
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
});

// Use emojis for CLI visibility:
// ✅ Success
// ❌ Error
// 🔄 In progress
// ⚠️ Warning
// 📝 Info
```

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    serverURL: parseServerConfig.serverURL,
    database: parseServerConfig.databaseURI
  });
});
```

---

## 12. TESTING PATTERNS

### Integration Test Template

```javascript
const { expect } = require('chai');
const Parse = require('parse');

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

  it('should call cloud function', async () => {
    const result = await Parse.Cloud.run('functionName', {
      param: 'value'
    });

    expect(result.success).to.be.true;
  });

  after(async () => {
    // Cleanup
    const query = new Parse.Query('ClassName');
    const objects = await query.find({ useMasterKey: true });
    await Parse.Object.destroyAll(objects, { useMasterKey: true });
  });
});
```

### Run Tests

```bash
npm test                          # Run all tests
npm run test:messages             # Run specific test file
mocha integration_test/**/*.test.js --timeout 10000
```

---

## 13. ENVIRONMENT VARIABLES

### `.env` Template

```env
# Server Config
PORT=1337
SERVER_URL=http://localhost:1337/parse
PUBLIC_SERVER_URL=http://localhost:1337/parse

# Parse Config
APP_ID=your-app-id
MASTER_KEY=your-secret-master-key

# Database
DATABASE_URI=mongodb://localhost:27017/database-name

# Dashboard
DASHBOARD_USER=admin
DASHBOARD_PASS=admin123

# Email (SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@example.com

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Features
ALLOW_CLIENT_CLASS_CREATION=false
VERIFY_USER_EMAILS=false
```

---

## 14. DEPLOYMENT CHECKLIST

### Pre-Production

- [ ] Set `allowClientClassCreation = false`
- [ ] Set `verifyUserEmails = true`
- [ ] Rotate `masterKey` and `appId`
- [ ] Configure proper `emailAdapter`
- [ ] Set up SSL/TLS for `serverURL`
- [ ] Configure `CORS` with specific origins
- [ ] Test all Cloud Functions thoroughly
- [ ] Set up monitoring & logging
- [ ] Configure database backups
- [ ] Run security audit on schemas
- [ ] Test payment processing (if applicable)

### Production Env

```env
# NEVER commit these values
SERVER_URL=https://api.example.com/parse
PUBLIC_SERVER_URL=https://api.example.com/parse
DATABASE_URI=mongodb://prod-cluster.mongo.com/db
MASTER_KEY=<strong-random-string>
APP_ID=<strong-random-id>
```

---

## 15. COMMON PATTERNS SUMMARY

| Pattern | Use Case | Location |
|---------|----------|----------|
| **Cloud.define()** | Custom API endpoints | `cloud/functions/*` |
| **beforeSave()** | Validation & normalization | `cloud/functions/*` |
| **afterLogin()** | User tracking, session setup | `cloud/main.js` |
| **Query.include()** | Pointer resolution | Cloud functions, functions |
| **Submodel Array** | Nested object grouping | Schema definition |
| **useMasterKey: true** | Admin operations only | Carefully gated code |
| **Custom Adapter** | Email, payments, storage | `cloud/adapters/*` |
| **Migration.define()** | Data schema changes | `cloud/main.js` |
| **Webhook handler** | External integrations | `index.js` + Cloud function |
| **Parse.Error(code, msg)** | Standardized errors | All error paths |

---

## 16. QUICK START COMMANDS

```bash
# Development
npm run dev                    # Start with nodemon
npm test                       # Run all tests
npm run seed                   # Seed test data

# Bootstrap Admin (curl example)
curl -X POST http://localhost:1337/parse/functions/bootstrapAdmin \
  -H "X-Parse-Application-Id: appId" \
  -H "X-Parse-Master-Key: masterKey" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure123","fullName":"Admin User"}'

# Health Check
curl http://localhost:1337/health

# Access Dashboard
# http://localhost:1337/dashboard
```

---

## References

- **Parse Documentation**: https://docs.parseplatform.org/
- **Best Practices**: Configure server for production from day one
- **Security**: Never expose masterKey or sensitive config to clients
- **Scaling**: Use MongoDB indexing on queried fields; batch operations for large datasets

