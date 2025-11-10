# Test Data Strategy Template

**Purpose:** Define canonical test datasets that all developers use for integration tests to ensure consistency.

**Instructions:** PMA should complete this template based on data model and add to `PROJECT/dev/technical-decisions.md`

---

## Purpose

All developers (Ashok, Reena, Charlie) MUST use canonical test data for integration tests to ensure:
- Consistent testing across Database/Backend/Frontend layers
- Reproducible test scenarios
- Integration tests use same entities and IDs
- Easier debugging with known data

---

## Canonical Test Users

**Define 3-5 test user personas with all necessary fields:**

| Email | Password | Role | ID | Status | Notes |
|-------|----------|------|-----|--------|-------|
| admin@test.com | test123 | admin | test-user-001 | active | Full system access |
| user1@test.com | test123 | user | test-user-002 | active | Regular user |
| user2@test.com | test123 | premium | test-user-003 | active | Premium features |
| blocked@test.com | test123 | user | test-user-004 | blocked | Test blocked state |
| [Add more as needed] | | | | | |

**Additional user fields (if applicable):**
- First name, Last name
- Created date
- Subscription tier
- Permissions
- [Add project-specific fields]

---

## Canonical Test Entities

**For each major entity in your data model, define 3-5 test instances:**

### [Entity Name: e.g., Products]

| Name | SKU | Category | Price | ID | Stock | Status | Notes |
|------|-----|----------|-------|-----|-------|--------|-------|
| [Item 1] | [SKU-001] | [Category] | [Price] | test-[entity]-001 | [Qty] | active | [Purpose] |
| [Item 2] | [SKU-002] | [Category] | [Price] | test-[entity]-002 | [Qty] | active | [Purpose] |
| [Item 3] | [SKU-003] | [Category] | [Price] | test-[entity]-003 | [Qty] | inactive | Test inactive state |

**Repeat for each core entity:**
- Products
- Orders
- Projects
- Tasks
- [Your domain entities]

---

## Canonical Test Relationships

**Define test data for relationships between entities:**

### [Relationship: e.g., User-Project assignments]

| User ID | Entity ID | Role | Created Date | Notes |
|---------|-----------|------|--------------|-------|
| test-user-002 | test-project-001 | owner | 2025-01-01 | User owns project |
| test-user-003 | test-project-001 | viewer | 2025-01-02 | User views project |

### [Relationship: e.g., Order-Items]

| Order ID | Product ID | Quantity | Price | Status |
|----------|------------|----------|-------|--------|
| test-order-001 | test-prod-001 | 1 | 999.99 | completed |
| test-order-002 | test-prod-002 | 2 | 59.98 | pending |

---

## Test Data Files Location

**PMA creates test data files:**

```
PROJECT/dev/test-data/
├── README.md                 (This strategy + usage instructions)
├── users.json                (Canonical test users)
├── [entity-name].json        (Test data for each entity)
├── [relationships].json      (Test relationship data)
└── seed.sql                  (Created by Ashok in Phase 3)
```

**File format example (`users.json`):**
```json
[
  {
    "id": "test-user-001",
    "email": "admin@test.com",
    "password": "test123",
    "role": "admin",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": "test-user-002",
    "email": "user1@test.com",
    "password": "test123",
    "role": "user",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

## Responsibilities

**PMA (Phase 2):**
- Define all canonical test datasets
- Create JSON files in `PROJECT/dev/test-data/`
- Document test data strategy in `technical-decisions.md`

**Ashok (Phase 3 - Database):**
- Read PMA's JSON test data files
- Create `seed.sql` script to insert canonical data
- Ensure seed script matches JSON exactly
- Provide "reset to seed" command for tests

**Reena (Phase 3 - Backend):**
- Use canonical test IDs in API integration tests
- Reset database to seed state before each test suite
- Reference test data in assertions

**Charlie (Phase 3 - Frontend):**
- Use canonical test IDs in UI integration tests
- Test against known data states
- Reference test users/entities in UI test scenarios

---

## Usage Rules

### DO:
✅ Use canonical test IDs in all integration tests
✅ Reference test data from PMA's JSON files
✅ Reset database to seed state before test suites
✅ Document test scenarios using canonical data

### DON'T:
❌ Create ad-hoc test data in your tests
❌ Use random/generated IDs
❌ Modify canonical data without PMA approval
❌ Skip database reset between test runs

---

## Example Test Assertions

**Good - uses canonical ID:**
```dart
test('should fetch user profile', () async {
  final user = await repo.getUser('test-user-002');
  expect(user.email, 'user1@test.com');
  expect(user.role, 'user');
});
```

**Bad - creates ad-hoc data:**
```dart
test('should fetch user profile', () async {
  // ❌ Don't do this - creates non-canonical data
  final user = await repo.getUser('random-id-123');
});
```

**Good - uses test data for workflow:**
```dart
test('should complete order workflow', () async {
  // ✅ Uses canonical test data
  final user = await auth.login('user1@test.com', 'test123');
  final product = await catalog.getProduct('test-prod-001');
  final order = await cart.checkout(user.id, [product.id]);

  expect(order.userId, 'test-user-002');
  expect(order.items[0].productId, 'test-prod-001');
});
```

---

## Notes for PMA

**When creating test data:**

1. **Base on data model:**
   - Include all required fields
   - Cover all entity states (active, inactive, pending, etc.)
   - Include edge cases (blocked user, out-of-stock product)

2. **Make IDs deterministic:**
   - Use pattern: `test-{entity}-{number}`
   - Padded numbers: `test-user-001`, `test-user-002`
   - Easy to reference in tests

3. **Create realistic data:**
   - Passwords should be simple (`test123`)
   - Emails should be clear (`user1@test.com`)
   - Names should be descriptive (`Laptop Pro`, not `Product A`)

4. **Cover test scenarios:**
   - Happy path (normal user, available product)
   - Error cases (blocked user, deleted item)
   - Edge cases (empty cart, maximum quantity)

5. **Keep it minimal but sufficient:**
   - 3-5 instances per entity is usually enough
   - Don't create hundreds of test records
   - Focus on coverage, not quantity

---

## Validation by Sarah (Phase 2B)

Sarah will check:
- [ ] Canonical test users defined (minimum 3)
- [ ] Core entities have test data (3-5 instances each)
- [ ] All test data has deterministic IDs
- [ ] Test data files created in `PROJECT/dev/test-data/`
- [ ] Usage rules documented
- [ ] Responsibilities assigned

**If incomplete:** Sarah will BLOCK Phase 3 and return to PMA.
