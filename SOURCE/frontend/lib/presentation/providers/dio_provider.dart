import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/config/environment.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: Environment.apiBaseUrl,
    connectTimeout: Environment.connectionTimeout,
    receiveTimeout: Environment.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Add interceptors
  dio.interceptors.addAll([
    if (!Environment.isProduction)
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
        maxWidth: 90,
      ),
  ]);

  return dio;
});