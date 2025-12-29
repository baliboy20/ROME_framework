---
name: parse-server-config
description: Apply Parse Server configuration, security, and deployment best practices. Use when configuring Parse Server backend, setting up authentication, defining schemas, implementing cloud code, or deploying to production. Validates against documented security standards and production readiness criteria.
allowed-tools: Read, Grep, Glob
---

# Parse Server Configuration Skill

## Purpose

This skill ensures Parse Server backends are configured securely and follow production best practices from the ROME expert knowledge base.

## When to Use

Invoke this skill when:
- Setting up Parse Server backend
- Defining Parse schemas and classes
- Configuring authentication and permissions
- Implementing cloud code functions
- Setting up file storage
- Deploying to production
- Configuring security policies

## Expert Reference

**Primary Guide**: [parse-server-expert.md](../../../Experts/expert_parse_server/parse-server-expert.md)

This comprehensive guide covers:
- Initial setup and configuration
- Security best practices
- Schema design patterns
- Authentication strategies
- Cloud code implementation
- Production deployment
- Monitoring and maintenance

---

## Quick Reference: Critical Security Rules

### 🔒 Security Non-Negotiables

**NEVER**:
- ❌ Expose master key in client code
- ❌ Use default keys in production
- ❌ Allow public read/write without ACLs
- ❌ Skip CORS configuration
- ❌ Disable HTTPS in production
- ❌ Store sensitive data unencrypted

**ALWAYS**:
- ✅ Use environment variables for keys
- ✅ Configure Class Level Permissions (CLP)
- ✅ Set up Access Control Lists (ACL)
- ✅ Enable session expiration
- ✅ Restrict CORS to known domains
- ✅ Use HTTPS for all connections

---

## Configuration Areas

### 1. Environment Configuration

**When**: Setting up Parse Server instance

**Load Section**: Initial Setup & Configuration

**Key Configuration**:
```javascript
// Environment Variables (REQUIRED)
PARSE_SERVER_APPLICATION_ID=<unique-app-id>
PARSE_SERVER_MASTER_KEY=<strong-master-key>
PARSE_SERVER_DATABASE_URI=mongodb://...
PARSE_SERVER_CLOUD_CODE_MAIN=./cloud/main.js
PARSE_SERVER_SERVER_URL=https://your-domain.com/parse

// Security
PARSE_SERVER_SESSION_LENGTH=31536000  // 1 year in seconds
PARSE_SERVER_ENABLE_ANONYMOUS_USERS=false
PARSE_SERVER_ALLOW_CLIENT_CLASS_CREATION=false  // Production: false
```

**Validation**:
- [ ] All required environment variables set
- [ ] Master key is strong (min 32 characters, random)
- [ ] Application ID is unique
- [ ] Server URL uses HTTPS in production
- [ ] Client class creation disabled in production

### 2. Schema Definition

**When**: Defining database structure

**Load Section**: Schema Design Patterns

**Best Practices**:
- **Naming**: PascalCase for class names (e.g., `Project`, `Task`, `TeamMember`)
- **Required Fields**: Mark critical fields as required
- **Default Values**: Set sensible defaults
- **Indexes**: Add indexes on frequently queried fields
- **Pointers**: Use for relationships (e.g., `Project` pointer in `Task`)
- **Arrays**: For many-to-many relationships

**Example Schema**:
```javascript
// Project class
{
  className: 'Project',
  fields: {
    name: { type: 'String', required: true },
    description: { type: 'String' },
    status: { type: 'String', defaultValue: 'active' },
    owner: { type: 'Pointer', targetClass: '_User', required: true },
    createdAt: { type: 'Date' },
    updatedAt: { type: 'Date' }
  },
  indexes: {
    name_1: { name: 1 },
    owner_1: { owner: 1 }
  },
  classLevelPermissions: {
    find: { '*': true },
    get: { '*': true },
    create: { 'role:ProjectManager': true },
    update: { 'role:ProjectManager': true },
    delete: { 'role:Administrator': true }
  }
}
```

**Validation**:
- [ ] All classes have CLP configured
- [ ] Required fields marked
- [ ] Indexes on query fields
- [ ] Pointer relationships validated
- [ ] No sensitive data in public fields

