# Timeout Strategy Guide
## The Art Deco Bakery - Flutter Application

### Overview
This guide establishes timeout thresholds, retry strategies, and user communication patterns for network operations and long-running tasks.

---

## 1. Standard Timeout Values

### Web Request Timeouts

```dart
// 📁 lib/core/constants/timeout_constants.dart

class TimeoutConstants {
  // Connection & Read timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);  // 30s
  static const Duration readTimeout = Duration(seconds: 30);        // 30s
  static const Duration writeTimeout = Duration(seconds: 30);       // 30s

  // Operation-specific timeouts
  static const Duration fastOperation = Duration(seconds: 5);       // Quick API calls
  static const Duration normalOperation = Duration(seconds: 30);    // Standard API calls
  static const Duration slowOperation = Duration(seconds: 60);      // File uploads

  // UI feedback timeouts
  static const Duration shortDelay = Duration(milliseconds: 500);   // Snackbar duration
  static const Duration normalDelay = Duration(seconds: 2);         // Toast duration
  static const Duration longDelay = Duration(seconds: 5);           // Dialog visibility

  // Retry delays (exponential backoff)
  static const Duration retryDelay1 = Duration(milliseconds: 500);  // First retry
  static const Duration retryDelay2 = Duration(seconds: 2);         // Second retry
  static const Duration retryDelay3 = Duration(seconds: 5);         // Third retry
  static const Duration retryDelayMax = Duration(seconds: 30);      // Max backoff
}
```

### Recommended Thresholds by Operation

| Operation | Timeout | Type | Retry |
|-----------|---------|------|-------|
| **Fast queries** (product list) | 5s | Read | 2x |
| **Normal API calls** (auth, orders) | 30s | Read | 2x |
| **Slow operations** (uploads) | 60s | Write | 1x |
| **Payment processing** | 30s | Write | 1x |
| **LiveQuery subscription** | 30s | Read | 3x |
| **Image load** | 10s | Read | 1x |

---

## 2. Parse Server Timeout Configuration

### HTTP Client Setup

```dart
// 📁 lib/core/services/parse_client_config.dart

class ParseClientConfig {
  static Future<void> initialize() async {
    // Configure Parse HTTP client with timeouts
    final parseHTTPClient = ParseHTTPClient(
      sendSessionToken: true,
      onLog: (message) {
        logger.debug(message);
      },
    );

    // Apply timeout configuration
    parseHTTPClient
      ..connectionTimeout = TimeoutConstants.connectionTimeout
      ..receiveTimeout = TimeoutConstants.readTimeout;

    await Parse.initialize(
      'https://your-parse-server.com',
      'your-app-id',
      masterKey: 'your-master-key',
      clientKey: 'your-client-key',
      debug: false,
      fileDirectory: 'parse_files',
      httpClient: parseHTTPClient,
    );
  }
}
```

### Query Timeout

```dart
// Apply timeout to Parse queries
Future<List<ProductModel>> getProducts() async {
  try {
    final queryBuilder = QueryBuilder<ParseObject>(ParseObject('Product'))
      ..setLimit(100);

    final response = await queryBuilder.query().timeout(
      TimeoutConstants.fastOperation,  // 5s for list query
      onTimeout: () {
        throw TimeoutException('Product query timed out');
      },
    );

    if (!response.success) {
      throw NetworkException(message: 'Failed to fetch products');
    }

    return (response.result as List)
        .map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
        .toList();
  } on TimeoutException {
    throw NetworkException(message: 'Request timed out. Please try again.');
  }
}
```

---

## 3. Retry Strategy Pattern

### Exponential Backoff Retry

