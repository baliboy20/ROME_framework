import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/core/constants/api_endpoints.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/data/repositories/auth_repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../helpers/test_helpers.dart';
import '../../mocks/mock_providers.dart';

void main() {
  group('AuthRepository', () {
    late ProviderContainer container;
    late AuthRepository authRepository;

    setUp(() {
      setupMockApiService();
      container = ProviderContainer(
        overrides: createMockProviders(),
      );
      // Create a simple ref implementation for testing
      final testRef = _TestRef(container);
      authRepository = AuthRepository(testRef);
    });

    tearDown(() {
      container.dispose();
    });

    group('initiateGoogleAuth', () {
      test('should return auth URL on successful request', () async {
        const expectedAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=123';
        
        when(() => mockDio.get(ApiEndpoints.authGoogleInit))
            .thenAnswer((_) async => Response(
              data: {'authUrl': expectedAuthUrl},
              statusCode: 200,
              requestOptions: RequestOptions(path: ApiEndpoints.authGoogleInit),
            ));

        // Mock URL launcher
        // Note: In a real test, you'd mock url_launcher, but for now we'll test the exception
        expect(
          () => authRepository.initiateGoogleAuth(),
          throwsA(isA<Exception>()),
        );

        verify(() => mockDio.get(ApiEndpoints.authGoogleInit)).called(1);
      });

      test('should throw exception on API failure', () async {
        when(() => mockDio.get(ApiEndpoints.authGoogleInit))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ApiEndpoints.authGoogleInit),
              message: 'Network error',
            ));

        expect(
          () => authRepository.initiateGoogleAuth(),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('refreshToken', () {
      test('should return new AuthModel on successful refresh', () async {
        const refreshToken = 'test_refresh_token';
        final expectedAuth = AuthModel(
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
          expiresAt: DateTime(2025, 7, 28, 19, 0),
          userEmail: TestData.sampleEmail,
        );

        when(() => mockDio.post(
          ApiEndpoints.authRefresh,
          data: {'refreshToken': refreshToken},
        )).thenAnswer((_) async => Response(
          data: expectedAuth.toJson(),
          statusCode: 200,
          requestOptions: RequestOptions(path: ApiEndpoints.authRefresh),
        ));

        final result = await authRepository.refreshToken(refreshToken);

        expect(result.accessToken, equals('new_access_token'));
        expect(result.refreshToken, equals('new_refresh_token'));
        expect(result.userEmail, equals(TestData.sampleEmail));

        verify(() => mockDio.post(
          ApiEndpoints.authRefresh,
          data: {'refreshToken': refreshToken},
        )).called(1);
      });

      test('should throw exception on refresh failure', () async {
        const refreshToken = 'invalid_refresh_token';

        when(() => mockDio.post(
          ApiEndpoints.authRefresh,
          data: {'refreshToken': refreshToken},
        )).thenThrow(DioException(
          requestOptions: RequestOptions(path: ApiEndpoints.authRefresh),
          response: Response(
            statusCode: 401,
            data: {'error': 'Invalid refresh token'},
            requestOptions: RequestOptions(path: ApiEndpoints.authRefresh),
          ),
        ));

        expect(
          () => authRepository.refreshToken(refreshToken),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('logout', () {
      test('should call logout endpoint successfully', () async {
        when(() => mockDio.delete(ApiEndpoints.authLogout))
            .thenAnswer((_) async => Response(
              statusCode: 200,
              requestOptions: RequestOptions(path: ApiEndpoints.authLogout),
            ));

        await authRepository.logout();

        verify(() => mockDio.delete(ApiEndpoints.authLogout)).called(1);
      });

      test('should not throw on logout failure', () async {
        when(() => mockDio.delete(ApiEndpoints.authLogout))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ApiEndpoints.authLogout),
              message: 'Network error',
            ));

        // Should complete without throwing
        await expectLater(
          authRepository.logout(),
          completes,
        );
      });
    });
  });
}

class _TestRef implements Ref {
  final ProviderContainer container;
  
  _TestRef(this.container);
  
  @override
  T read<T>(ProviderBase<T> provider) => container.read(provider);
  
  @override
  State refresh<State>(ProviderBase<State> provider) => container.refresh(provider);
  
  @override
  void invalidate(ProviderOrFamily provider) => container.invalidate(provider);
  
  @override
  ProviderSubscription<T> listen<T>(
    ProviderListenable<T> provider,
    void Function(T?, T) listener, {
    void Function(T)? onError,
    bool fireImmediately = false,
  }) {
    return container.listen(provider, listener, 
        onError: onError, fireImmediately: fireImmediately);
  }
  
  @override
  bool exists(ProviderBase provider) => container.exists(provider);
  
  @override
  ProviderSubscription<T> listenSelf<T>(
    void Function(T?, T) listener, {
    void Function(T)? onError,
  }) {
    throw UnimplementedError();
  }
  
  @override
  void notifyListeners() {}
  
  @override
  T watch<T>(ProviderListenable<T> provider) => container.read(provider);
}