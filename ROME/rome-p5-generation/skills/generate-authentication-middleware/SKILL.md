# Generate Authentication Middleware

**ID**: generate-authentication-middleware
**Category**: Backend & API
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Generate authentication and authorization middleware from security requirements

## Inputs

- security-requirements.md (auth strategy, roles, permissions)
- api-design.md (protected endpoints)
- tech-stack.md (auth framework: JWT, OAuth, Passport, etc.)

## Outputs

- Authentication middleware (token validation)
- Authorization middleware (role/permission checks)
- Session management
- Security utilities

## Process

1. Read security requirements for auth strategy
2. Generate JWT/session validation middleware
3. Create role-based access control (RBAC) middleware
4. Generate permission checking utilities
5. Implement secure session management
6. Add CSRF protection if needed

## Example Output

```typescript
// middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

## AORDL Traceability

- Security Requirements → Middleware implementation
- Role definitions → Authorization rules
- Protected endpoints → Middleware application
- AORDL Errors → Auth error responses
