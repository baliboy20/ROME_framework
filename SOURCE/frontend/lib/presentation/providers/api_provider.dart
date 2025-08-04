import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/config/environment.dart';
import 'package:medium_flutter_extractor/data/services/api_service.dart';
import 'package:medium_flutter_extractor/presentation/providers/dio_provider.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  final dio = ref.watch(dioProvider);
  return ApiService(dio);
});