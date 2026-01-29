# Flutter Integration Patterns

**ID**: flutter-integration-patterns
**Category**: Frontend & UI / Backend Integration
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Implement backend service integrations following proven patterns for Parse Server, Stripe payments, email, and image storage

## Inputs

- api-design.md (backend API contracts)
- tech-stack.md (selected backend services)
- use-cases.md (integration requirements)

## Outputs

- Data source implementations for each service
- Type-safe API clients
- Error handling for network/service failures
- Timeout and retry strategies

## Parse Server Integration

### Native SDK Usage (parse_server_sdk_flutter)

**✅ DO:**
```dart
// Use native Parse SDK
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

class UserRemoteDataSource {
  Future<UserModel> getUser(String id) async {
    final query = QueryBuilder<ParseObject>(ParseObject('User'))
      ..whereEqualTo('objectId', id);

    final response = await query.query();

    if (response.success && response.results != null) {
      final parseObject = response.results!.first as ParseObject;
      return UserModel.fromParseObject(parseObject);
    }

    throw ServerException(response.error?.message ?? 'Unknown error');
  }
}
```

**❌ DON'T:**
```dart
// Don't create custom HTTP wrapper for Parse
class ParseApiClient { // ❌ Anti-pattern
  Future<Map<String, dynamic>> get(String path) async {
    return await http.get(Uri.parse('$baseUrl$path'));
  }
}
```

### JSON Validation (CRITICAL)

**Always validate Parse responses:**
```dart
import 'package:json_validation/json_validation.dart';

Future<UserModel> getUser(String id) async {
  final response = await query.query();

  if (response.success && response.results != null) {
    final json = (response.results!.first as ParseObject).toJson();

    // ✅ Validate JSON structure
    final validator = JsonValidator({
      'objectId': [isString, isNotEmpty],
      'email': [isString, isEmail],
      'name': [isString, isNotEmpty],
      'createdAt': [isString, isNotEmpty],
    });

    if (!validator.validate(json)) {
      throw ParsingException('Invalid user data: ${validator.errors}');
    }

    return UserModel.fromJson(json);
  }

  throw ServerException(response.error?.message ?? 'User not found');
}
```

### Query Patterns

```dart
// Simple query
final query = QueryBuilder<ParseObject>(ParseObject('Product'))
  ..whereEqualTo('category', 'electronics');

// Complex query with includes
final query = QueryBuilder<ParseObject>(ParseObject('Order'))
  ..whereEqualTo('userId', currentUserId)
  ..includeObject(['products', 'customer'])
  ..orderByDescending('createdAt')
  ..setLimit(20);

// Query with relations
final user = await ParseUser.currentUser();
final query = QueryBuilder<ParseObject>(ParseObject('Task'))
  ..whereRelatedTo('assignedTo', 'User', user!.objectId!);
```

### Authentication Flow

```dart
class AuthRemoteDataSource {
  Future<UserModel> login(String email, String password) async {
    final user = ParseUser(email, password, email);

    final response = await user.login();

    if (response.success && response.result != null) {
      final parseUser = response.result as ParseUser;
      return UserModel.fromParseUser(parseUser);
    }

    throw AuthException(response.error?.message ?? 'Login failed');
  }

  Future<void> logout() async {
    final user = await ParseUser.currentUser();
    if (user != null) {
      await user.logout();
    }
  }

  Future<bool> isLoggedIn() async {
    final user = await ParseUser.currentUser();
    return user != null && user.sessionToken != null;
  }
}
```

## Stripe Payment Integration

### Payment Intent Flow

```dart
class StripePaymentService {
  final Stripe _stripe;
  final PaymentRemoteDataSource _remoteDataSource;

  Future<Result<PaymentResult>> processPayment({
    required double amount,
    required String currency,
  }) async {
    try {
      // 1. Create payment intent on backend
      final clientSecret = await _remoteDataSource.createPaymentIntent(
        amount: amount,
        currency: currency,
      );

      // 2. Confirm payment with Stripe
      final paymentIntent = await _stripe.confirmPayment(
        paymentIntentClientSecret: clientSecret,
        options: PaymentMethodOptions(
          setupFutureUsage: PaymentIntentSetupFutureUsage.OffSession,
        ),
      );

      // 3. Handle result
      if (paymentIntent.status == PaymentIntentStatus.Succeeded) {
        return Success(PaymentResult.success(paymentIntent.id));
      } else {
        return Failure('Payment ${paymentIntent.status}');
      }
    } on StripeException catch (e) {
      return Failure('Payment error: ${e.error.localizedMessage}');
    } on TimeoutException {
      return Failure('Payment timeout - please check your payment status');
    }
  }
}
```

