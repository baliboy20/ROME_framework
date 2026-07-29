import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

class SignIn extends UseCase<AuthSession, SignInParams> {
  final AuthRepository repository;
  SignIn(this.repository);
  @override
  Future<Result<AuthSession>> call(SignInParams p) => repository.signIn(p.email, p.password);
}

class SignInParams {
  final String email;
  final String password;
  const SignInParams(this.email, this.password);
}

class SignOut extends UseCase<void, NoParams> {
  final AuthRepository repository;
  SignOut(this.repository);
  @override
  Future<Result<void>> call(NoParams params) => repository.signOut();
}
