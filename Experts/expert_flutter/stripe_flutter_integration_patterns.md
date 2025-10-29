# Stripe Payment Integration Flutter Patterns
## The Art Deco Bakery - Flutter Application

### Overview
This document defines secure payment processing patterns using Stripe Payment Element. The integration ensures PCI compliance and handles 3D Secure authentication flows.

---

## 1. Payment Flow Architecture

```
┌─────────────────────────────────────────────┐
│ 1. Customer adds items to cart              │
│    CartBloc manages cart state              │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. Customer enters delivery details         │
│    DeliveryInfoPage collects address       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. CheckoutPage shows payment form         │
│    StripePaymentForm handles card input    │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. Create payment intent on backend        │
│    Backend generates clientSecret          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. Initialize Stripe Payment Element       │
│    StripePaymentHandler mounts form        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 6. User submits payment                    │
│    Stripe processes payment securely       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 7. Confirm payment intent                   │
│    Backend confirms payment status         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 8. Create order in database                │
│    OrderBloc manages new order             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 9. Show confirmation page                  │
│    OrderConfirmationPage displays summary  │
└─────────────────────────────────────────────┘
```

---

## 2. Stripe Payment Handler

The `StripePaymentHandler` manages JavaScript interop with Stripe.js.

```dart
// 📁 lib/core/services/stripe_payment_handler.dart

import 'dart:async';
import 'dart:js' as js;

/// Handles Stripe Payment Element integration with Dart/Flutter web
///
/// Provides interface between Flutter and Stripe.js for secure payment processing
class StripePaymentHandler {
  static const String _publishableKey = 'publishable_key';

  late final Completer<String> _paymentResultCompleter;

  /// Initialize Stripe with publishable key
  void initialize() {
    try {
      // Initialize Stripe on JS side
      final result = js.context.callMethod('initStripe', [_publishableKey]);
      if (result == true) {
        print('✅ Stripe initialized successfully');
      } else {
        print('❌ Failed to initialize Stripe');
      }

      // Set up callbacks for payment results
      js.context['onPaymentSuccess'] = (String message) {
        _handlePaymentSuccess(message);
      };

      js.context['onPaymentError'] = (String message) {
        _handlePaymentError(message);
      };
    } catch (e) {
      print('❌ Error initializing Stripe: $e');
    }
  }

  /// Create and mount Payment Element
  ///
  /// @param clientSecret - PaymentIntent client secret from backend
  /// @param containerId - HTML element ID where payment element will mount
  Future<bool> initPaymentElement({
    required String clientSecret,
    String containerId = 'payment-element',
  }) async {
    try {
      print('📝 Initializing payment element with client secret');

      final result = js.context.callMethod(
        'initPaymentElement',
        [clientSecret, containerId],
      );

      if (result == true) {
        print('✅ Payment element initialized');
        return true;
      } else {
        print('❌ Failed to initialize payment element');
        return false;
      }
    } catch (e) {
      print('❌ Error initializing payment element: $e');
      return false;
    }
  }

  /// Submit payment and confirm payment intent
  ///
  /// Blocks until payment is completed or fails
  ///
  /// @param returnUrl - URL to redirect after 3DS authentication (if needed)
  /// @returns PaymentResult with success status and message
  Future<PaymentResult> submitPayment({
    required String returnUrl,
  }) async {
    try {
      print('💳 Submitting payment...');

      // Create completer to wait for payment result
      _paymentResultCompleter = Completer<String>();

      // Call JS to submit payment
      js.context.callMethod('submitPayment', [returnUrl]);

      // Wait for result callback
      final result = await _paymentResultCompleter.future.timeout(
        const Duration(seconds: 30),
        onTimeout: () => 'TIMEOUT',
      );

      if (result == 'SUCCESS') {
        return PaymentResult(
          success: true,
          message: 'Payment completed successfully',
        );
      } else if (result == 'TIMEOUT') {
        return PaymentResult(
          success: false,
          message: 'Payment processing timeout. Please check your order status.',
        );
      } else {
        return PaymentResult(
          success: false,
          message: result,
        );
      }
    } catch (e) {
      return PaymentResult(
        success: false,
        message: 'Payment error: $e',
      );
    }
  }

  void _handlePaymentSuccess(String message) {
    if (!_paymentResultCompleter.isCompleted) {
      _paymentResultCompleter.complete('SUCCESS');
    }
  }

  void _handlePaymentError(String message) {
    if (!_paymentResultCompleter.isCompleted) {
      _paymentResultCompleter.complete('ERROR: $message');
    }
  }
}

class PaymentResult {
  final bool success;
  final String message;

  PaymentResult({
    required this.success,
    required this.message,
  });
}
```

