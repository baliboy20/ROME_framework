import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/auth_usecases.dart';

// ---- events ----
sealed class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class SignInRequested extends AuthEvent {
  final String email;
  final String password;
  const SignInRequested(this.email, this.password);
  @override
  List<Object?> get props => [email, password];
}

class SignOutRequested extends AuthEvent {
  const SignOutRequested();
}

// ---- states ----
sealed class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthSignedOut extends AuthState {
  const AuthSignedOut();
}

class AuthSigningIn extends AuthState {
  const AuthSigningIn();
}

class AuthSignedIn extends AuthState {
  final String operatorName;
  const AuthSignedIn(this.operatorName);
  @override
  List<Object?> get props => [operatorName];
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
  @override
  List<Object?> get props => [message];
}

// ---- bloc ----
/// AUTH01/AUTH05 sign-in gate (A1/A2).
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final SignIn signIn;
  final SignOut signOut;

  AuthBloc({required this.signIn, required this.signOut}) : super(const AuthSignedOut()) {
    on<SignInRequested>(_onSignIn);
    on<SignOutRequested>(_onSignOut);
  }

  Future<void> _onSignIn(SignInRequested event, Emitter<AuthState> emit) async {
    if (event.email.isEmpty || event.password.isEmpty) {
      emit(const AuthError('Email and password are required.'));
      return;
    }
    emit(const AuthSigningIn());
    final result = await signIn(SignInParams(event.email, event.password));
    emit(result.fold(
      (f) => const AuthError('Sign-in failed. Check your details and try again.'),
      (session) => AuthSignedIn(session.operatorName),
    ));
  }

  Future<void> _onSignOut(SignOutRequested event, Emitter<AuthState> emit) async {
    await signOut(const NoParams());
    emit(const AuthSignedOut());
  }
}
