import 'dart:convert';

import 'package:http/http.dart' as http;

/// Thin read-only client for the public tours catalogue route on `api-worker`.
///
/// Covers:
///  - `GET /tours`  published tours (already sorted server-side), returned as
///    `{ tours: [ {id, name, tagline, ...} ] }`.
class ToursApi {
  ToursApi({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  /// Origin of `api-worker`, e.g. `https://api.friendsonbikes.uk`.
  final String baseUrl;
  final http.Client _client;

  /// Fetches the published tours catalogue, unwrapping the `tours` array.
  Future<List<Map<String, dynamic>>> fetchTours() async {
    final res = await _client.get(Uri.parse('$baseUrl/tours'));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ToursApiException(res.statusCode, res.body);
    }
    final decoded = jsonDecode(res.body) as Map<String, dynamic>;
    final tours = (decoded['tours'] as List<dynamic>? ?? const []);
    return tours.cast<Map<String, dynamic>>();
  }

  void close() => _client.close();
}

class ToursApiException implements Exception {
  ToursApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  @override
  String toString() => 'ToursApiException($statusCode): $body';
}
