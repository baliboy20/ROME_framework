# JSON Validation Scope Guide
## The Art Deco Bakery - Flutter Application

### Overview
**MANDATORY REQUIREMENT**: All JSON responses from external sources must be validated before deserialization. This guide defines which data paths require validation and implementation patterns.

---

## 1. Validation Scope Matrix

### ✅ MUST VALIDATE (All these sources)

| Source | Data Type | Requirement | Validation Level |
|--------|-----------|-------------|------------------|
| **Parse Server API** | All responses | MANDATORY | Complete JSON schema |
| **LiveQuery Responses** | Real-time updates | MANDATORY | Partial schema (updated fields) |
| **Stripe Webhooks** | Payment events | MANDATORY | Complete + signature verification |
| **Email Service Webhooks** | Email events | MANDATORY | Complete schema |
| **Cached JSON** | LocalStorage | MANDATORY | Validate on read |
| **External APIs** | Any external data | MANDATORY | Service-specific schema |
| **File Uploads** | JSON files | MANDATORY | Before parsing |

### ❌ DON'T VALIDATE (Internal sources)

| Source | Reason |
|--------|--------|
| BLoC states | Internal, already typed |
| In-memory data | Internal, already typed |
| Hardcoded constants | Source-controlled |

---

## 2. Parse Server Validation Scope

### Complete Scope (ALL Parse responses)

```dart
// ✅ MANDATORY: Validate ALL Parse API responses

// 📁 lib/features/order/data/datasources/order_remote_datasource.dart

class OrderRemoteDataSource {
  Future<List<OrderModel>> getOrders() async {
    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Order'))
      ..setLimit(100);

    final response = await queryBuilder.query();

    if (!response.success) {
      throw NetworkException(
        message: 'Failed to fetch orders',
        statusCode: response.statusCode,
      );
    }

    // ✅ MANDATORY: Validate response structure
    final validationResult = JsonValidation.validate(
      response.result,
      _getOrderSchema(),
    );

    if (!validationResult.isValid) {
      throw ValidationException(
        message: 'Invalid order data format',
        fieldName: 'orders',
        details: validationResult.errors,
      );
    }

    return (response.result as List)
        .map((p) => OrderModel.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  // Define schema for validation
  static Map<String, dynamic> _getOrderSchema() => {
    'type': 'array',
    'items': {
      'type': 'object',
      'properties': {
        'objectId': {'type': 'string'},
        'customerId': {'type': 'string'},
        'items': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'productId': {'type': 'string'},
              'quantity': {'type': 'integer'},
              'price': {'type': 'integer'},
            },
            'required': ['productId', 'quantity', 'price'],
          },
        },
        'status': {
          'type': 'string',
          'enum': ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        },
        'totalAmount': {'type': 'integer'},
        'createdAt': {'type': 'string', 'format': 'date-time'},
      },
      'required': ['objectId', 'customerId', 'items', 'status', 'totalAmount'],
    },
  };
}
```

### LiveQuery Validation Scope

```dart
// ✅ MANDATORY: Validate LiveQuery updates

class OrderLiveQueryManager {
  Future<void> subscribeToOrders() async {
    final liveQuery = await Parse.getServer().getLiveQueryClient();

    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Order'));
    final subscription = await liveQuery.subscribe(queryBuilder);

    subscription.on('update', (message) {
      // ✅ MANDATORY: Validate update even though it's partial
      final validationResult = JsonValidation.validate(
        message,
        _getOrderUpdateSchema(),  // Can be partial schema
      );

      if (!validationResult.isValid) {
        logger.error('Invalid LiveQuery update', data: {
          'errors': validationResult.errors,
          'data': message,
        });
        return; // Skip invalid update
      }

      _handleOrderUpdate(message);
    });
  }

  // Partial schema for updates
  static Map<String, dynamic> _getOrderUpdateSchema() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string'},
      'status': {'type': 'string'},
      'updatedAt': {'type': 'string', 'format': 'date-time'},
      'totalAmount': {'type': 'integer'},
    },
    // Note: Not all fields required for updates
  };
}
```

---

## 3. Feature-Specific Validation Scope

### Auth Feature

