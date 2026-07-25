import 'dart:convert';

import 'package:http/http.dart' as http;

import 'device_service.dart';

/// Raised when a `/guide/*` request does not return 2xx, or when the
/// request cannot be sent at all (offline / DNS / socket). Callers persist
/// to sembast_web regardless (TDR-16 offline-critical), but the real HTTP
/// outcome is no longer hidden — the cubit surfaces this to the guide.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.body});

  /// Human-readable message safe to show in a SnackBar.
  final String message;

  /// HTTP status when a response was received; null on a transport failure.
  final int? statusCode;

  /// Raw response body (may carry Zod `issues`), for diagnostics.
  final String? body;

  @override
  String toString() => message;
}

/// Talks to the `/guide/*` routes on `api-worker` (api-contracts.md §Tour
/// operations OPS). Every request carries `X-Device-ID` — the guide app has
/// no JWT/KV session (AUTH03). Requests THROW [ApiException] on any
/// non-2xx or transport failure; the app is offline-critical (TDR-16) so
/// callers persist to sembast_web first and treat the throw as a
/// best-effort sync failure they surface to the guide.
class ApiClient {
  ApiClient(this._deviceService, {http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        baseUrl = baseUrl ?? 'https://friendsonbikes.uk';

  final DeviceService _deviceService;
  final http.Client _client;
  final String baseUrl;

  Future<Map<String, String>> _headers() async => {
        'Content-Type': 'application/json',
        'X-Device-ID': await _deviceService.deviceId(),
      };

  Map<String, Object?> _decode(http.Response res) {
    if (res.body.trim().isEmpty) return const {};
    final decoded = jsonDecode(res.body);
    return decoded is Map<String, Object?> ? decoded : {'data': decoded};
  }

  Never _fail(http.Response res) {
    throw ApiException('Sync failed (HTTP ${res.statusCode})',
        statusCode: res.statusCode, body: res.body);
  }

  /// PATCHes [path]; returns the decoded response body on 2xx, else throws
  /// [ApiException].
  Future<Map<String, Object?>> patch(String path, Map<String, Object?> body) async {
    final http.Response res;
    try {
      res = await _client.patch(
        Uri.parse('$baseUrl$path'),
        headers: await _headers(),
        body: jsonEncode(body),
      );
    } catch (e) {
      throw ApiException('No connection — saved on device, not yet synced.', body: '$e');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return _decode(res);
    _fail(res);
  }

  /// POSTs [path]; returns the decoded response body on 2xx, else throws
  /// [ApiException].
  Future<Map<String, Object?>> post(String path, Map<String, Object?> body) async {
    final http.Response res;
    try {
      res = await _client.post(
        Uri.parse('$baseUrl$path'),
        headers: await _headers(),
        body: jsonEncode(body),
      );
    } catch (e) {
      throw ApiException('No connection — saved on device, not yet synced.', body: '$e');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return _decode(res);
    _fail(res);
  }

  /// GETs [path]; returns the decoded body on 2xx, else throws
  /// [ApiException] (404 included, so OPS01 can distinguish not-found).
  Future<Map<String, Object?>> get(String path) async {
    final http.Response res;
    try {
      res = await _client.get(Uri.parse('$baseUrl$path'), headers: await _headers());
    } catch (e) {
      throw ApiException('No connection.', body: '$e');
    }
    if (res.statusCode >= 200 && res.statusCode < 300) return _decode(res);
    _fail(res);
  }
}

/// OPS route map (api-contracts.md §Tour operations), kept close to the
/// client so screen code references named routes, not raw strings.
class GuideRoutes {
  GuideRoutes._();
  static String departure(String id) => '/guide/departures/$id'; // OPS01
  static String kit(String id) => '/guide/readiness/$id/kit'; // OPS02
  static String bikeInspection(String id) => '/guide/readiness/$id/bike-inspection'; // OPS03
  static String riskAssessment(String id) => '/guide/readiness/$id/risk-assessment'; // OPS04
  static const checkins = '/guide/checkins'; // OPS05
  static String briefing(String id) => '/guide/readiness/$id/briefing'; // OPS06
  static String finalSignoff(String id) => '/guide/readiness/$id/final-signoff'; // OPS07
  static const events = '/guide/events'; // OPS08
  static const incidents = '/guide/incidents'; // OPS09
  static const postRideReview = '/guide/post-ride-review'; // OPS10
  static String incidentReport(String id) => '/guide/incidents/$id/report'; // OPS11
  static const hazards = '/guide/hazards'; // OPS13
}
