import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/content_item.dart';

/// Thrown when the api-worker returns 401 (session expired/invalid) or
/// 403 (not owner). See api-contracts.md "Error & idempotency conventions".
class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  bool get isUnauthorized => statusCode == 401 || statusCode == 403;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Thin client over the single Cloudflare Worker `api-worker`
/// (api-contracts.md). Owner-session guarded routes carry the JWT minted
/// by `POST /auth/owner/login` (AUTH01) as a Bearer token; the worker
/// verifies it server-side on every request (AUTH04).
class ApiClient {
  final String baseUrl;
  final http.Client _http;
  String? _ownerToken;

  ApiClient({required this.baseUrl, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  bool get isAuthenticated => _ownerToken != null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_ownerToken != null) 'Authorization': 'Bearer $_ownerToken',
      };

  /// POST /auth/owner/login (AUTH01) — mints owner JWT+KV session.
  Future<void> ownerLogin({
    required String email,
    required String password,
  }) async {
    final res = await _http.post(
      Uri.parse('$baseUrl/auth/owner/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) {
      throw ApiException(res.statusCode, 'Login failed');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    _ownerToken = body['token'] as String? ?? 'session';
  }

  /// POST /auth/logout (AUTH05).
  Future<void> logout() async {
    if (_ownerToken == null) return;
    await _http.post(Uri.parse('$baseUrl/auth/logout'), headers: _headers);
    _ownerToken = null;
  }

  /// GET /admin/content — owner-session-guarded. Returns an OBJECT
  /// `{pages:[...], quality:[...]}` (NOT a bare list). `quality` supplies
  /// the SEO advisory items; there is no separate quality endpoint.
  Future<ContentSnapshot> fetchContent() async {
    final res =
        await _http.get(Uri.parse('$baseUrl/admin/content'), headers: _headers);
    _checkAuth(res);
    if (res.statusCode != 200) {
      throw ApiException(res.statusCode, 'Failed to load content');
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return ContentSnapshot.fromJson(body);
  }

  /// POST /publish — manual, operator-triggered (TDR-14). Sends every page
  /// as a tour. Description is the local edit (or falls back to the title).
  /// The worker independently re-validates completeness and reports back
  /// `{publishedCount, flaggedIncomplete, sitemapUrls}`.
  Future<PublishResult> publish(List<ContentItem> pages) async {
    final tours = pages
        .map((p) => {
              'id': p.tourId,
              'name': p.title,
              'description': p.description.trim().isNotEmpty
                  ? p.description
                  : p.title,
              'urlPath': p.path,
              'locale': 'en',
              'schemaOrgType': 'TouristAttraction',
            })
        .toList();
    final res = await _http.post(
      Uri.parse('$baseUrl/publish'),
      headers: _headers,
      body: jsonEncode({'tours': tours}),
    );
    _checkAuth(res);
    if (res.statusCode != 200) {
      throw ApiException(res.statusCode, 'Publish failed');
    }
    return PublishResult.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  void _checkAuth(http.Response res) {
    if (res.statusCode == 401 || res.statusCode == 403) {
      _ownerToken = null;
      throw ApiException(res.statusCode, 'Session expired, please sign in again');
    }
  }
}