```dart
// 📁 lib/core/utils/retry_helper.dart

class RetryHelper {
  /// Retry with exponential backoff
  ///
  /// Example: retry 3 times with delays of 500ms, 2s, 5s
  static Future<T> retryWithBackoff<T>({
    required Future<T> Function() operation,
    required int maxAttempts,
    required Duration initialDelay,
    required Duration maxDelay,
    bool exponential = true,
  }) async {
    int attempt = 1;
    Duration currentDelay = initialDelay;

    while (true) {
      try {
        return await operation();
      } on TimeoutException catch (e) {
        if (attempt >= maxAttempts) {
          rethrow;
        }

        logger.info(
          'Timeout on attempt $attempt, retrying in ${currentDelay.inSeconds}s',
        );

        await Future.delayed(currentDelay);

        // Exponential backoff: delay * 2
        if (exponential) {
          currentDelay = Duration(
            milliseconds: (currentDelay.inMilliseconds * 2)
                .clamp(0, maxDelay.inMilliseconds)
                .toInt(),
          );
        }

        attempt++;
      } catch (e) {
        // Don't retry on non-timeout errors
        rethrow;
      }
    }
  }
}
```

### Usage in Repository

```dart
// 📁 lib/features/product/data/repositories/product_repository_impl.dart

class ProductRepositoryImpl implements ProductRepository {
  @override
  Future<Result<List<Product>>> getProducts() async {
    try {
      final products = await RetryHelper.retryWithBackoff<List<ProductModel>>(
        operation: () => _dataSource.getProducts(),
        maxAttempts: 3,                              // Retry up to 3 times
        initialDelay: TimeoutConstants.retryDelay1,  // Start with 500ms
        maxDelay: TimeoutConstants.retryDelayMax,    // Cap at 30s
        exponential: true,                           // Use exponential backoff
      );

      return Result.success(products);
    } on TimeoutException {
      return Result.failure(NetworkFailure(
        message: 'Request timed out. Check your connection.',
      ));
    } catch (e) {
      return Result.failure(UnexpectedFailure(
        message: 'Failed to fetch products: $e',
      ));
    }
  }
}
```

---

## 4. Per-Feature Timeout Configuration

### Authentication Feature

```dart
// 📁 lib/features/auth/data/datasources/auth_remote_datasource.dart

class AuthRemoteDataSource {
  /// Login timeout: 30s (normal)
  Future<UserModel> login(String email, String password) async {
    try {
      final user = await ParseUser(email, password).login().timeout(
        TimeoutConstants.normalOperation,  // 30s
        onTimeout: () => throw TimeoutException('Login request timed out'),
      );

      return UserModel.fromJson(user.toJson());
    } on TimeoutException {
      throw NetworkException(
        message: 'Login request timed out. Please check your connection.',
      );
    }
  }

  /// Check session: 5s (fast)
  Future<UserModel?> checkSession() async {
    try {
      final currentUser = await ParseUser.currentUser().timeout(
        TimeoutConstants.fastOperation,  // 5s
        onTimeout: () => throw TimeoutException('Session check timed out'),
      );

      return currentUser != null
          ? UserModel.fromJson(currentUser.toJson())
          : null;
    } on TimeoutException {
      // Don't throw - just return null (offline mode ok)
      return null;
    }
  }
}
```

### Checkout Feature (Payment)

```dart
// 📁 lib/features/checkout/data/datasources/payment_remote_datasource.dart

class PaymentRemoteDataSource {
  /// Payment processing: 30s (critical operation)
  Future<PaymentResult> processPayment(PaymentRequest request) async {
    try {
      // First, create order in Parse (5s)
      final order = await _createOrder(request).timeout(
        TimeoutConstants.fastOperation,
        onTimeout: () => throw TimeoutException('Order creation timed out'),
      );

      // Then, process Stripe payment (30s - critical)
      final stripeResult = await _stripe.confirmPayment(
        request.paymentMethodId,
        request.amount,
      ).timeout(
        TimeoutConstants.normalOperation,
        onTimeout: () => throw TimeoutException('Payment processing timed out'),
      );

      // Finally, update order status (5s)
      await _updateOrderStatus(order.id, stripeResult).timeout(
        TimeoutConstants.fastOperation,
        onTimeout: () => throw TimeoutException('Status update timed out'),
      );

      return PaymentResult.fromJson(stripeResult);
    } on TimeoutException catch (e) {
      // Log timeout but don't throw - payment may have gone through
      logger.warning('Payment timeout: ${e.message}');

      // Return unknown status - will be checked later
      return PaymentResult(
        status: 'unknown',
        message: 'Payment may have been processed. Checking status...',
      );
    }
  }
}
```

