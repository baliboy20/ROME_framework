import 'dart:convert';
import 'package:http/http.dart' as http;

/// Base URL for the api-worker, overridable via --dart-define=API_BASE_URL=...
const String kApiBaseUrl =
    String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8787');

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => 'ApiException($statusCode, $message)';
}

/// Typed client for the routes webapp-admin consumes (api-contracts.md).
class ApiClient {
  final http.Client _http;
  final String baseUrl;
  String? _authToken;

  ApiClient({http.Client? httpClient, this.baseUrl = kApiBaseUrl})
      : _http = httpClient ?? http.Client();

  void setAuthToken(String? token) => _authToken = token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  Uri _u(String path) => Uri.parse('$baseUrl$path');

  Future<dynamic> _decode(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) {
      if (r.body.isEmpty) return Future.value(null);
      return Future.value(jsonDecode(r.body));
    }
    String msg = r.body;
    try {
      final j = jsonDecode(r.body);
      // Prefer the human-readable `message` if present, else the `error` code.
      msg = j['message']?.toString() ?? j['error']?.toString() ?? r.body;
    } catch (_) {}
    throw ApiException(r.statusCode, msg);
  }

  // AUTH01
  Future<Map<String, dynamic>> ownerLogin(String email, String password) async {
    final r = await _http.post(_u('/auth/owner/login'),
        headers: _headers, body: jsonEncode({'email': email, 'password': password}));
    return await _decode(r) as Map<String, dynamic>;
  }

  // AUTH05
  Future<void> logout() async {
    await _http.post(_u('/auth/logout'), headers: _headers);
  }

  // BO05 payments listing lives under /admin/bookings; admin payments view filters client-side.
  Future<List<dynamic>> getPayments() async {
    final r = await _http.get(_u('/admin/bookings'), headers: _headers);
    final data = await _decode(r);
    // Worker returns { "bookings": [...] }; older code expected a bare list.
    if (data is Map && data['bookings'] is List) return data['bookings'] as List;
    return (data as List?) ?? [];
  }

  // BOOK07 — cumulative refund (UXD-01)
  // FINDING-001: use the operator-guarded admin refund route, not the
  // customer cancel route (which requires a customer session + different body).
  Future<Map<String, dynamic>> refundBooking(String bookingId, int amountPence) async {
    final r = await _http.post(_u('/admin/bookings/$bookingId/refund'),
        headers: _headers, body: jsonEncode({'refundAmountPence': amountPence}));
    return await _decode(r) as Map<String, dynamic>;
  }

  /// Unwrap `{ "<key>": [...] }` list responses (contract used by all admin
  /// list endpoints); tolerates a bare list for older shapes. FINDING-001.
  List<dynamic> _list(dynamic data, String key) {
    if (data is Map && data[key] is List) return data[key] as List;
    return (data as List?) ?? [];
  }

  // BO04
  Future<List<dynamic>> getCalendar({String? from, String? to}) async {
    final qp = <String, String>{};
    if (from != null) qp['from'] = from;
    if (to != null) qp['to'] = to;
    final r = await _http.get(_u('/admin/calendar').replace(queryParameters: qp), headers: _headers);
    final data = await _decode(r);
    // Worker returns { "departures": [...] }; older code expected a bare list.
    if (data is Map && data['departures'] is List) return data['departures'] as List;
    return (data as List?) ?? [];
  }

  // BOOK11
  Future<Map<String, dynamic>> createDeparture(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/departures'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  // BOOK12
  Future<Map<String, dynamic>> updateDeparture(String id, Map<String, dynamic> body) async {
    final r = await _http.patch(_u('/admin/departures/$id'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  // BOOK13
  Future<void> cancelDeparture(String id) async {
    final r = await _http.post(_u('/admin/departures/$id/cancel'), headers: _headers);
    await _decode(r);
  }

  // BOOK14 / A20 fleet reads + assignment
  // FINDING-001: /admin/fleet returns status COUNTS, not bike records. Use the
  // new /admin/bikes?available_for=<dep> which returns assignable bike rows.
  Future<List<dynamic>> getAvailableBikes(String departureId) async {
    final r = await _http.get(
        _u('/admin/bikes').replace(queryParameters: {'available_for': departureId}),
        headers: _headers);
    return _list(await _decode(r), 'bikes');
  }

  Future<void> setBikeAssignments(String departureId, List<String> bikeIds) async {
    final r = await _http.post(_u('/admin/departures/$departureId/bike-assignments'),
        headers: _headers, body: jsonEncode({'bike_ids': bikeIds}));
    await _decode(r);
  }

  // FLEET01 + UXD-10 duplicate guard is server-enforced; client also pre-checks against getFleet()
  Future<Map<String, dynamic>> addBike(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/bikes'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  // FINDING-001: bike RECORDS for dedupe / fleet lists (was /admin/fleet counts).
  Future<List<dynamic>> getFleet() async {
    final r = await _http.get(_u('/admin/bikes'), headers: _headers);
    return _list(await _decode(r), 'bikes');
  }

  /// Individual bike record: {bike, maintenance, assignments}.
  Future<Map<String, dynamic>> getBike(String id) async {
    final r = await _http.get(_u('/admin/bikes/$id'), headers: _headers);
    return await _decode(r) as Map<String, dynamic>;
  }

  /// A14 fleet-readiness summary (status counts + alerts) — FLEET03.
  Future<Map<String, dynamic>> getFleetReadiness() async {
    final r = await _http.get(_u('/admin/fleet'), headers: _headers);
    return await _decode(r) as Map<String, dynamic>;
  }

  // FLEET05/06 — UXD-11 flagged-bike gate
  Future<void> logMaintenance(String bikeId, String note) async {
    final r = await _http.post(_u('/admin/bikes/$bikeId/maintenance'),
        headers: _headers, body: jsonEncode({'note': note}));
    await _decode(r);
  }

  Future<void> setBikeStatus(String bikeId, String status) async {
    final r = await _http.patch(_u('/admin/bikes/$bikeId/status'),
        headers: _headers, body: jsonEncode({'status': status}));
    await _decode(r);
  }

  // PRE04/PRE05 — A9 enquiries
  Future<List<dynamic>> getEnquiries() async {
    final r = await _http.get(_u('/admin/enquiries'), headers: _headers);
    return _list(await _decode(r), 'enquiries');
  }

  Future<void> replyEnquiry(String id, String replyStatus) async {
    final r = await _http.patch(_u('/admin/enquiries/$id'),
        headers: _headers, body: jsonEncode({'status': replyStatus}));
    await _decode(r);
  }

  // -------------------------------------------------------------------------
  // FINDING-001 remediation — list reads + actions for the new admin screens.
  // -------------------------------------------------------------------------

  // A19 booking browser (BO05); optional search filters.
  Future<List<dynamic>> getBookings({String? reference, String? status, String? tourId}) async {
    final qp = <String, String>{};
    if (reference != null && reference.isNotEmpty) qp['reference'] = reference;
    if (status != null && status.isNotEmpty) qp['status'] = status;
    if (tourId != null && tourId.isNotEmpty) qp['tour_id'] = tourId;
    final r = await _http.get(_u('/admin/bookings').replace(queryParameters: qp), headers: _headers);
    return _list(await _decode(r), 'bookings');
  }

  Future<Map<String, dynamic>> getBooking(String id) async {
    final r = await _http.get(_u('/admin/bookings/$id'), headers: _headers);
    return await _decode(r) as Map<String, dynamic>;
  }

  // Guides (scheduler picker)
  Future<List<dynamic>> getGuides() async {
    final r = await _http.get(_u('/admin/guides'), headers: _headers);
    return _list(await _decode(r), 'guides');
  }

  // A18 departures list (BOOK11/12/13)
  Future<List<dynamic>> getDepartures() async {
    final r = await _http.get(_u('/admin/departures'), headers: _headers);
    return _list(await _decode(r), 'departures');
  }

  /// Departure detail: {departure, bookings, participants} (calendar drill-down).
  Future<Map<String, dynamic>> getDeparture(String id) async {
    final r = await _http.get(_u('/admin/departures/$id'), headers: _headers);
    return await _decode(r) as Map<String, dynamic>;
  }

  // A7 new booking (BOOK08/10)
  Future<Map<String, dynamic>> createBookingFromEnquiry(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/bookings'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createProvisionalBooking(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/bookings/provisional'),
        headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  // A19 booking edit / status transition (REQ-BOOK15/16, DR-B12b/c)
  Future<Map<String, dynamic>> updateBooking(String id, Map<String, dynamic> body) async {
    final r = await _http.patch(_u('/admin/bookings/$id'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> transitionBooking(String id, String transition) async {
    final r = await _http.post(_u('/admin/bookings/$id/transition'),
        headers: _headers, body: jsonEncode({'transition': transition}));
    return await _decode(r) as Map<String, dynamic>;
  }

  // A22 tour/route catalogue (REQ-TOUR-CAT prototype, DR-B13)
  Future<List<dynamic>> getAdminTours() async {
    // Cache-bust: a bare GET /admin/tours can be served from the browser's
    // HTTP cache, so a refetch after create/edit would show a stale list.
    final uri = _u('/admin/tours').replace(
      queryParameters: {'_': DateTime.now().millisecondsSinceEpoch.toString()},
    );
    final r = await _http.get(uri, headers: _headers);
    return _list(await _decode(r), 'tours');
  }

  Future<Map<String, dynamic>> createTour(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/tours'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateTour(String id, Map<String, dynamic> body) async {
    final r = await _http.patch(_u('/admin/tours/$id'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  Future<void> deleteTour(String id) async {
    final r = await _http.delete(_u('/admin/tours/$id'), headers: _headers);
    await _decode(r);
  }

  // A13 equipment (FLEET02)
  Future<List<dynamic>> getEquipment() async {
    final r = await _http.get(_u('/admin/equipment'), headers: _headers);
    return _list(await _decode(r), 'equipment');
  }

  Future<Map<String, dynamic>> addEquipment(Map<String, dynamic> body) async {
    final r = await _http.post(_u('/admin/equipment'), headers: _headers, body: jsonEncode(body));
    return await _decode(r) as Map<String, dynamic>;
  }

  // A10 incidents (OPS12)
  Future<List<dynamic>> getIncidents() async {
    final r = await _http.get(_u('/admin/incidents'), headers: _headers);
    return _list(await _decode(r), 'incidents');
  }

  Future<void> dispatchIncident(String id) async {
    final r = await _http.patch(_u('/admin/incidents/$id/dispatch'), headers: _headers);
    await _decode(r);
  }

  // A11 hazards (OPS14)
  Future<List<dynamic>> getHazards() async {
    final r = await _http.get(_u('/admin/hazards'), headers: _headers);
    return _list(await _decode(r), 'hazards');
  }

  Future<void> reviewHazard(String id, String status) async {
    final r = await _http.patch(_u('/admin/hazards/$id'),
        headers: _headers, body: jsonEncode({'status': status}));
    await _decode(r);
  }

  // A16 compliance (FLEET07/08)
  Future<List<dynamic>> getCompliance() async {
    final r = await _http.get(_u('/admin/compliance'), headers: _headers);
    return _list(await _decode(r), 'compliance');
  }

  Future<void> renewCompliance(String id, String newExpiry) async {
    final r = await _http.patch(_u('/admin/compliance/$id/renew'),
        headers: _headers, body: jsonEncode({'expiry_or_due_at': newExpiry}));
    await _decode(r);
  }

  // A4 owner alerts (NOTIF04)
  Future<List<dynamic>> getAlerts() async {
    final r = await _http.get(_u('/admin/alerts'), headers: _headers);
    return _list(await _decode(r), 'alerts');
  }

  // A3 deliverability (NOTIF02)
  Future<List<dynamic>> getDeliverability() async {
    final r = await _http.get(_u('/admin/deliverability'), headers: _headers);
    return _list(await _decode(r), 'messages');
  }

  // A5 audit log (CNA03) — global recent feed (/admin/audit is per-subject).
  Future<List<dynamic>> getAudit() async {
    final r = await _http.get(_u('/admin/audit-log'), headers: _headers);
    return _list(await _decode(r), 'entries');
  }

  // A6 publish & content quality (SEO03)
  Future<Map<String, dynamic>> getContent() async {
    final r = await _http.get(_u('/admin/content'), headers: _headers);
    return await _decode(r) as Map<String, dynamic>;
  }

  Future<void> publish() async {
    final r = await _http.post(_u('/publish'), headers: _headers);
    await _decode(r);
  }
}