---

## 3. Stripe Payment Form Widget

The payment form widget provides the UI for card entry.

```dart
// 📁 lib/features/checkout/presentation/widgets/stripe_payment_form.dart

class StripePaymentForm extends StatefulWidget {
  final String clientSecret;
  final VoidCallback onPaymentSuccess;
  final Function(String error) onPaymentError;

  const StripePaymentForm({
    required this.clientSecret,
    required this.onPaymentSuccess,
    required this.onPaymentError,
  });

  @override
  State<StripePaymentForm> createState() => _StripePaymentFormState();
}

class _StripePaymentFormState extends State<StripePaymentForm> {
  late final StripePaymentHandler _stripeHandler;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _stripeHandler = StripePaymentHandler();
    _initializeStripe();
  }

  Future<void> _initializeStripe() async {
    _stripeHandler.initialize();

    // Initialize payment element
    final success = await _stripeHandler.initPaymentElement(
      clientSecret: widget.clientSecret,
    );

    if (!success) {
      widget.onPaymentError('Failed to initialize payment form');
    }
  }

  Future<void> _submitPayment() async {
    setState(() => _isLoading = true);

    final result = await _stripeHandler.submitPayment(
      returnUrl: '${Uri.base.origin}/order-confirmation',
    );

    setState(() => _isLoading = false);

    if (result.success) {
      widget.onPaymentSuccess();
    } else {
      widget.onPaymentError(result.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Stripe Payment Element will be mounted here
        const HtmlElementView(viewType: 'payment-element'),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _isLoading ? null : _submitPayment,
          child: _isLoading
              ? const CircularProgressIndicator()
              : const Text('Pay Now'),
        ),
      ],
    );
  }
}
```

---

## 4. Checkout Page Implementation

The checkout page orchestrates the payment flow.

```dart
// 📁 lib/features/checkout/presentation/pages/checkout_page.dart

class CheckoutPage extends StatefulWidget {
  const CheckoutPage({Key? key}) : super(key: key);

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  late String _clientSecret;
  bool _isLoadingPayment = false;

  @override
  void initState() {
    super.initState();
    _preparePayment();
  }

  Future<void> _preparePayment() async {
    // 1. Get cart total
    final cartState = context.read<CartBloc>().state;
    if (cartState is! CartLoaded) return;

    final totalInPence = cartState.cart.totalInPence;

    // 2. Create payment intent via backend
    try {
      final result = await _createPaymentIntent(totalInPence);
      setState(() => _clientSecret = result['clientSecret']);
    } catch (e) {
      _showError('Failed to prepare payment: $e');
    }
  }

  Future<Map<String, dynamic>> _createPaymentIntent(int amount) async {
    // Call Parse Cloud Function
    final result = await ParseCloudFunction('createPaymentIntent').executeObjectReturning(
      parameters: {
        'amount': amount,
        'currency': 'gbp',
      },
    );
    return result as Map<String, dynamic>;
  }

  void _onPaymentSuccess() {
    // Get necessary data for order
    final cartState = context.read<CartBloc>().state as CartLoaded;
    final authState = context.read<AuthBloc>().state as Authenticated;

    // Create order with payment details
    context.read<OrderBloc>().add(CreateOrderEvent(
      cart: cartState.cart,
      deliveryAddress: _deliveryAddress,
      paymentDetails: PaymentDetailsEntity(
        subtotalInPence: cartState.cart.subtotalInPence,
        taxInPence: cartState.cart.taxInPence,
        deliveryFeeInPence: cartState.cart.deliveryFeeInPence,
        discountInPence: cartState.cart.discountInPence,
        totalInPence: cartState.cart.totalInPence,
        paymentMethod: PaymentMethod.card,
        paymentStatus: PaymentStatus.paid,
        paidAt: DateTime.now(),
      ),
    ));

    // Navigate to confirmation
    context.goNamed('orderConfirmation');
  }

  void _onPaymentError(String error) {
    _showError('Payment failed: $error');
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Order summary
            OrderSummaryWidget(),

            const SizedBox(height: 24),

            // Delivery details
            DeliveryDetailsWidget(),

            const SizedBox(height: 24),

            // Stripe payment form
            if (_clientSecret.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16),
                child: StripePaymentForm(
                  clientSecret: _clientSecret,
                  onPaymentSuccess: _onPaymentSuccess,
                  onPaymentError: _onPaymentError,
                ),
              )
            else
              const Center(
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
}
```

