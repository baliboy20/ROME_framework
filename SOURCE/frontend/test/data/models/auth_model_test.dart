import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';

void main() {
  group('AuthModel', () {
    final sampleAuthData = {
      'accessToken': 'access_token_123',
      'refreshToken': 'refresh_token_456',
      'expiresAt': '2025-07-28T18:00:00.000Z',
      'userEmail': 'test@example.com',
    };

    final sampleAuthModel = AuthModel(
      accessToken: 'access_token_123',
      refreshToken: 'refresh_token_456',
      expiresAt: DateTime.parse('2025-07-28T18:00:00.000Z'),
      userEmail: 'test@example.com',
    );

    test('should create AuthModel from JSON', () {
      final result = AuthModel.fromJson(sampleAuthData);

      expect(result.accessToken, equals('access_token_123'));
      expect(result.refreshToken, equals('refresh_token_456'));
      expect(result.userEmail, equals('test@example.com'));
      expect(result.expiresAt, equals(DateTime.parse('2025-07-28T18:00:00.000Z')));
    });

    test('should convert AuthModel to JSON', () {
      final result = sampleAuthModel.toJson();

      expect(result['accessToken'], equals('access_token_123'));
      expect(result['refreshToken'], equals('refresh_token_456'));
      expect(result['userEmail'], equals('test@example.com'));
      expect(result['expiresAt'], equals('2025-07-28T18:00:00.000Z'));
    });

    test('should support equality comparison', () {
      final auth1 = AuthModel(
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: DateTime(2025, 7, 28),
        userEmail: 'test@example.com',
      );

      final auth2 = AuthModel(
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: DateTime(2025, 7, 28),
        userEmail: 'test@example.com',
      );

      final auth3 = AuthModel(
        accessToken: 'different_token',
        refreshToken: 'refresh',
        expiresAt: DateTime(2025, 7, 28),
        userEmail: 'test@example.com',
      );

      expect(auth1, equals(auth2));
      expect(auth1, isNot(equals(auth3)));
    });

    test('should support copyWith functionality', () {
      final original = sampleAuthModel;
      final updated = original.copyWith(accessToken: 'new_token');

      expect(updated.accessToken, equals('new_token'));
      expect(updated.refreshToken, equals(original.refreshToken));
      expect(updated.userEmail, equals(original.userEmail));
      expect(updated.expiresAt, equals(original.expiresAt));
    });
  });
}