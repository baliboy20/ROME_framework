import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  final http.Client httpClient;

  ApiClient({
    required this.baseUrl,
    http.Client? httpClient,
  }) : httpClient = httpClient ?? http.Client();

  Future<String> postQuestion(String text) async {
    try {
      final response = await httpClient.post(
        Uri.parse('$baseUrl/question'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'text': text}),
      ).timeout(const Duration(milliseconds: 5000));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['reversed'];
      } else if (response.statusCode == 400) {
        throw Exception('Invalid input: Text must be between 1 and 100 characters');
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } on http.ClientException {
      throw Exception('Unable to connect to server. Please try again.');
    } catch (e) {
      if (e.toString().contains('TimeoutException')) {
        throw Exception('Request timed out. Please try again.');
      }
      rethrow;
    }
  }

  void dispose() {
    httpClient.close();
  }
}