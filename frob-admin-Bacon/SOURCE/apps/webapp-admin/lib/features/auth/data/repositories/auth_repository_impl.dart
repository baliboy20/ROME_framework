import '../../../../core/data/repository_guard.dart';
import '../../../../core/session/session_store.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

/// Owns the session lifecycle: on sign-in it writes the bearer token to the
/// shared [SessionStore] every remote data source reads through; on sign-out it
/// clears it (idempotently, even if the network logout fails).
class AuthRepositoryImpl with RepositoryGuard implements AuthRepository {
  final AuthRemoteDataSource remote;
  final SessionStore session;
  AuthRepositoryImpl(this.remote, this.session);

  @override
  Future<Result<AuthSession>> signIn(String email, String password) => guard(() async {
        final res = await remote.ownerLogin(email, password);
        final token = res['token']?.toString() ?? '';
        session.set(token);
        return AuthSession(token: token, operatorName: res['name']?.toString() ?? 'William');
      });

  @override
  Future<Result<void>> signOut() => guard(() async {
        try {
          await remote.logout();
        } finally {
          session.clear(); // idempotent notice regardless (UXC-NAV-2)
        }
      });
}
