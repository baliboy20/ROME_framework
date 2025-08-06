import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../entities/blog.dart';
import '../repositories/blog_repository.dart';

class CreateBlog {
  const CreateBlog(this._repository);

  final BlogRepository _repository;

  Future<Result<Blog>> call(CreateBlogParams params) async {
    // Validate input
    final validationResult = _validateParams(params);
    if (validationResult != null) {
      return Result.failure(validationResult);
    }

    // Create blog entity
    final blog = Blog(
      id: '', // Will be assigned by the server
      title: params.title,
      content: params.content,
      status: params.status,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      authorId: params.authorId,
      projectId: params.projectId,
      taskId: params.taskId,
      tags: params.tags,
    );

    return await _repository.createBlog(blog);
  }

  ValidationFailure? _validateParams(CreateBlogParams params) {
    if (params.title.trim().isEmpty) {
      return const ValidationFailure('Blog title cannot be empty');
    }

    if (params.title.length > 200) {
      return const ValidationFailure('Blog title cannot exceed 200 characters');
    }

    if (params.content.trim().isEmpty) {
      return const ValidationFailure('Blog content cannot be empty');
    }

    if (params.content.length > 50000) {
      return const ValidationFailure('Blog content cannot exceed 50,000 characters');
    }

    return null;
  }
}

class CreateBlogParams {
  const CreateBlogParams({
    required this.title,
    required this.content,
    required this.status,
    this.authorId,
    this.projectId,
    this.taskId,
    this.tags = const [],
  });

  final String title;
  final String content;
  final BlogStatus status;
  final String? authorId;
  final String? projectId;
  final String? taskId;
  final List<String> tags;

  @override
  String toString() {
    return 'CreateBlogParams(title: $title, status: $status)';
  }
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}