---

## 5. Backend Integration (Parse Cloud Functions)

Payment intents are created and confirmed server-side for security.

```javascript
// parse-server/cloud/functions/paymentProcessing.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

Parse.Cloud.define('createPaymentIntent', async (request) => {
  const { amount, currency, orderId } = request.params;

  try {
    console.log(`💳 Creating payment intent for amount: ${amount} ${currency}`);

    // Create Stripe PaymentIntent via backend API
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,  // in pence/cents
      currency: currency || 'gbp',
      metadata: {
        orderId: orderId,
        appName: 'art-deco-bakery',
      },
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error(`❌ Error creating payment intent: ${error.message}`);
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, error.message);
  }
});

Parse.Cloud.define('confirmPayment', async (request) => {
  const { paymentIntentId } = request.params;

  try {
    console.log(`📝 Confirming payment: ${paymentIntentId}`);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      console.log(`✅ Payment confirmed: ${paymentIntentId}`);

      // Update order status in database
      const Order = Parse.Object.extend('Order');
      const order = new Order();
      order.id = paymentIntent.metadata.orderId;
      order.set('paymentStatus', 'paid');
      order.set('paymentIntentId', paymentIntentId);
      order.set('transactionId', paymentIntent.id);
      await order.save(null, { useMasterKey: true });

      return {
        success: true,
        message: 'Payment confirmed',
        orderId: paymentIntent.metadata.orderId,
      };
    } else {
      console.warn(`⚠️  Payment status: ${paymentIntent.status}`);
      throw new Error(`Payment status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error(`❌ Error confirming payment: ${error.message}`);
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, error.message);
  }
});

Parse.Cloud.define('handlePaymentWebhook', async (request) => {
  const sig = request.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      webhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
        // Handle successful payment
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.error(`❌ PaymentIntent failed: ${failedIntent.id}`);
        // Handle failed payment
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        console.log(`💰 Refund processed: ${refund.id}`);
        // Handle refund
        break;
    }

    return { received: true };
  } catch (error) {
    console.error(`❌ Webhook error: ${error.message}`);
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, error.message);
  }
});
```

---

## 6. Card Validators & Formatters

Input validation for card fields.

```dart
// 📁 lib/features/checkout/presentation/validators/card_validators.dart

