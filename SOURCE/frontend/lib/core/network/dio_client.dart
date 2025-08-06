import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../errors/exceptions.dart';
import '../services/app_logger.dart';

/// HTTP client wrapper around Dio with authentication and error handling
class DioClient {
  late final Dio _dio;
  late final Logger _logger;
  late final SharedPreferences _prefs;

  DioClient._internal();
  static final DioClient _instance = DioClient._internal();
  factory DioClient() => _instance;

  /// Initialize the HTTP client
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    _logger = Logger(
      printer: PrettyPrinter(
        methodCount: 0,
        errorMethodCount: 5,
        lineLength: 50,
        colors: true,
        printEmojis: true,
      ),
    );

    _dio = Dio();
    
    // Configure base options
    _dio.options = BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: Duration(milliseconds: AppConstants.connectTimeout),
      receiveTimeout: Duration(milliseconds: AppConstants.receiveTimeout),
      sendTimeout: Duration(milliseconds: AppConstants.sendTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    // Add interceptors
    _dio.interceptors.addAll([
      _AuthInterceptor(_prefs, _logger),
      _LoggingInterceptor(_logger),
      _ErrorInterceptor(_logger),
    ]);
  }

  /// GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// Upload file
  Future<Response<T>> uploadFile<T>(
    String path,
    String filePath,
    String fieldName, {
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        ...?data,
        fieldName: await MultipartFile.fromFile(filePath),
      });

      return await _dio.post<T>(
        path,
        data: formData,
        onSendProgress: onSendProgress,
      );
    } catch (e) {
      throw _handleError(e);
    }
  }

  /// Handle and convert errors to appropriate exceptions
  Exception _handleError(dynamic error) {
    final appLog = AppLogger.instance;
    
    if (error is DioException) {
      final requestInfo = 'URL: ${error.requestOptions.uri}, Method: ${error.requestOptions.method}';
      
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          appLog.error(
            'Request timeout - $requestInfo',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          return const NetworkException('Request timeout. Please check your internet connection.');
        
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode;
          final message = _extractErrorMessage(error.response?.data);
          
          appLog.error(
            'HTTP $statusCode response - $requestInfo - Response: ${error.response?.data}',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          
          if (statusCode == 401) {
            return AuthenticationException(message);
          } else if (statusCode == 403) {
            return AuthorizationException(message);
          } else {
            return ServerException(message, statusCode: statusCode);
          }
        
        case DioExceptionType.cancel:
          appLog.warning(
            'Request cancelled - $requestInfo',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          return const NetworkException('Request was cancelled.');
        
        case DioExceptionType.connectionError:
          appLog.error(
            'Connection failed - $requestInfo',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          return const NetworkException('Connection failed. Please check your internet connection.');
        
        case DioExceptionType.badCertificate:
          appLog.error(
            'SSL certificate verification failed - $requestInfo',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          return const NetworkException('SSL certificate verification failed.');
        
        case DioExceptionType.unknown:
          appLog.error(
            'Unknown DioException - $requestInfo',
            error: error,
            className: 'DioClient',
            methodName: '_handleError',
            fileName: 'dio_client.dart',
          );
          return NetworkException('Unexpected error: ${error.message}');
      }
    }
    
    appLog.error(
      'Non-DioException error in HTTP client',
      error: error,
      className: 'DioClient',
      methodName: '_handleError',
      fileName: 'dio_client.dart',
    );
    return NetworkException('Unexpected error: ${error.toString()}');
  }

  /// Extract error message from response data
  String _extractErrorMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['message'] as String? ?? 
             data['error'] as String? ?? 
             'Server error occurred';
    }
    return 'Server error occurred';
  }
}

/// Interceptor for adding authentication headers
class _AuthInterceptor extends Interceptor {
  final SharedPreferences _prefs;
  final Logger _logger;

  _AuthInterceptor(this._prefs, this._logger);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _prefs.getString(AppConstants.authTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    super.onRequest(options, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshToken = _prefs.getString(AppConstants.refreshTokenKey);
      if (refreshToken != null) {
        try {
          // TODO: Implement token refresh logic when auth endpoints are available
          _logger.w('Auth token expired, refresh needed');
        } catch (e) {
          _logger.e('Token refresh failed: $e');
          // Clear stored tokens
          await _prefs.remove(AppConstants.authTokenKey);
          await _prefs.remove(AppConstants.refreshTokenKey);
        }
      }
    }
    super.onError(err, handler);
  }
}

/// Interceptor for logging requests and responses
class _LoggingInterceptor extends Interceptor {
  final Logger _logger;

  _LoggingInterceptor(this._logger);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (AppConstants.enableLogging) {
      _logger.d('''
🌐 REQUEST
Method: ${options.method}
URL: ${options.baseUrl}${options.path}
Headers: ${options.headers}
Query Parameters: ${options.queryParameters}
Data: ${options.data}
''');
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (AppConstants.enableLogging) {
      _logger.d('''
✅ RESPONSE
Status Code: ${response.statusCode}
URL: ${response.requestOptions.path}
Data: ${response.data}
''');
    }
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (AppConstants.enableLogging) {
      _logger.e('''
❌ ERROR
Method: ${err.requestOptions.method}
URL: ${err.requestOptions.path}
Status Code: ${err.response?.statusCode}
Error: ${err.message}
Response Data: ${err.response?.data}
''');
    }
    super.onError(err, handler);
  }
}

/// Interceptor for handling common errors
class _ErrorInterceptor extends Interceptor {
  final Logger _logger;

  _ErrorInterceptor(this._logger);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.e('HTTP Error: ${err.message}');
    super.onError(err, handler);
  }
}