```dart
// 📁 lib/features/auth/data/datasources/auth_remote_datasource.dart

class AuthRemoteDataSource {
  Future<UserModel> login(String email, String password) async {
    final user = await ParseUser(email, password).login();

    // ✅ MANDATORY: Validate user data
    final validationResult = JsonValidation.validate(
      user.toJson(),
      _getUserSchema(),
    );

    if (!validationResult.isValid) {
      throw ValidationException(
        message: 'Invalid user data from server',
        fieldName: 'user',
      );
    }

    return UserModel.fromJson(user.toJson());
  }

  Future<UserModel> signup(String email, String password, String name) async {
    final user = ParseUser(username: email, password: password, email: email);
    user.set('name', name);
    await user.save();

    // ✅ MANDATORY: Validate signup response
    final validationResult = JsonValidation.validate(
      user.toJson(),
      _getUserSchema(),
    );

    if (!validationResult.isValid) {
      throw ValidationException(
        message: 'Invalid user data after signup',
        fieldName: 'user',
      );
    }

    return UserModel.fromJson(user.toJson());
  }

  static Map<String, dynamic> _getUserSchema() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string'},
      'email': {'type': 'string', 'format': 'email'},
      'name': {'type': 'string'},
      'sessionToken': {'type': 'string'},
      'role': {'type': 'string', 'enum': ['customer', 'admin', 'staff']},
    },
    'required': ['objectId', 'email', 'sessionToken'],
  };
}
```

### Checkout Feature (Payment)

```dart
// 📁 lib/features/checkout/data/datasources/payment_remote_datasource.dart

class PaymentRemoteDataSource {
  Future<PaymentResult> processPayment(PaymentRequest request) async {
    // 1. Create payment in Parse
    final paymentObject = ParseObject('Payment');
    paymentObject.set('customerId', request.customerId);
    paymentObject.set('amount', request.amount);
    paymentObject.set('currency', 'GBP');
    paymentObject.set('status', 'pending');

    await paymentObject.save();

    // ✅ MANDATORY: Validate payment response
    final paymentValidation = JsonValidation.validate(
      paymentObject.toJson(),
      _getPaymentSchema(),
    );

    if (!paymentValidation.isValid) {
      throw ValidationException(
        message: 'Invalid payment response',
        fieldName: 'payment',
      );
    }

    // 2. Call Stripe (external API)
    final stripeResponse = await _stripe.confirmPayment(
      request.paymentMethodId,
      request.amount,
    );

    // ✅ MANDATORY: Validate Stripe response
    final stripeValidation = JsonValidation.validate(
      stripeResponse,
      _getStripeResponseSchema(),
    );

    if (!stripeValidation.isValid) {
      throw ValidationException(
        message: 'Invalid Stripe response',
        fieldName: 'stripe_response',
      );
    }

    // 3. Update payment status in Parse
    paymentObject.set('status', stripeResponse['status']);
    paymentObject.set('transactionId', stripeResponse['id']);
    await paymentObject.save();

    return PaymentResult.fromJson({
      'paymentId': paymentObject.objectId,
      'status': stripeResponse['status'],
      'transactionId': stripeResponse['id'],
    });
  }

  static Map<String, dynamic> _getPaymentSchema() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string'},
      'customerId': {'type': 'string'},
      'amount': {'type': 'integer', 'minimum': 1},
      'currency': {'type': 'string', 'const': 'GBP'},
      'status': {
        'type': 'string',
        'enum': ['pending', 'processing', 'completed', 'failed'],
      },
    },
    'required': ['objectId', 'customerId', 'amount', 'status'],
  };

  static Map<String, dynamic> _getStripeResponseSchema() => {
    'type': 'object',
    'properties': {
      'id': {'type': 'string', 'pattern': '^pi_'},
      'status': {
        'type': 'string',
        'enum': ['succeeded', 'processing', 'requires_action', 'requires_payment_method', 'canceled'],
      },
      'amount': {'type': 'integer', 'minimum': 1},
      'currency': {'type': 'string'},
      'charges': {
        'type': 'object',
        'properties': {
          'data': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'id': {'type': 'string'},
                'status': {'type': 'string'},
              },
            },
          },
        },
      },
    },
    'required': ['id', 'status'],
  };
}
```