### Timeout Strategy for Payments

```dart
Future<Result<T>> withPaymentTimeout<T>(
  Future<T> Function() operation,
) async {
  try {
    return await operation().timeout(
      const Duration(seconds: 60), // Longer timeout for payments
      onTimeout: () => throw TimeoutException(Duration(seconds: 60)),
    );
  } on TimeoutException {
    // Payment may have succeeded - user must check status
    throw PaymentTimeoutException(
      'Payment is processing. Check your email for confirmation.',
    );
  }
}
```

## Email Integration

```dart
class EmailService {
  final ParseCloudFunction _cloudFunction;

  Future<Result<void>> sendEmail({
    required String to,
    required String subject,
    required String body,
  }) async {
    try {
      final response = await _cloudFunction.execute(
        functionName: 'sendEmail',
        parameters: {
          'to': to,
          'subject': subject,
          'body': body,
        },
      );

      if (response.success) {
        return Success(null);
      }

      return Failure(response.error?.message ?? 'Email send failed');
    } on TimeoutException {
      return Failure('Email service timeout');
    } on NetworkException {
      return Failure('Network error - email not sent');
    }
  }
}
```

## Image Storage Integration

```dart
class ImageStorageService {
  final Parse _parse;

  Future<Result<String>> uploadImage(File imageFile) async {
    try {
      final parseFile = ParseFile(imageFile);

      final response = await parseFile.save().timeout(
        const Duration(seconds: 30),
      );

      if (response.success && parseFile.url != null) {
        return Success(parseFile.url!);
      }

      return Failure('Image upload failed');
    } on TimeoutException {
      return Failure('Upload timeout - image too large or slow connection');
    }
  }

  Future<Result<void>> deleteImage(String imageUrl) async {
    try {
      final parseFile = ParseFile(null, url: imageUrl);
      await parseFile.delete();
      return Success(null);
    } catch (e) {
      return Failure('Image deletion failed: $e');
    }
  }
}
```

## Timeout Strategy

**Standard timeout values:**
```dart
class TimeoutDurations {
  static const fast = Duration(seconds: 5);      // Quick operations
  static const normal = Duration(seconds: 30);   // Standard API calls
  static const slow = Duration(seconds: 60);     // Uploads, payments
}
```

**Retry with exponential backoff:**
```dart
Future<Result<T>> retryWithBackoff<T>({
  required Future<T> Function() operation,
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
}) async {
  int attempt = 0;
  Duration delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return Success(await operation());
    } catch (e) {
      attempt++;
      if (attempt >= maxRetries) {
        return Failure('Failed after $maxRetries attempts');
      }
      await Future.delayed(delay);
      delay *= 2; // Exponential backoff
    }
  }

  return Failure('Unexpected error');
}
```

## Process

1. **Choose Integration Pattern** - Parse, Stripe, email, or image
2. **Use Native SDKs** - Don't create custom HTTP wrappers
3. **Validate JSON** - Use json_validation for Parse responses
4. **Handle Timeouts** - Use appropriate timeout duration
5. **Implement Retry** - Exponential backoff for transient failures
6. **Error Handling** - Convert exceptions to Result types
7. **Test Integration** - Mock Parse/Stripe in tests

## Expert References

**Primary Guides** (see Experts/expert_flutter/):
- `03_INTEGRATIONS/parse_flutter_integration_patterns.md` (24KB) - Parse SDK usage
- `03_INTEGRATIONS/stripe_flutter_integration_patterns.md` (23KB) - Payment flow
- `03_INTEGRATIONS/email_flutter_integration_patterns.md` (11KB) - Email sending
- `03_INTEGRATIONS/image_storage_integration_patterns.md` (5KB) - Image upload
- `02_PATTERNS/timeout_strategy_guide.md` (17KB) - Timeout values and retry

**Related Guides:**
- `01_CORE/antipatterns_and_approved_libraries_expert.md` - Don't create Parse wrapper
- `01_CORE/error_handling_patterns_expert.md` - Exception handling

## AORDL Traceability

- API contracts → Data source implementations
- Payment requirements → Stripe integration
- Email notifications → Email service
- Image upload → Image storage service

---

**Version**: 1.0
**Based on**: Experts/expert_flutter/03_INTEGRATIONS/
**Last Updated**: 2026-01-29
