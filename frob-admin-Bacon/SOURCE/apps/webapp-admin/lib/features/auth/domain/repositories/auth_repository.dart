import '../../../../core/types/result.dart';
import '../entities/auth_session.dart';

abstract class AuthRepository {
  Future<Result<AuthSession>> signIn(String email, String password);
  Future<Result<void>> signOut();
}
