import 'dart:convert';

import 'package:http/http.dart' as http;

/// Thin client for the public booking routes on `api-worker`
/// (api-contracts.md "Booking (BOOK) - money path"). One Cloudflare Worker
/// origin, JSON over HTTPS, Zod-validated server-side.
///
/// Covers:
///  - `GET /tours/:id/availability`          departure availability lookup
///  - `POST /bookings`                       BOOK01 create draft (returns token)
///  - `PATCH /bookings/:id/participants`     BOOK02 attendee details (Bearer)
///  - `POST /bookings/:id/consent`           BOOK03 waiver/terms consent (Bearer)
///  - `POST /bookings/:id/checkout-session`  BOOK04 Stripe Embedded Checkout (Bearer)
///  - `GET /bookings/:id`                    confirmation lookup (Bearer)
class BookingApi {
  BookingApi({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  /// Origin of `api-worker`, e.g. `https://api.friendsonbikes.uk`.
  final String baseUrl;
  final http.Client _client;

  /// Customer session token captured from `POST /bookings`; sent as
  /// `Authorization: Bearer <token>` on all later authenticated steps.
  String? _token;

  void setToken(String? token) => _token = token;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> get _jsonHeaders => const {
        'Content-Type': 'application/json',
      };

  Map<String, String> get _authJsonHeaders => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  /// Returns the availability slots for a tour at the requested [partySize].
  /// Response is a JSON array of
  /// `{departureId,date,time,remainingCapacity,pricePerPersonPence}`.
  Future<List<Map<String, dynamic>>> fetchAvailability(
    String tourId,
    int partySize,
  ) async {
    final res = await _client.get(
      _uri('/tours/$tourId/availability?partySize=$partySize'),
    );
    _checkOk(res);
    final decoded = jsonDecode(res.body) as List<dynamic>;
    return decoded.cast<Map<String, dynamic>>();
  }

  /// BOOK01 - creates a `draft` booking; the worker performs an atomic D1
  /// transactional decrement of `departures.held_count` (TDR-08). Returns the
  /// full response map, including the `token` customer session.
  Future<Map<String, dynamic>> createBooking({
    required String departureId,
    required int partySize,
    required int pricePerPersonPence,
  }) async {
    final res = await _client.post(
      _uri('/bookings'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'departureId': departureId,
        'partySize': partySize,
        'pricePerPersonPence': pricePerPersonPence,
      }),
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// BOOK02 - attendee details + emergency contact (Bearer).
  Future<void> updateParticipants({
    required String bookingId,
    required List<Map<String, dynamic>> participants,
    required String emergencyContactName,
    required String emergencyContactPhone,
    required String emergencyContactRelationship,
  }) async {
    final res = await _client.patch(
      _uri('/bookings/$bookingId/participants'),
      headers: _authJsonHeaders,
      body: jsonEncode({
        'participants': participants,
        'emergencyContactName': emergencyContactName,
        'emergencyContactPhone': emergencyContactPhone,
        'emergencyContactRelationship': emergencyContactRelationship,
      }),
    );
    _checkOk(res);
  }

  /// BOOK03 - waiver + terms consent (Bearer, calls CNA01 server-side).
  /// Consent checkboxes must be explicitly opted-in by the caller; this
  /// client never defaults them to true.
  Future<void> submitConsent({
    required String bookingId,
    required bool waiverAccepted,
    required bool termsAccepted,
  }) async {
    final res = await _client.post(
      _uri('/bookings/$bookingId/consent'),
      headers: _authJsonHeaders,
      body: jsonEncode({
        'waiverAccepted': waiverAccepted,
        'termsAccepted': termsAccepted,
      }),
    );
    _checkOk(res);
  }

  /// BOOK04 - creates a Stripe Embedded Checkout session
  /// (`ui_mode: 'embedded'`, Bearer); returns `{clientSecret, sessionId}` for
  /// the payment island to mount via
  /// `stripe_embedded_checkout_interop.dart`. Sends a stable
  /// `Idempotency-Key` so retries don't create duplicate sessions.
  Future<Map<String, dynamic>> createCheckoutSession({
    required String bookingId,
    String? customerEmail,
  }) async {
    final res = await _client.post(
      _uri('/bookings/$bookingId/checkout-session'),
      headers: {
        ..._authJsonHeaders,
        'Idempotency-Key': '$bookingId-checkout',
      },
      body: jsonEncode({
        if (customerEmail != null && customerEmail.isNotEmpty)
          'customerEmail': customerEmail,
      }),
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// DR-B11 - exchanges a signed booking-completion link token (mailed by
  /// an owner-created/provisional booking, REQ-BOOK08/REQ-BOOK10) for a
  /// fresh booking-scoped customer session, via `POST
  /// /auth/customer/verify-link` (REQ-AUTH02). Returns `{token, booking_id}`.
  Future<Map<String, dynamic>> verifyCompletionLink(String linkToken) async {
    final res = await _client.post(
      _uri('/auth/customer/verify-link'),
      headers: _jsonHeaders,
      body: jsonEncode({'link_token': linkToken}),
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Confirmation lookup - booking + participants + payment_status (Bearer).
  Future<Map<String, dynamic>> fetchBooking(String bookingId) async {
    final res = await _client.get(
      _uri('/bookings/$bookingId'),
      headers: _authJsonHeaders,
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  void _checkOk(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw BookingApiException(res.statusCode, res.body);
    }
  }

  void close() => _client.close();
}

class BookingApiException implements Exception {
  BookingApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  @override
  String toString() => 'BookingApiException($statusCode): $body';
}
