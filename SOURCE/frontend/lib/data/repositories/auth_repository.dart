import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/constants/api_endpoints.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/dio_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class AuthRepository {
  final Ref ref;
  late final Dio _dio;
  
  AuthRepository(this.ref) {
    _dio = ref.read(dioProvider);
  }
  
  Future<AuthModel> initiateGoogleAuth() async {
    try {
      // Get auth URL from backend
      final response = await _dio.get(ApiEndpoints.authGoogleInit);
      final authUrl = response.data['authUrl'] as String;
      
      // Open auth URL in browser
      if (await canLaunchUrl(Uri.parse(authUrl))) {
        await launchUrl(Uri.parse(authUrl));
      } else {
        throw Exception('Could not launch Google auth URL');
      }
      
      // TODO: Implement callback handling
      // For now, throw to indicate we're waiting for callback
      throw Exception('Waiting for OAuth callback');
    } catch (e) {
      throw Exception('Failed to initiate Google auth: $e');
    }
  }
  
  Future<AuthModel> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.authRefresh,
        data: {'refreshToken': refreshToken},
      );
      
      return AuthModel.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to refresh token: $e');
    }
  }
  
  Future<void> logout() async {
    try {
      await _dio.delete(ApiEndpoints.authLogout);
    } catch (e) {
      // Ignore logout errors
    }
  }
}