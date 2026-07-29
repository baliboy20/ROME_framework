# Parse Server Schemas

**ID**: parse-server-schemas
**Category**: Backend / Data Modeling
**Phase**: P5 (Generation)
**Robot**: Reena

## Purpose

Define Parse Server schemas with validation, indexes, and proper field types for production databases

## Inputs

- data-model.md (entity definitions)
- use-cases.md (data access patterns)

## Outputs

- Schema definitions
- Field validation (beforeSave triggers)
- Database indexes
- Submodel patterns for nested objects

## Schema Definition Pattern

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

    // Pointers (relationships)
    owner: { type: 'Pointer', targetClass: '_User' },

    // Dates
    createdAt: { type: 'Date' },
    updatedAt: { type: 'Date' },

    // Admin tracking
    createdBy: { type: 'String' },
    modifiedBy: { type: 'String' },

    // Flexible metadata
    metadata: { type: 'Object', defaultValue: {} }
  },
  indexes: {
    'name': { 'name': 1 },
    'createdAt': { 'createdAt': -1 },
    'owner': { 'owner': 1 }
  }
};
```

## Validation Pattern

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

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(obj.get('email'))) {
    throw new Parse.Error(400, 'Invalid email format');
  }
});
```

## Submodel Pattern (Nested Objects)

```javascript
// Store as Array of objects
const order = new Parse.Object('Orders');
order.set('items', [
  {
    id: 'item_1',
    name: 'Product A',
    price: 1000,
    quantity: 2
  }
]);
await order.save(null, { useMasterKey: true });
```

## Expert References

**Primary Guide** (see Experts/expert_parse_server/):
- `parse-server-expert.md` (Section 5)

---

**Version**: 1.0
**Based on**: Experts/expert_parse_server/parse-server-expert.md
**Last Updated**: 2026-01-29