### Product Upload Feature

```dart
// 📁 lib/features/admin/product_management/data/datasources/product_datasource.dart

class ProductManagementDataSource {
  /// File upload: 60s (slow operation, needs retry)
  Future<String> uploadProductImage(File imageFile) async {
    try {
      return await RetryHelper.retryWithBackoff(
        operation: () => _uploadFile(imageFile).timeout(
          TimeoutConstants.slowOperation,  // 60s
          onTimeout: () => throw TimeoutException('Upload timed out'),
        ),
        maxAttempts: 2,                    // Retry once on timeout
        initialDelay: TimeoutConstants.retryDelay1,
        maxDelay: TimeoutConstants.retryDelay2,
      );
    } on TimeoutException {
      throw NetworkException(
        message: 'Image upload timed out. Please try again.',
      );
    }
  }
}
```

---

## 5. User Communication During Timeouts

### Show Loading Indicator

```dart
// 📁 lib/features/order/presentation/pages/order_list_page.dart

class OrderListPage extends StatefulWidget {
  @override
  State<OrderListPage> createState() => _OrderListPageState();
}

class _OrderListPageState extends State<OrderListPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocBuilder<OrderBloc, OrderState>(
        builder: (context, state) {
          return switch (state) {
            OrderLoading() => _buildLoadingWidget(),
            OrderLoaded(:final orders) => _buildOrdersList(orders),
            OrderError(:final message) => _buildErrorWidget(message),
            _ => const SizedBox(),
          };
        },
      ),
    );
  }

  Widget _buildLoadingWidget() => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(),
        const SizedBox(height: 16),
        const Text('Loading orders...'),
        const SizedBox(height: 24),
        // Show timeout warning after 10 seconds
        _buildTimeoutWarning(),
      ],
    ),
  );

  Widget _buildTimeoutWarning() => FutureBuilder(
    future: Future.delayed(Duration(seconds: 10)),
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.done) {
        return Text(
          'This is taking longer than usual...',
          style: TextStyle(color: CupertinoColors.systemGrey),
        );
      }
      return const SizedBox();
    },
  );

  Widget _buildErrorWidget(String message) => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(CupertinoIcons.exclamationmark_circle),
        const SizedBox(height: 16),
        Text(message),
        const SizedBox(height: 16),
        CupertinoButton(
          onPressed: () {
            // Retry with fresh timeout
            context.read<OrderBloc>().add(LoadOrdersEvent());
          },
          child: const Text('Retry'),
        ),
      ],
    ),
  );

  Widget _buildOrdersList(List<Order> orders) => ListView.builder(
    itemCount: orders.length,
    itemBuilder: (context, index) => OrderCard(order: orders[index]),
  );
}
```

### Timeout-Specific Error Messages

```dart
// ✅ Good: Clear, actionable messages
'Request timed out. Please check your connection and try again.'
'Payment processing is taking longer than usual. Do not close the app.'
'Upload failed due to slow connection. Please try again.'

// ❌ Bad: Vague, technical messages
'Timeout Exception'
'HTTP 504 Gateway Timeout'
'Connection timed out after 30000ms'
```

---

## 6. Handle Ambiguous States (Payment Timeout)

### Payment Timeout Recovery

