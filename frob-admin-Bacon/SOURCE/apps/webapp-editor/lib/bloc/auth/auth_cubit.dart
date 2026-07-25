import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/api_client.dart';

part 'auth_state.dart';

/// Owner-session guarded auth. Only an authenticated owner session may
/// reach the content editor / publish flow (api-contracts.md `/auth/owner`).
class AuthCubit extends Cubit<AuthState> {
  final ApiClient _api;

  AuthCubit(this._api) : super(const AuthState.unauthenticated());

  Future<void> login({required String email, required String password}) async {
    emit(const AuthState.authenticating());
    try {
      await _api.ownerLogin(email: email, password: password);
      emit(const AuthState.authenticated());
    } on ApiException catch (e) {
      emit(AuthState.unauthenticated(errorMessage: e.message));
    } catch (_) {
      emit(const AuthState.unauthenticated(
          errorMessage: 'Could not reach the server. Try again.'));
    }
  }

  Future<void> logout() async {
    await _api.logout();
    emit(const AuthState.unauthenticated());
  }

  /// Called when the API client reports the owner session has expired.
  void sessionExpired() {
    emit(const AuthState.unauthenticated(
        errorMessage: 'Session expired, please sign in again'));
  }
}
