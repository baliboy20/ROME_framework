import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/blog_repository.dart';

class DeleteBlog {
  const DeleteBlog(this._repository);

  final BlogRepository _repository;

  Future<Result<void>> call(String id) async {
    if (id.isEmpty) {
      return Result.failure(const ValidationFailure('Blog ID cannot be empty'));
    }
    
    return await _repository.deleteBlog(id);
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}