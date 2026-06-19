# Parse Server Queries

**ID**: parse-server-queries
**Category**: Backend / Data Access
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Implement efficient Parse Server query patterns with pointer resolution, pagination, and performance optimization

## Inputs

- data-model.md (relationships)
- use-cases.md (query requirements)

## Outputs

- Optimized query patterns
- Pointer resolution strategies
- Pagination implementations
- Batch fetch operations

## Basic Query Patterns

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

// Count
const count = await query.count({ useMasterKey: true });
```

## Pagination Pattern

```javascript
// Page-based pagination
const page = 1;
const pageSize = 10;
query.limit(pageSize);
query.skip((page - 1) * pageSize);

const results = await query.find({ useMasterKey: true });
const total = await query.count({ useMasterKey: true });

return {
  results,
  pagination: {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  }
};
```

## Pointer Resolution

```javascript
// Include related objects
query.include('owner');  // Fetch owner User object
query.include('address'); // Fetch Address pointer

// Include nested pointers
query.include(['order', 'order.customer']);

// Conditional include
if (requestingUser.isAdmin) {
  query.include('internalNotes');
}
```

## Batch Fetch Operations

```javascript
// Fetch multiple objects by ID
const ids = ['id1', 'id2', 'id3'];
query.containedIn('objectId', ids);
const objects = await query.find({ useMasterKey: true });
```

## Nested Object Queries

```javascript
// Query nested objects in Array fields
query.equalTo('items.name', 'Product A');

// Update nested objects
order.set('items', [/* new array */]);
await order.save(null, { useMasterKey: true });
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Section 6)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
