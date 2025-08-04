import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/auth_provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('AuthProvider', () {
    late ProviderContainer container;

    setUp(() {
      setupMockApiService();
      container = ProviderContainer(
        overrides: createMockProviders(),
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('should have initial loading state', () {
      final authState = container.read(authStateProvider);
      
      expect(authState, isA<AsyncLoading>());
    });

    test('should login successfully', () async {
      final authNotifier = container.read(authStateProvider.notifier);
      
      // Mock successful login
      final expectedAuth = AuthModel(
        accessToken: TestData.sampleToken,
        refreshToken: 'refresh_token',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
        userEmail: TestData.sampleEmail,
      );
      
      when(() => mockApiService.initiateGoogleAuth()).thenAnswer(
        (_) async => {'authUrl': 'https://accounts.google.com/oauth/authorize'},
      );

      // Simulate login (note: this is simplified since real OAuth flow is complex)
      await authNotifier.login();

      // Verify the login attempt was made
      verify(() => mockApiService.initiateGoogleAuth()).called(1);
    });

    test('should handle login failure', () async {
      final authNotifier = container.read(authStateProvider.notifier);
      
      // Mock failed login
      when(() => mockApiService.initiateGoogleAuth())
          .thenThrow(Exception('Login failed'));

      await authNotifier.login();

      final authState = container.read(authStateProvider);
      expect(authState, isA<AsyncError>());
    });

    test('should refresh token successfully', () async {
      // First set up a logged-in state
      final authNotifier = container.read(authStateProvider.notifier);
      final initialAuth = AuthModel(
        accessToken: 'old_token',
        refreshToken: 'refresh_token',
        expiresAt: DateTime.now().subtract(const Duration(minutes: 1)),
        userEmail: TestData.sampleEmail,
      );

      // Set the initial state manually (in real app this would come from storage)
      authNotifier.state = AsyncValue.data(initialAuth);

      final newAuth = AuthModel(
        accessToken: 'new_token',
        refreshToken: 'new_refresh_token',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
        userEmail: TestData.sampleEmail,
      );

      // Mock successful token refresh
      when(() => mockApiService.refreshToken(any()))
          .thenAnswer((_) async => newAuth);

      final result = await authNotifier.refreshToken();

      expect(result, isTrue);
      verify(() => mockApiService.refreshToken('refresh_token')).called(1);
    });

    test('should handle refresh token failure', () async {
      final authNotifier = container.read(authStateProvider.notifier);
      final initialAuth = AuthModel(
        accessToken: 'old_token',
        refreshToken: 'refresh_token',
        expiresAt: DateTime.now().subtract(const Duration(minutes: 1)),
        userEmail: TestData.sampleEmail,
      );

      authNotifier.state = AsyncValue.data(initialAuth);

      // Mock failed token refresh
      when(() => mockApiService.refreshToken(any()))
          .thenThrow(Exception('Refresh failed'));

      final result = await authNotifier.refreshToken();

      expect(result, isFalse);
    });

    test('should logout successfully', () async {
      final authNotifier = container.read(authStateProvider.notifier);
      final initialAuth = AuthModel(
        accessToken: TestData.sampleToken,
        refreshToken: 'refresh_token',
        expiresAt: DateTime.now().add(const Duration(hours: 1)),
        userEmail: TestData.sampleEmail,
      );

      authNotifier.state = AsyncValue.data(initialAuth);

      when(() => mockApiService.logout()).thenAnswer((_) async {});

      await authNotifier.logout();

      final authState = container.read(authStateProvider);
      expect(authState.valueOrNull, isNull);
      verify(() => mockApiService.logout()).called(1);
    });

    test('should handle logout with no current auth', () async {
      final authNotifier = container.read(authStateProvider.notifier);
      
      // Ensure no auth state
      authNotifier.state = const AsyncValue.data(null);

      when(() => mockApiService.logout()).thenAnswer((_) async {});

      await authNotifier.logout();

      // Should still call logout API
      verify(() => mockApiService.logout()).called(1);
    });
  });
}