```dart
// 📁 lib/features/checkout/presentation/bloc/checkout_bloc.dart

class CheckoutBloc extends Bloc<CheckoutEvent, CheckoutState> {
  final CheckoutRepository _repository;

  CheckoutBloc({required CheckoutRepository repository})
      : _repository = repository,
        super(const CheckoutInitial()) {
    on<ProcessPaymentEvent>(_onProcessPayment);
    on<CheckPaymentStatusEvent>(_onCheckPaymentStatus);
  }

  Future<void> _onProcessPayment(
    ProcessPaymentEvent event,
    Emitter<CheckoutState> emit,
  ) async {
    emit(const PaymentProcessing());

    final result = await _repository.processPayment(event.request);

    result.when(
      success: (paymentResult) {
        if (paymentResult.status == 'succeeded') {
          emit(PaymentSuccess(paymentId: paymentResult.id));
        } else if (paymentResult.status == 'unknown') {
          // Payment timed out - check status
          emit(PaymentCheckingStatus(paymentId: paymentResult.id));
          add(CheckPaymentStatusEvent(paymentId: paymentResult.id));
        } else {
          emit(PaymentError(message: 'Payment failed'));
        }
      },
      failure: (failure) {
        emit(PaymentError(message: failure.message));
      },
    );
  }

  Future<void> _onCheckPaymentStatus(
    CheckPaymentStatusEvent event,
    Emitter<CheckoutState> emit,
  ) async {
    // Check payment status with retry
    final statusResult = await RetryHelper.retryWithBackoff(
      operation: () => _repository.checkPaymentStatus(event.paymentId),
      maxAttempts: 3,
      initialDelay: TimeoutConstants.retryDelay1,
      maxDelay: TimeoutConstants.retryDelayMax,
    );

    statusResult.when(
      success: (status) {
        if (status.isPaid) {
          emit(PaymentSuccess(paymentId: event.paymentId));
        } else {
          emit(PaymentError(message: 'Payment was not processed'));
        }
      },
      failure: (failure) {
        emit(PaymentError(
          message: 'Cannot confirm payment status. Please contact support.',
        ));
      },
    );
  }
}
```

---

## 7. Testing Timeout Behavior

### Unit Test

```dart
// 📁 test/features/product/data/repositories/product_repository_test.dart

void main() {
  group('ProductRepository timeout handling', () {
    test('retries on timeout', () async {
      int callCount = 0;

      final result = await RetryHelper.retryWithBackoff(
        operation: () async {
          callCount++;
          if (callCount < 2) {
            throw TimeoutException('Simulated timeout');
          }
          return ['product1', 'product2'];
        },
        maxAttempts: 3,
        initialDelay: Duration(milliseconds: 100),
        maxDelay: Duration(milliseconds: 200),
      );

      expect(result, ['product1', 'product2']);
      expect(callCount, 2);  // Called twice (once failed, once succeeded)
    });

    test('fails after max retries', () async {
      final future = RetryHelper.retryWithBackoff(
        operation: () async =>
            throw TimeoutException('Always timeout'),
        maxAttempts: 2,
        initialDelay: Duration(milliseconds: 10),
        maxDelay: Duration(milliseconds: 20),
      );

      expect(future, throwsA(isA<TimeoutException>()));
    });
  });
}
```

---

## 8. Timeout Checklist

For each network operation:

- [ ] Set appropriate timeout (5s/30s/60s based on operation)
- [ ] Implement retry logic (exponential backoff)
- [ ] Handle TimeoutException specifically
- [ ] Show loading indicator during operation
- [ ] Warn user if operation takes >10 seconds
- [ ] Provide retry button on timeout
- [ ] Log timeout with context (operation, attempt, etc.)
- [ ] Test timeout behavior

---

## 9. Configuration by Build Type

```dart
// 📁 lib/core/constants/timeout_constants.dart

class TimeoutConstants {
  static const Duration normalOperation = kDebugMode
      ? Duration(seconds: 60)  // Debug: generous timeouts
      : Duration(seconds: 30);  // Production: strict timeouts

  static const Duration fastOperation = kDebugMode
      ? Duration(seconds: 15)
      : Duration(seconds: 5);

  static const int maxRetries = kDebugMode
      ? 5  // Debug: more retries
      : 2;  // Production: fewer retries
}
```

---

## Summary

**Standard Timeouts:**
- **Fast operations** (queries, checks): 5s
- **Normal operations** (API calls): 30s
- **Slow operations** (uploads): 60s

**Retry Strategy:**
- Exponential backoff (500ms → 2s → 5s → 30s)
- Fast operations: 2 retries
- Normal operations: 2 retries
- Slow operations: 1 retry
- Critical operations (payment): Check status

**User Communication:**
- Show loading indicator immediately
- Warn after 10 seconds
- Provide retry button on timeout
- Clear, actionable error messages

**Never:**
- Silently fail on timeout
- Use generic timeout messages
- Skip retry for transient failures
- Allow infinite retries

