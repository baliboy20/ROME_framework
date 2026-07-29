import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/auth/domain/entities/auth_session.dart';
import 'package:fob_webapp_admin/features/auth/domain/repositories/auth_repository.dart';
import 'package:fob_webapp_admin/features/auth/domain/usecases/auth_usecases.dart';
import 'package:fob_webapp_admin/features/auth/presentation/bloc/auth_bloc.dart';

class _FakeRepo implements AuthRepository {
  Failure? fail;
  int signOuts = 0;
  @override
  Future<Result<AuthSession>> signIn(String email, String password) async =>
      fail != null ? Error(fail!) : const Success(AuthSession(token: 't', operatorName: 'William'));
  @override
  Future<Result<void>> signOut() async {
    signOuts++;
    return const Success(null);
  }
}

AuthBloc _bloc(_FakeRepo repo) => AuthBloc(signIn: SignIn(repo), signOut: SignOut(repo));

void main() {
  test('initial state is signed out', () {
    expect(_bloc(_FakeRepo()).state, isA<AuthSignedOut>());
  });

  test('empty credentials are rejected before any network call', () async {
    final bloc = _bloc(_FakeRepo());
    bloc.add(const SignInRequested('', ''));
    await Future.delayed(Duration.zero);
    expect(bloc.state, isA<AuthError>());
    expect((bloc.state as AuthError).message, 'Email and password are required.');
  });

  test('sign-in failure surfaces a generic message, not a stack trace', () async {
    final repo = _FakeRepo()..fail = const NetworkFailure('down');
    final bloc = _bloc(repo);
    bloc.add(const SignInRequested('owner@fob.test', 'wrong'));
    await Future.delayed(Duration.zero);
    expect((bloc.state as AuthError).message, contains('Sign-in failed'));
  });

  test('successful sign-in emits SigningIn then SignedIn', () async {
    final bloc = _bloc(_FakeRepo());
    final states = <AuthState>[];
    bloc.stream.listen(states.add);
    bloc.add(const SignInRequested('owner@fob.test', 'admin1234'));
    await Future.delayed(Duration.zero);
    expect(states.first, isA<AuthSigningIn>());
    expect(states.last, isA<AuthSignedIn>());
    expect((states.last as AuthSignedIn).operatorName, 'William');
  });

  test('sign-out returns to signed-out', () async {
    final repo = _FakeRepo();
    final bloc = _bloc(repo);
    bloc.add(const SignOutRequested());
    await Future.delayed(Duration.zero);
    expect(repo.signOuts, 1);
    expect(bloc.state, isA<AuthSignedOut>());
  });
}