### Order Management Feature

```dart
// 📁 lib/features/admin/order_management/data/datasources/order_management_datasource.dart

class OrderManagementDataSource {
  Future<OrderModel> updateOrderStatus(String orderId, String newStatus) async {
    final order = ParseObject('Order')..objectId = orderId;
    order.set('status', newStatus);
    order.set('updatedAt', DateTime.now().toIso8601String());
    await order.save();

    // ✅ MANDATORY: Validate updated order
    final validationResult = JsonValidation.validate(
      order.toJson(),
      _getOrderUpdateResponseSchema(),
    );

    if (!validationResult.isValid) {
      throw ValidationException(
        message: 'Invalid order update response',
        fieldName: 'order',
      );
    }

    return OrderModel.fromJson(order.toJson());
  }

  static Map<String, dynamic> _getOrderUpdateResponseSchema() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string'},
      'status': {
        'type': 'string',
        'enum': ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      },
      'updatedAt': {'type': 'string', 'format': 'date-time'},
      'totalAmount': {'type': 'integer'},
    },
    'required': ['objectId', 'status'],
  };
}
```

---

## 4. Cached Data Validation

### Local Storage Validation

```dart
// ✅ MANDATORY: Validate cached data when reading

class ProductLocalDataSource {
  final Database _database;

  Future<List<ProductModel>> getProducts({String? category}) async {
    final List<Map<String, dynamic>> maps = await _database.query(
      'products',
      where: category != null ? 'category = ?' : null,
      whereArgs: category != null ? [category] : null,
    );

    // ✅ MANDATORY: Validate cached data
    final validationResult = JsonValidation.validate(
      maps,
      _getProductsSchema(),
    );

    if (!validationResult.isValid) {
      logger.warning('Cached data is invalid, clearing cache', data: {
        'errors': validationResult.errors,
      });
      // Clear invalid cache
      await _database.delete('products');
      return [];
    }

    return maps
        .map((m) => ProductModel.fromJson(m))
        .toList();
  }

  static Map<String, dynamic> _getProductsSchema() => {
    'type': 'array',
    'items': {
      'type': 'object',
      'properties': {
        'id': {'type': 'string'},
        'name': {'type': 'string'},
        'price': {'type': 'integer'},
        'category': {'type': 'string'},
        'active': {'type': 'boolean'},
      },
      'required': ['id', 'name', 'price'],
    },
  };
}
```

---

## 5. Validation Failure Handling

### Error Flow

```dart
sealed class ValidationResult {
  const ValidationResult();
}

class ValidJson extends ValidationResult {
  final Map<String, dynamic> data;
  const ValidJson(this.data);
}

class InvalidJson extends ValidationResult {
  final List<String> errors;
  final Map<String, dynamic>? data;
  const InvalidJson({required this.errors, this.data});
}

// Usage pattern
Future<OrderModel> _fetchAndValidateOrder(String orderId) async {
  try {
    final response = await _parseClient.getObject('Order', orderId);

    final validation = JsonValidation.validate(response, _orderSchema);

    if (!validation.isValid) {
      // Log validation errors
      logger.error('Order validation failed', data: {
        'orderId': orderId,
        'errors': validation.errors,
        'receivedData': response,
      });

      // Throw for repository to convert to Failure
      throw ValidationException(
        message: 'Invalid order data from server',
        fieldName: 'order',
        details: validation.errors,
      );
    }

    return OrderModel.fromJson(response);
  } on ValidationException {
    rethrow; // Repository converts to ValidationFailure
  } catch (e) {
    throw ServerException(message: 'Unexpected error: $e');
  }
}
```

---

## 6. Schema Definition Best Practices

### ✅ DO:

