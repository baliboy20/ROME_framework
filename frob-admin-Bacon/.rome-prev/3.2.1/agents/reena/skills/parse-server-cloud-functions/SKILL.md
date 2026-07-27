# Parse Server Cloud Functions

**ID**: parse-server-cloud-functions
**Category**: Backend / Business Logic
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Implement Parse Server cloud functions with proper organization, triggers, and error handling patterns

## Inputs

- use-cases.md (business logic requirements)
- api-spec.md (endpoint definitions)

## Outputs

- Cloud function definitions
- Trigger implementations (beforeSave, afterLogin, afterDelete)
- Function organization structure
- Error handling patterns

## Cloud Function Organization

```
cloud/
├── main.js                    # Entry point, loads all functions
├── functions/
│   ├── index.js              # Main function registry
│   ├── orderFunctions.js      # Business logic for Orders
│   ├── userProfileFunctions.js
│   ├── paymentProcessing.js
│   └── seedProducts.js        # Development utilities
├── admin/
│   ├── index.js              # Admin function registry
│   ├── auth.js               # Admin authentication
│   └── orders.js             # Admin order management
├── helpers/
│   ├── orderHelpers.js       # Pure utilities (no DB calls)
│   └── orderEditValidation.js
└── migrations/
    └── 001_refactor_orders.js # Data migrations
```

## Basic Cloud Function Pattern

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

## Authentication Triggers

```javascript
// After login tracking
Parse.Cloud.afterLogin(async (request) => {
  const user = request.object;
  user.set('lastLogin', new Date());
  await user.save(null, { useMasterKey: true });
});

// Before save validation
Parse.Cloud.beforeSave('ClassName', async (request) => {
  const obj = request.object;
  if (obj.isNew()) {
    obj.set('createdBy', request.user?.id);
  } else {
    obj.set('modifiedBy', request.user?.id);
  }
});
```

## Error Handling

```javascript
throw new Parse.Error(400, 'Validation failure');
throw new Parse.Error(401, 'Not authorized');
throw new Parse.Error(404, 'Object not found');
throw new Parse.Error(500, 'Database error: ' + error.message);
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Sections 3, 4, 11)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
