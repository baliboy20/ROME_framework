import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../core/session/session_store.dart';

enum AuthStatus { signedOut, signingIn, signedIn, error }

class AuthState {
  final AuthStatus status;
  final String? error;
  final String? operatorName;

  const AuthState({required this.status, this.error, this.operatorName});

  const AuthState.initial() : this(status: AuthStatus.signedOut);

  AuthState copyWith({AuthStatus? status, String? error, String? operatorName}) =>
      AuthState(status: status ?? this.status, error: error, operatorName: operatorName ?? this.operatorName);
}

/// AUTH01/AUTH05 sign-in gate (A1/A2).
class AuthCubit extends Cubit<AuthState> {
  final ApiClient api;

  /// Shared token store the migrated (DDD) features read through. During the
  /// strangler-fig migration the token is mirrored here as well as onto the
  /// legacy [ApiClient] used by not-yet-migrated screens.
  final SessionStore? session;

  AuthCubit(this.api, {this.session}) : super(const AuthState.initial());

  void _setToken(String? token) {
    api.setAuthToken(token);
    session?.set(token);
  }

  Future<void> signIn(String email, String password) async {
    if (email.isEmpty || password.isEmpty) {
      emit(state.copyWith(status: AuthStatus.error, error: 'Email and password are required.'));
      return;
    }
    emit(state.copyWith(status: AuthStatus.signingIn));
    try {
      final res = await api.ownerLogin(email, password);
      _setToken(res['token']?.toString());
      emit(AuthState(status: AuthStatus.signedIn, operatorName: res['name']?.toString() ?? 'William'));
    } catch (e) {
      emit(state.copyWith(status: AuthStatus.error, error: 'Sign-in failed. Check your details and try again.'));
    }
  }

  Future<void> signOut() async {
    try {
      await api.logout();
    } catch (_) {
      // idempotent notice regardless (UXC-NAV-2)
    }
    _setToken(null);
    emit(const AuthState.initial());
  }
}
