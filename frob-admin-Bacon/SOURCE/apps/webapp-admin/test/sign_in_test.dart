import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/api/api_client.dart';
import 'package:fob_webapp_admin/bloc/auth_cubit.dart';

void main() {
  group('AuthCubit sign-in gate (A1/A2, AUTH01)', () {
    test('empty credentials are rejected before any network call', () async {
      final cubit = AuthCubit(ApiClient());
      await cubit.signIn('', '');
      expect(cubit.state.status, AuthStatus.error);
      expect(cubit.state.error, isNotNull);
    });

    test('sign-in failure against an unreachable API surfaces a generic error, not a stack trace', () async {
      final cubit = AuthCubit(ApiClient(baseUrl: 'http://127.0.0.1:1'));
      await cubit.signIn('owner@fob.test', 'wrong-password');
      expect(cubit.state.status, AuthStatus.error);
      expect(cubit.state.error, contains('Sign-in failed'));
    });

    test('initial state is signed out', () {
      final cubit = AuthCubit(ApiClient());
      expect(cubit.state.status, AuthStatus.signedOut);
    });
  });
}
