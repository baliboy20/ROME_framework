import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../domain/admin/admin_entities.dart';
import '../../domain/admin/admin_repository.dart';

/// Thrown when the Worker admin API returns a non-2xx response or an
/// unexpected payload shape. Message-only, mirroring `PaymentApiException` —
/// the BLoC layer surfaces `error.toString()` directly to the UI.
class AdminApiException implements Exception {
  final String message;
  AdminApiException(this.message);

  @override
  String toString() => message;
}

/// `AdminRepository` implementation backed by `package:http` calls to the
/// Cloudflare Worker admin API described in the POC's API contract:
///
///   `GET  {apiBaseUrl}/api/admin/payments`
///     header: `X-Admin-Key: <key>`
///     -> `{ payments: [...] }`
///
///   `POST {apiBaseUrl}/api/admin/refund`
///     header: `X-Admin-Key: <key>`
///     body: `{ session_id, amount? }`
///     -> `{ refundId, status, amount }`
class AdminRepositoryImpl implements AdminRepository {
  final String apiBaseUrl;
  final String adminApiKey;
  final http.Client _client;

  AdminRepositoryImpl({
    required this.apiBaseUrl,
    required this.adminApiKey,
    http.Client? client,
  }) : _client = client ?? http.Client();

  Map<String, String> get _headers => {
    'X-Admin-Key': adminApiKey,
    'Content-Type': 'application/json',
  };

  @override
  Future<List<AdminPaymentRow>> listPayments() async {
    final uri = Uri.parse('$apiBaseUrl/api/admin/payments');
    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AdminApiException(
        'Failed to fetch payments (HTTP ${response.statusCode}): '
        '${response.body}',
      );
    }

    final Map<String, dynamic> json =
        jsonDecode(response.body) as Map<String, dynamic>;
    final payments = json['payments'] as List<dynamic>?;
    if (payments == null) {
      throw AdminApiException(
        'Malformed response from /api/admin/payments: ${response.body}',
      );
    }

    return payments
        .map((p) => AdminPaymentRow.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<RefundResult> refund({
    required String sessionId,
    int? amountPence,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/api/admin/refund');
    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'session_id': sessionId,
        if (amountPence != null) 'amount': amountPence,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String message = response.body;
      try {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final error = json['error'];
        if (error is String) message = error;
      } catch (_) {
        // Not JSON, fall back to raw body.
      }
      throw AdminApiException(
        'Refund failed (HTTP ${response.statusCode}): $message',
      );
    }

    final Map<String, dynamic> json =
        jsonDecode(response.body) as Map<String, dynamic>;
    return RefundResult.fromJson(json);
  }
}
