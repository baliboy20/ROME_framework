import 'package:dio/dio.dart';
import 'package:medium_flutter_extractor/core/constants/api_endpoints.dart';

class ApiService {
  final Dio _dio;
  
  ApiService(this._dio);

  /// Helper method to extract array data from API responses
  List<Map<String, dynamic>> _extractArrayFromResponse(
    Response response,
    String arrayKey,
  ) {
    final responseData = response.data as Map<String, dynamic>?;
    if (responseData == null) {
      throw Exception('Invalid response: null data');
    }
    
    final arrayData = responseData[arrayKey] as List<dynamic>?;
    if (arrayData == null) {
      throw Exception('Invalid response: missing $arrayKey array');
    }
    
    return List<Map<String, dynamic>>.from(arrayData);
  }

  // API methods - authentication not required

  // Email Management
  Future<List<Map<String, dynamic>>> fetchEmails(Map<String, dynamic> filter) async {
    final response = await _dio.post(ApiEndpoints.emailsFetch, data: filter);
    // Backend returns: {"success": true, "emails": [...], "total": 28, "message": "..."}
    return _extractArrayFromResponse(response, 'emails');
  }

  Future<List<Map<String, dynamic>>> getEmails() async {
    final response = await _dio.get(ApiEndpoints.emails);
    // Backend returns: {"success": true, "emails": [...], "total": N, "pagination": {...}}
    return _extractArrayFromResponse(response, 'emails');
  }

  Future<Map<String, dynamic>> getEmailById(String id) async {
    final response = await _dio.get('/api/emails/$id');
    return response.data;
  }

  Future<List<String>> getEmailLinks(String id) async {
    final response = await _dio.get('/api/emails/$id/links');
    return List<String>.from(response.data);
  }

  // Scraping
  Future<Map<String, dynamic>> startBatchScraping(Map<String, dynamic> body) async {
    final response = await _dio.post(ApiEndpoints.scrapingBatch, data: body);
    return response.data;
  }

  Future<Map<String, dynamic>> getScrapingStatus(String id) async {
    final response = await _dio.get('/api/scraping/batch/$id');
    return response.data;
  }

  Future<void> cancelScraping(String id) async {
    await _dio.delete('/api/scraping/batch/$id');
  }

  // Articles
  Future<List<Map<String, dynamic>>> getArticles({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
  }) async {
    // Backend expects skip, not page
    final skip = (page - 1) * limit;
    
    final response = await _dio.get(
      ApiEndpoints.articles,
      queryParameters: {
        'skip': skip,
        'limit': limit,
        if (search != null) 'search': search,
        if (status != null) 'status': status,
      },
    );
    // Backend returns: {"success": true, "articles": [...], "total": N, "pagination": {...}}
    return _extractArrayFromResponse(response, 'articles');
  }

  Future<Map<String, dynamic>> createArticle(Map<String, dynamic> article) async {
    final response = await _dio.post(ApiEndpoints.articles, data: article);
    return response.data;
  }

  Future<Map<String, dynamic>> getArticleById(String id) async {
    final response = await _dio.get('/api/articles/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> updateArticle(String id, Map<String, dynamic> updates) async {
    final response = await _dio.put('/api/articles/$id', data: updates);
    return response.data;
  }

  Future<void> deleteArticle(String id) async {
    await _dio.delete('/api/articles/$id');
  }

  Future<String> getArticleContent(String id) async {
    final response = await _dio.get('/api/articles/$id/content');
    return response.data;
  }
}