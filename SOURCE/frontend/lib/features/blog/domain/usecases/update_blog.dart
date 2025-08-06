import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/blog.dart';
import '../repositories/blog_repository.dart';

class UpdateBlog {
  const UpdateBlog(this._repository);

  final BlogRepository _repository;

  Future<Result<Blog>> call(Blog blog) async {
    // Validate input
    final validationResult = _validateBlog(blog);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Update the blog's updatedAt timestamp
    final updatedBlog = blog.copyWith(
      updatedAt: DateTime.now(),
    );

    return await _repository.updateBlog(updatedBlog);
  }

  ValidationFailure? _validateBlog(Blog blog) {
    if (blog.id.isEmpty) {
      return const ValidationFailure('Blog ID cannot be empty');
    }

    if (blog.title.trim().isEmpty) {
      return const ValidationFailure('Blog title cannot be empty');
    }

    if (blog.title.length > 200) {
      return const ValidationFailure('Blog title cannot exceed 200 characters');
    }

    if (blog.content.trim().isEmpty) {
      return const ValidationFailure('Blog content cannot be empty');
    }

    if (blog.content.length > 50000) {
      return const ValidationFailure('Blog content cannot exceed 50,000 characters');
    }

    return null;
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}