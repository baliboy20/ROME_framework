import '../error/exceptions.dart';
import '../error/failures.dart';
import '../types/result.dart';

/// Shared exception→Failure mapping for repository implementations. Mix in and
/// wrap each data-source call in [guard] so every repo maps errors identically
/// and never throws (expert_flutter §error-handling).
mixin RepositoryGuard {
  Future<Result<T>> guard<T>(Future<T> Function() run) async {
    try {
      return Success(await run());
    } on AuthException catch (e) {
      return Error(AuthFailure(e.message));
    } on ValidationException catch (e) {
      return Error(ValidationFailure(e.message));
    } on NetworkException catch (e) {
      return Error(NetworkFailure(e.message));
    } on ServerException catch (e) {
      return Error(ServerFailure(e.message, statusCode: e.statusCode));
    } catch (_) {
      return const Error(ServerFailure('Something went wrong. Please try again.'));
    }
  }
}
