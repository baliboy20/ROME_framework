# Parse Server Security

**ID**: parse-server-security
**Category**: Backend / Security & Permissions
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Implement Parse Server security patterns including RBAC, master key usage, and permission validation

## Inputs

- use-cases.md (access control requirements)
- api-spec.md (authentication requirements)

## Outputs

- Role-based access control (RBAC)
- Master key usage patterns
- Permission validation triggers
- ACL configurations

## Role-Based Access Control (RBAC)

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
```

## Master Key Patterns

```javascript
// ✅ Use master key for admin/system operations
const adminResult = await query.find({ useMasterKey: true });

// ❌ NEVER expose master key to client
// ✅ ALWAYS verify user permissions before using useMasterKey

// ✅ Prefer user-scoped queries
const userQuery = new Parse.Query('Orders');
userQuery.equalTo('owner', request.user);
const userOrders = await userQuery.find(); // No master key needed
```

## Security Checklist

**Production Settings**:
- `allowClientClassCreation: false` - ALWAYS
- `verifyUserEmails: true` - Enforce email verification
- Master key rotation - Regular schedule
- Session timeout - Configure `sessionLength`
- CORS configuration - Specific origins only

**Master Key Usage Rules**:
- Only for admin/system operations
- Always validate permissions first
- Never pass to client
- Prefer user-scoped queries when possible

**Permission Validation**:
```javascript
// Validate ownership
if (!isAdmin && obj.get('owner')?.id !== user.id) {
  throw new Parse.Error(403, 'Access denied');
}

// Validate role
const hasPermission = await checkUserRole(user, 'Admin');
if (!hasPermission) {
  throw new Parse.Error(403, 'Admin permission required');
}
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Section 10)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