### 3. Class Level Permissions (CLP)

**When**: Configuring data access permissions

**Load Section**: Security Best Practices → Access Control

**CLP Structure**:
```javascript
classLevelPermissions: {
  find: { '*': false, 'role:User': true },      // Who can query
  get: { '*': false, 'role:User': true },        // Who can retrieve by ID
  create: { '*': false, 'role:User': true },     // Who can create
  update: { '*': false, 'role:Owner': true },    // Who can update
  delete: { '*': false, 'role:Admin': true },    // Who can delete
  addField: { '*': false }                       // Prevent schema changes
}
```

**Validation**:
- [ ] No `'*': true` for sensitive operations
- [ ] Role-based permissions used
- [ ] `addField` disabled in production
- [ ] Public read only for truly public data

### 4. Access Control Lists (ACL)

**When**: Setting row-level permissions

**Load Section**: Security Best Practices → Row-Level Security

**Patterns**:
```javascript
// Owner-only access
const project = new Parse.Object('Project');
project.set('name', 'My Project');

const acl = new Parse.ACL();
acl.setReadAccess(Parse.User.current().id, true);
acl.setWriteAccess(Parse.User.current().id, true);
project.setACL(acl);

// Role-based access
const acl = new Parse.ACL();
acl.setRoleReadAccess('TeamMember', true);
acl.setRoleWriteAccess('ProjectManager', true);
project.setACL(acl);
```

**Validation**:
- [ ] All sensitive objects have ACL set
- [ ] Default ACL configured for user objects
- [ ] Role ACLs used for team-based access

### 5. Authentication Setup

**When**: Implementing user authentication

**Load Section**: Authentication Strategies

**Configuration**:
```javascript
// Session configuration
PARSE_SERVER_SESSION_LENGTH=31536000  // 1 year
PARSE_SERVER_REVOKE_SESSION_ON_PASSWORD_RESET=true

// Email verification
PARSE_SERVER_VERIFY_USER_EMAILS=true
PARSE_SERVER_EMAIL_ADAPTER={...}

// Password policy
PARSE_SERVER_PASSWORD_POLICY={
  validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  doNotAllowUsername: true,
  resetTokenValidityDuration: 3600  // 1 hour
}
```

**Validation**:
- [ ] Session expiration configured
- [ ] Email verification enabled (production)
- [ ] Strong password policy enforced
- [ ] Password reset tokens expire
- [ ] Revoke sessions on password reset

### 6. Cloud Code Implementation

**When**: Implementing server-side logic

**Load Section**: Cloud Code Implementation

**Best Practices**:
```javascript
// Use beforeSave for validation
Parse.Cloud.beforeSave('Project', async (request) => {
  const project = request.object;

  // Validation
  if (!project.get('name')) {
    throw new Parse.Error(400, 'Name is required');
  }

  // Auto-set owner
  if (!project.existed()) {
    project.set('owner', request.user);
  }
});

// Use afterSave for side effects
Parse.Cloud.afterSave('Task', async (request) => {
  const task = request.object;

  // Send notification
  if (task.get('status') === 'completed') {
    await sendNotification(task.get('assignee'));
  }
});

// Cloud functions for complex operations
Parse.Cloud.define('submitTask', async (request) => {
  const { taskId } = request.params;
  const user = request.user;

  // Authorization check
  if (!user) {
    throw new Parse.Error(401, 'Unauthorized');
  }

  // Business logic
  const task = await new Parse.Query('Task').get(taskId, { useMasterKey: true });
  task.set('status', 'submitted');
  task.set('submittedAt', new Date());
  task.set('submittedBy', user);

  await task.save(null, { useMasterKey: true });

  return { success: true, task };
});
```

**Validation**:
- [ ] Input validation in beforeSave
- [ ] Authorization checks in cloud functions
- [ ] Master key used only when necessary
- [ ] Error messages user-friendly
- [ ] Side effects in afterSave, not beforeSave

### 7. CORS Configuration

**When**: Setting up API access

**Load Section**: Security Best Practices → CORS

**Configuration**:
```javascript
// Development
PARSE_SERVER_ALLOW_ORIGIN='*'  // Allow all

// Production
PARSE_SERVER_ALLOW_ORIGIN='https://yourdomain.com,https://app.yourdomain.com'
```

