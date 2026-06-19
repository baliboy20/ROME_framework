# Generate API Endpoints

**ID**: generate-api-endpoints
**Category**: Backend & API
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Generate RESTful API endpoint implementations from api-design.md

## Inputs

- api-design.md (endpoint specifications)
- use-cases.md (business logic)
- data-dictionary.yaml (validation rules)

## Outputs

- Controllers (HTTP handlers)
- Routes (endpoint definitions)
- Request/response DTOs

## Process

1. Read api-design.md for endpoint specifications
2. Generate route definitions
3. Generate controller methods
4. Implement request validation
5. Map to service layer
6. Handle errors consistently

## Example Output

```typescript
// SOURCE/routes/users.routes.ts
router.post('/users', authenticate, validate(createUserSchema), UserController.create);
router.get('/users', authenticate, UserController.list);

// SOURCE/controllers/user.controller.ts
export class UserController {
  static async create(req: Request, res: Response) {
    const result = await UserService.create(req.body);
    res.status(201).json(result);
  }
}
```

## AORDL Traceability

- AORDL Intent → HTTP method and endpoint path
- AORDL Outcomes → Response structure
- AORDL Errors → Error response codes