```dart
// Good: Complete, documented schemas

class OrderSchemas {
  /// Complete order from API
  static Map<String, dynamic> complete() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string', 'description': 'Parse Object ID'},
      'customerId': {'type': 'string', 'description': 'Customer reference'},
      'items': {
        'type': 'array',
        'description': 'Order line items',
        'minItems': 1,  // At least one item required
        'items': {
          'type': 'object',
          'properties': {
            'productId': {'type': 'string'},
            'quantity': {'type': 'integer', 'minimum': 1},
            'price': {'type': 'integer', 'minimum': 1},
          },
          'required': ['productId', 'quantity', 'price'],
          'additionalProperties': false,
        },
      },
      'status': {
        'type': 'string',
        'enum': ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      },
      'totalAmount': {'type': 'integer', 'minimum': 0},
      'createdAt': {'type': 'string', 'format': 'date-time'},
      'updatedAt': {'type': 'string', 'format': 'date-time'},
    },
    'required': ['objectId', 'customerId', 'items', 'status', 'totalAmount'],
    'additionalProperties': false,  // Reject unknown fields
  };

  /// Partial update from LiveQuery
  static Map<String, dynamic> update() => {
    'type': 'object',
    'properties': {
      'objectId': {'type': 'string'},
      'status': {'type': 'string'},
      'updatedAt': {'type': 'string', 'format': 'date-time'},
    },
    // No required for partial updates
    'additionalProperties': false,
  };
}
```

### ❌ DON'T:

```dart
// Bad: Incomplete, generic schemas

// Too permissive
Map<String, dynamic> badSchema() => {
  'type': 'object',
  // No properties defined!
  // No required fields!
  // Allows any data!
};

// Too vague
Map<String, dynamic> vaguSchema() => {
  'items': {
    'type': 'object',
    // What properties?
    // What are required?
  },
};
```

---

## 7. Validation Configuration

### Production Settings

```dart
// 📁 lib/core/utils/json_validation_config.dart

class JsonValidationConfig {
  /// Enable/disable validation (always enabled in production)
  static const bool isEnabled = bool.fromEnvironment(
    'ENABLE_JSON_VALIDATION',
    defaultValue: true,
  );

  /// Log validation errors
  static const bool logErrors = bool.fromEnvironment(
    'LOG_VALIDATION_ERRORS',
    defaultValue: !bool.fromEnvironment('kReleaseMode'),
  );

  /// Fail fast on validation error
  static const bool strictMode = bool.fromEnvironment(
    'STRICT_JSON_VALIDATION',
    defaultValue: true,
  );

  /// Report validation errors to analytics
  static const bool reportToAnalytics = bool.fromEnvironment(
    'REPORT_VALIDATION_ERRORS',
    defaultValue: true,
  );
}
```

---

## 8. Validation Checklist

For each API endpoint, verify:

- [ ] Parse query response has validation
- [ ] Parse mutation response has validation
- [ ] LiveQuery updates have validation
- [ ] Cached data has validation on read
- [ ] External API responses have validation
- [ ] Validation errors are logged with context
- [ ] Invalid data is handled gracefully
- [ ] Schemas are documented and tested
- [ ] Validation is enabled in production
- [ ] Error messages are user-friendly

---

## 9. Testing Validation

```dart
// 📁 test/core/utils/json_validation_test.dart

void main() {
  test('Order validation accepts valid data', () {
    final validOrder = {
      'objectId': '123',
      'customerId': 'cust_123',
      'items': [
        {'productId': 'prod_1', 'quantity': 2, 'price': 1000},
      ],
      'status': 'pending',
      'totalAmount': 2000,
    };

    final result = JsonValidation.validate(validOrder, OrderSchemas.complete());
    expect(result.isValid, true);
  });

  test('Order validation rejects invalid data', () {
    final invalidOrder = {
      'objectId': '123',
      // Missing customerId!
      'items': [],  // Empty items!
      'status': 'invalid_status',  // Not in enum!
      // Missing totalAmount!
    };

    final result = JsonValidation.validate(invalidOrder, OrderSchemas.complete());
    expect(result.isValid, false);
    expect(result.errors.length, greaterThan(0));
  });
}
```

---

## Summary

**MANDATORY**: All JSON from external sources must be validated:
- ✅ Parse API responses (queries, mutations, saves)
- ✅ LiveQuery updates
- ✅ External API responses (Stripe, email service, etc.)
- ✅ Cached data (on read)
- ✅ File uploads

**Process**:
1. Validate JSON structure against schema
2. Throw ValidationException if invalid
3. Repository converts to ValidationFailure
4. BLoC shows error state to user
5. Log validation errors for debugging

**Never skip validation** - Invalid data can cause cascading failures throughout the app.