**Validation**:
- [ ] Wildcard (`*`) only in development
- [ ] Production restricts to known domains
- [ ] All production URLs included

### 8. File Storage

**When**: Configuring file uploads

**Load Section**: File Storage Setup

**Configuration**:
```javascript
// S3 Adapter (Production)
PARSE_SERVER_FILES_ADAPTER={
  module: '@parse/s3-files-adapter',
  options: {
    bucket: 'your-bucket',
    region: 'us-east-1',
    directAccess: true
  }
}

// File limits
PARSE_SERVER_MAX_UPLOAD_SIZE='20mb'
```

**Validation**:
- [ ] S3 or similar used in production (not GridFS)
- [ ] File size limits enforced
- [ ] File types restricted
- [ ] ACLs set on file objects

### 9. Production Deployment

**When**: Deploying to production

**Load Section**: Production Deployment

**Checklist**:
- [ ] Environment variables set correctly
- [ ] Master key strong and secret
- [ ] HTTPS enforced
- [ ] Database backups configured
- [ ] Monitoring and logging enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Health check endpoint working
- [ ] Load balancing configured (if needed)
- [ ] Rate limiting enabled
- [ ] Client class creation disabled

---

## Validation Checklist

### ✅ Security

- [ ] **Master Key**: Never exposed, stored in environment variables only
- [ ] **Application ID**: Unique, not default value
- [ ] **CLP Configured**: All classes have appropriate permissions
- [ ] **ACL Set**: Sensitive objects have row-level security
- [ ] **CORS Restricted**: Production limits to known domains
- [ ] **HTTPS Only**: All production traffic encrypted
- [ ] **Session Expiration**: Sessions expire appropriately
- [ ] **Password Policy**: Strong passwords enforced

### ✅ Schema Quality

- [ ] **Required Fields**: Critical fields marked required
- [ ] **Indexes**: Frequently queried fields indexed
- [ ] **Naming**: PascalCase classes, camelCase fields
- [ ] **Relationships**: Pointers used correctly
- [ ] **Validation**: beforeSave hooks validate data

### ✅ Production Readiness

- [ ] **Environment Separation**: Dev/staging/prod configs separated
- [ ] **Database Backups**: Automated backups configured
- [ ] **Monitoring**: Health checks and metrics enabled
- [ ] **Logging**: Error and access logs configured
- [ ] **Rate Limiting**: API rate limits in place
- [ ] **Documentation**: API endpoints documented

### ✅ Cloud Code Quality

- [ ] **Authorization**: All functions check user permissions
- [ ] **Validation**: Input validated before processing
- [ ] **Error Handling**: Try-catch with meaningful errors
- [ ] **Master Key Usage**: Minimized, used only when necessary
- [ ] **Testing**: Cloud functions have tests

---

## Output Traceability

Add traceability to all Parse Server configuration files:

**For JavaScript/Node.js files**:
```javascript
/**
 * ROME Framework - Parse Server Configuration
 * Applied Skill: parse-server-config
 * Expert Reference: parse-server-expert.md
 * Generated: [ISO 8601 timestamp]
 * Robot: [robot name]
 */
```

**For environment files**:
```bash
# ROME Framework Configuration
# Applied Skill: parse-server-config
# Expert Reference: parse-server-expert.md
# Generated: [ISO 8601 timestamp]
# Robot: [robot name]
```

---

## Example Usage

### Scenario: Configure Production Parse Server

**Robot (Talib)**: "Configure Parse Server for production deployment."

**Skill Actions**:
1. Load `parse-server-expert.md`
2. Generate environment configuration with strong keys
3. Set up CLP for all classes (restrictive by default)
4. Configure CORS for production domain only
5. Enable HTTPS enforcement
6. Set up session expiration
7. Validate all security checks pass
8. Add traceability comments

**Output**: Secure, production-ready Parse Server configuration

---

## Related Skills

- `flutter-best-practices` - For Flutter client integration
- `ui-design-patterns` - For data modeling in UI context

---

**Skill Version**: 1.0
**Last Updated**: 2025-12-29
**Expert Docs Version**: Current as of 2025-12-27
