part of 'auth_cubit.dart';

enum AuthStatus { unknown, unauthenticated, authenticating, authenticated }

class AuthState {
  final AuthStatus status;
  final String? errorMessage;

  const AuthState._(this.status, {this.errorMessage});

  const AuthState.unknown() : this._(AuthStatus.unknown);
  const AuthState.unauthenticated({String? errorMessage})
      : this._(AuthStatus.unauthenticated, errorMessage: errorMessage);
  const AuthState.authenticating() : this._(AuthStatus.authenticating);
  const AuthState.authenticated() : this._(AuthStatus.authenticated);

  bool get isOwner => status == AuthStatus.authenticated;
}
