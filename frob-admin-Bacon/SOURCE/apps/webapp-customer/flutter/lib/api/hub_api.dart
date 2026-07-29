import 'dart:convert';

import 'package:http/http.dart' as http;

import 'booking_api.dart';

/// Thin client for the customer "Manage your booking" hub routes on
/// `api-worker` (TOUR/POST/BOOK/AUTH families). Same one-origin JSON-over-HTTPS
/// style as [BookingApi]. Most hub routes are unauthenticated (reached via the
/// booker view of `/tour-hub/:bookingId?viewer=booker`); only the money-path /
/// session routes (cancel, change-date, logout) require the customer Bearer
/// token from the confirmation email link.
class HubApi {
  HubApi({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  /// Origin of `api-worker`, e.g. `https://api.friendsonbikes.uk`.
  final String baseUrl;
  final http.Client _client;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  Map<String, String> get _jsonHeaders => const {
        'Content-Type': 'application/json',
      };

  Map<String, String> _bearerJsonHeaders(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  void _checkOk(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw BookingApiException(res.statusCode, res.body);
    }
  }

  /// GET /tour-hub/:bookingId?viewer=booker — full hub payload
  /// `{booking, departure, participants, notices, payment_status}`. No auth.
  Future<Map<String, dynamic>> getHub(String bookingId) async {
    final res = await _client.get(
      _uri('/tour-hub/$bookingId?viewer=booker'),
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// PATCH /tour-hub/:id/details (TOUR04) — emergency contact + safety flags.
  /// No auth.
  Future<void> updateDetails({
    required String bookingId,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelationship,
    List<String> safetySignificantFlags = const [],
  }) async {
    final res = await _client.patch(
      _uri('/tour-hub/$bookingId/details'),
      headers: _jsonHeaders,
      body: jsonEncode({
        if (emergencyContactName != null)
          'emergency_contact_name': emergencyContactName,
        if (emergencyContactPhone != null)
          'emergency_contact_phone': emergencyContactPhone,
        if (emergencyContactRelationship != null)
          'emergency_contact_relationship': emergencyContactRelationship,
        'safety_significant_flags': safetySignificantFlags,
      }),
    );
    _checkOk(res);
  }

  /// POST /tour-hub/:id/late (TOUR09) — running-late notice. No auth.
  Future<void> reportLate({
    required String bookingId,
    required String estimatedArrival,
    String? context,
  }) async {
    final res = await _client.post(
      _uri('/tour-hub/$bookingId/late'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'estimated_arrival': estimatedArrival,
        'context': context,
      }),
    );
    _checkOk(res);
  }

  /// POST /notices/:id/ack (TOUR06) — acknowledge a change notice. No auth.
  Future<void> ackNotice(String noticeId) async {
    final res = await _client.post(
      _uri('/notices/$noticeId/ack'),
      headers: _jsonHeaders,
    );
    _checkOk(res);
  }

  /// POST /notices/:id/remediation (TOUR08) — pick refund/rebook/credit for a
  /// material change. No auth.
  Future<Map<String, dynamic>> chooseRemediation({
    required String noticeId,
    required String choice,
  }) async {
    final res = await _client.post(
      _uri('/notices/$noticeId/remediation'),
      headers: _jsonHeaders,
      body: jsonEncode({'choice': choice}),
    );
    _checkOk(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// POST /feedback (POST03) — post-tour feedback. No auth.
  Future<void> submitFeedback({
    required String bookingId,
    required int overallRating,
    required int guideRating,
    required int valueRating,
    required String wouldRecommend,
    String? freeText,
  }) async {
    final res = await _client.post(
      _uri('/feedback'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'booking_id': bookingId,
        'overall_rating': overallRating,
        'guide_rating': guideRating,
        'value_rating': valueRating,
        'would_recommend': wouldRecommend,
        'free_text': freeText,
      }),
    );
    _checkOk(res);
  }

  /// GET /tours/:tourId/availability?partySize=N — slots for change-date.
  /// No auth.
  Future<List<Map<String, dynamic>>> fetchAvailability(
    String tourId,
    int partySize,
  ) async {
    final res = await _client.get(
      _uri('/tours/$tourId/availability?partySize=$partySize'),
    );
    _checkOk(res);
    return (jsonDecode(res.body) as List<dynamic>).cast<Map<String, dynamic>>();
  }

  /// POST /bookings/:id/cancel (BOOK07) — Bearer required.
  Future<void> cancelBooking({
    required String bookingId,
    required String token,
    required num hoursBeforeDeparture,
  }) async {
    final res = await _client.post(
      _uri('/bookings/$bookingId/cancel'),
      headers: _bearerJsonHeaders(token),
      body: jsonEncode({'hoursBeforeDeparture': hoursBeforeDeparture}),
    );
    _checkOk(res);
  }

  /// PATCH /bookings/:id (BOOK06 change date) — Bearer required.
  Future<void> changeDate({
    required String bookingId,
    required String token,
    required String newDepartureId,
    required int newPricePerPersonPence,
    int cancellationCutoffHours = 48,
  }) async {
    final res = await _client.patch(
      _uri('/bookings/$bookingId'),
      headers: _bearerJsonHeaders(token),
      body: jsonEncode({
        'newDepartureId': newDepartureId,
        'newPricePerPersonPence': newPricePerPersonPence,
        'cancellationCutoffHours': cancellationCutoffHours,
      }),
    );
    _checkOk(res);
  }

  /// POST /auth/logout (AUTH05) — Bearer; clears the customer session.
  Future<void> logout(String token) async {
    final res = await _client.post(
      _uri('/auth/logout'),
      headers: _bearerJsonHeaders(token),
    );
    _checkOk(res);
  }

  void close() => _client.close();
}
