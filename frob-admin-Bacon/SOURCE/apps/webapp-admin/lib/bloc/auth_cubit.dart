import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';

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
  AuthCubit(this.api) : super(const AuthState.initial());

  Future<void> signIn(String email, String password) async {
    if (email.isEmpty || password.isEmpty) {
      emit(state.copyWith(status: AuthStatus.error, error: 'Email and password are required.'));
      return;
    }
    emit(state.copyWith(status: AuthStatus.signingIn));
    try {
      final res = await api.ownerLogin(email, password);
      api.setAuthToken(res['token']?.toString());
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
    api.setAuthToken(null);
    emit(const AuthState.initial());
  }
}
