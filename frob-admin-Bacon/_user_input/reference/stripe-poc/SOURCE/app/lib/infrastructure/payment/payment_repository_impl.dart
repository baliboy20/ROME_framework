import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;

import '../../domain/payment/payment_entities.dart';
import '../../domain/payment/payment_repository.dart';

/// Thrown when the Worker API returns a non-2xx response or an unexpected
/// payload shape. Kept small and message-only — the BLoC layer only needs
/// to surface `error.toString()` to the UI for this POC.
class PaymentApiException implements Exception {
  final String message;
  PaymentApiException(this.message);

  @override
  String toString() => message;
}

/// `PaymentRepository` implementation backed by `package:http` calls to the
/// Cloudflare Worker API described in the POC's API contract:
///
///   `POST {apiBaseUrl}/api/checkout-session`
///     body: `{ amount, reference, customer_email? }`
///     -> `{ clientSecret, sessionId }`
///
///   `GET  {apiBaseUrl}/api/session-status?session_id=&lt;id&gt;`
///     -> `{ status: open|complete|expired, payment_status: paid|unpaid|no_payment_required }`
/// Generates a random per-submit idempotency key. Not a full UUID — a POC-adequate random
/// hex string is enough to guarantee two distinct "Pay" clicks never collide.
String _generateIdempotencyKey() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}

class PaymentRepositoryImpl implements PaymentRepository {
  final String apiBaseUrl;
  final http.Client _client;

  PaymentRepositoryImpl({required this.apiBaseUrl, http.Client? client})
    : _client = client ?? http.Client();

  @override
  Future<CheckoutSessionCreated> createCheckoutSession({
    required int amountPence,
    required String reference,
    String? customerEmail,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/api/checkout-session');
    final response = await _client.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        // A fresh key per submit attempt (S1). Without this, the Worker falls back to a key
        // derived only from reference+amount — with this POC's fixed £25.00 test amount and
        // default reference, that made EVERY "Pay" click collide on the exact same Stripe
        // idempotency key, silently returning the same (eventually already-completed/refunded)
        // Checkout Session forever instead of creating a new one. See LEARNINGS.md.
        'Idempotency-Key': _generateIdempotencyKey(),
      },
      body: jsonEncode({
        'amount': amountPence,
        'reference': reference,
        if (customerEmail != null && customerEmail.isNotEmpty)
          'customer_email': customerEmail,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw PaymentApiException(
        'Failed to create checkout session (HTTP ${response.statusCode}): '
        '${response.body}',
      );
    }

    final Map<String, dynamic> json =
        jsonDecode(response.body) as Map<String, dynamic>;
    final clientSecret = json['clientSecret'] as String?;
    final sessionId = json['sessionId'] as String?;
    if (clientSecret == null || sessionId == null) {
      throw PaymentApiException(
        'Malformed response from /api/checkout-session: ${response.body}',
      );
    }

    return CheckoutSessionCreated(
      clientSecret: clientSecret,
      sessionId: sessionId,
    );
  }

  @override
  Future<SessionStatus> getSessionStatus(String sessionId) async {
    final uri = Uri.parse(
      '$apiBaseUrl/api/session-status',
    ).replace(queryParameters: {'session_id': sessionId});
    final response = await _client.get(uri);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw PaymentApiException(
        'Failed to fetch session status (HTTP ${response.statusCode}): '
        '${response.body}',
      );
    }

    final Map<String, dynamic> json =
        jsonDecode(response.body) as Map<String, dynamic>;
    final status = json['status'] as String?;
    final paymentStatus = json['payment_status'] as String?;
    if (status == null || paymentStatus == null) {
      throw PaymentApiException(
        'Malformed response from /api/session-status: ${response.body}',
      );
    }

    return SessionStatus.fromWireValues(
      status: status,
      paymentStatus: paymentStatus,
    );
  }
}
