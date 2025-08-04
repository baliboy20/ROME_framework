import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/constants/api_endpoints.dart';
import 'package:medium_flutter_extractor/presentation/providers/auth_provider.dart';

class AuthInterceptor extends Interceptor {
  final Ref ref;

  AuthInterceptor(this.ref);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final authState = ref.read(authStateProvider);
    
    authState.whenData((auth) {
      if (auth != null && auth.accessToken.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer ${auth.accessToken}';
      }
    });
    
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      final authNotifier = ref.read(authStateProvider.notifier);
      final refreshed = await authNotifier.refreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        try {
          final response = await _retry(err.requestOptions);
          handler.resolve(response);
          return;
        } catch (e) {
          handler.next(err);
          return;
        }
      }
      
      // If refresh failed, logout
      await authNotifier.logout();
    }
    
    handler.next(err);
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final authState = ref.read(authStateProvider);
    final token = authState.valueOrNull?.accessToken ?? '';
    
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $token',
      },
    );
    
    final dio = Dio(BaseOptions(
      baseUrl: requestOptions.baseUrl,
      connectTimeout: requestOptions.connectTimeout,
      receiveTimeout: requestOptions.receiveTimeout,
    ));
    
    return dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
}