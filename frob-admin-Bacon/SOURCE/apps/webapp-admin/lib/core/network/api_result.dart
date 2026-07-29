import 'dart:convert';
import 'package:http/http.dart' as http;
import '../error/exceptions.dart';

/// Shared HTTP helpers for remote data sources. Centralises the auth header,
/// URL building, and status→exception mapping that every datasource needs, so
/// each datasource only declares its own endpoints. Datasources THROW; they
/// never return a `Result` (that is the repository's job).
class ApiHttp {
  final http.Client _http;
  final String baseUrl;
  final String? Function() _tokenProvider;

  ApiHttp({
    required http.Client httpClient,
    required this.baseUrl,
    required String? Function() tokenProvider,
  })  : _http = httpClient,
        _tokenProvider = tokenProvider;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_tokenProvider() != null) 'Authorization': 'Bearer ${_tokenProvider()}',
      };

  Uri _u(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('$baseUrl$path');
    return (query == null || query.isEmpty) ? uri : uri.replace(queryParameters: query);
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send(() => _http.get(_u(path, query), headers: _headers));

  Future<dynamic> post(String path, {Object? body}) => _send(
      () => _http.post(_u(path), headers: _headers, body: body == null ? null : jsonEncode(body)));

  Future<dynamic> patch(String path, {Object? body}) => _send(
      () => _http.patch(_u(path), headers: _headers, body: body == null ? null : jsonEncode(body)));

  Future<dynamic> put(String path, {Object? body}) => _send(
      () => _http.put(_u(path), headers: _headers, body: body == null ? null : jsonEncode(body)));

  Future<dynamic> delete(String path) =>
      _send(() => _http.delete(_u(path), headers: _headers));

  Future<dynamic> _send(Future<http.Response> Function() run) async {
    final http.Response r;
    try {
      r = await run();
    } catch (_) {
      throw const NetworkException();
    }
    return _decode(r);
  }

  dynamic _decode(http.Response r) {
    if (r.statusCode >= 200 && r.statusCode < 300) {
      if (r.body.isEmpty) return null;
      return jsonDecode(r.body);
    }
    String msg = r.body;
    try {
      final j = jsonDecode(r.body);
      msg = j['message']?.toString() ?? j['error']?.toString() ?? r.body;
    } catch (_) {}
    switch (r.statusCode) {
      case 401:
      case 403:
        throw AuthException(msg);
      case 400:
      case 422:
        throw ValidationException(msg);
      default:
        throw ServerException(r.statusCode, msg);
    }
  }

  /// Unwrap `{ "<key>": [...] }` list envelopes; tolerates a bare list.
  static List<dynamic> unwrapList(dynamic data, String key) {
    if (data is Map && data[key] is List) return data[key] as List;
    return (data as List?) ?? const [];
  }
}
