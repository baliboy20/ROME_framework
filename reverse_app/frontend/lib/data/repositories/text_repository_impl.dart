import '../datasources/api_client.dart';
import '../../domain/repositories/text_repository.dart';

class TextRepositoryImpl implements TextRepository {
  final ApiClient apiClient;

  TextRepositoryImpl({required this.apiClient});

  @override
  Future<String> reverseText(String text) async {
    try {
      return await apiClient.postQuestion(text);
    } catch (e) {
      final errorMessage = e.toString();
      if (errorMessage.contains('Unable to connect')) {
        throw Exception('Unable to connect to server. Please try again.');
      } else if (errorMessage.contains('Server error')) {
        throw Exception('Something went wrong. Please try again.');
      } else if (errorMessage.contains('Invalid input')) {
        throw Exception(errorMessage.replaceFirst('Exception: ', ''));
      } else {
        throw Exception('Something went wrong. Please try again.');
      }
    }
  }
}