class CardValidators {
  /// Validate card number using Luhn algorithm
  static String? validateCardNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Card number is required';
    }

    final cleanedNumber = value.replaceAll(' ', '');

    // Check length (typically 13-19 digits)
    if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
      return 'Card number must be 13-19 digits';
    }

    // Luhn algorithm validation
    if (!_luhnCheck(cleanedNumber)) {
      return 'Card number is invalid';
    }

    return null;
  }

  /// Validate expiry date (MM/YY format)
  static String? validateExpiry(String? value) {
    if (value == null || value.isEmpty) {
      return 'Expiry date is required';
    }

    if (!RegExp(r'^\d{2}/\d{2}$').hasMatch(value)) {
      return 'Expiry date must be MM/YY';
    }

    final parts = value.split('/');
    final month = int.tryParse(parts[0]);
    final year = int.tryParse(parts[1]);

    if (month == null || month < 1 || month > 12) {
      return 'Month must be 01-12';
    }

    final now = DateTime.now();
    final cardYear = 2000 + (year ?? 0);

    if (cardYear < now.year || (cardYear == now.year && month < now.month)) {
      return 'Card has expired';
    }

    return null;
  }

  /// Validate CVV (3-4 digits)
  static String? validateCVV(String? value) {
    if (value == null || value.isEmpty) {
      return 'CVV is required';
    }

    if (!RegExp(r'^\d{3,4}$').hasMatch(value)) {
      return 'CVV must be 3-4 digits';
    }

    return null;
  }

  /// Validate cardholder name
  static String? validateCardholderName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Cardholder name is required';
    }

    if (value.length < 3) {
      return 'Name must be at least 3 characters';
    }

    return null;
  }

  /// Luhn algorithm for card number validation
  static bool _luhnCheck(String cardNumber) {
    int sum = 0;
    bool isEven = false;

    for (int i = cardNumber.length - 1; i >= 0; i--) {
      int n = int.parse(cardNumber[i]);

      if (isEven) {
        n *= 2;
        if (n > 9) {
          n -= 9;
        }
      }

      sum += n;
      isEven = !isEven;
    }

    return sum % 10 == 0;
  }
}
```

---

## 7. Input Formatters for Card Fields

```dart
// 📁 lib/features/checkout/presentation/input_formatters/card_number_input_formatter.dart

class CardNumberInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text;

    if (newValue.selection.baseOffset == 0) {
      return newValue;
    }

    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex % 4 == 0 && nonZeroIndex != text.length) {
        buffer.write(' ');
      }
    }

    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

// 📁 lib/features/checkout/presentation/input_formatters/expiry_input_formatter.dart

class ExpiryInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text;

    if (newValue.selection.baseOffset == 0) {
      return newValue;
    }

    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      if (i == 1) {
        buffer.write('/');
      }
    }

    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
```

---

## 8. Best Practices

### ✅ DO's
- ✅ Create payment intents server-side
- ✅ Use Stripe Payment Element for tokenless payments
- ✅ Handle 3D Secure authentication
- ✅ Implement proper error messages
- ✅ Validate card input on client
- ✅ Confirm payments before creating orders
- ✅ Log payment events for debugging
- ✅ Test with Stripe test mode first

### ❌ DON'Ts
- ❌ Don't store card data in app
- ❌ Don't send card data to backend
- ❌ Don't hardcode Stripe keys in Flutter
- ❌ Don't skip payment confirmation
- ❌ Don't ignore payment timeouts
- ❌ Don't expose error details to users
- ❌ Don't test with real cards
- ❌ Don't handle sensitive data in widgets

---

## 9. Integration Checklist

### Stripe Setup
- [ ] Stripe account created and configured
- [ ] Test publishable key in code
- [ ] Live secret key in backend only
- [ ] Webhook endpoints configured
- [ ] 3DS enabled for security

### Payment Handler
- [ ] StripePaymentHandler initialized
- [ ] Payment Element properly mounted
- [ ] Client secret passed securely
- [ ] Payment success/error callbacks implemented
- [ ] Timeout handling implemented

### Form Validation
- [ ] Card number validated with Luhn
- [ ] Expiry date validated
- [ ] CVV validated
- [ ] Cardholder name validated
- [ ] Input formatters applied

### Order Creation
- [ ] Payment confirmed before creating order
- [ ] Order created with payment details
- [ ] Confirmation page shows order details
- [ ] Email sent after successful payment
- [ ] Refund process documented

---

## 10. Testing Stripe Integration

Test with Stripe test mode cards:

```
// Successful payment
4242 4242 4242 4242

// Card declined (generic)
4000 0000 0000 0002

// Requires 3D Secure
4000 0025 0000 3010

// Expired card
4000 0000 0000 0069

// Insufficient funds
4000 0000 0000 9995
```

---

## Conclusion

Stripe Payment Element integration provides:
- 🔐 PCI compliance through tokenless payments
- 💳 Secure card processing
- 🛡️ 3D Secure authentication
- 📱 Mobile-optimized forms
- 💰 Multiple payment methods support
- 🔄 Proper error handling and recovery

Follow these patterns for secure payment processing.
