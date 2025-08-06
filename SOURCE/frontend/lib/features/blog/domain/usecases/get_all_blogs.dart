import '../../../../core/utils/result.dart';
import '../entities/blog.dart';
import '../repositories/blog_repository.dart';

class GetAllBlogs {
  const GetAllBlogs(this._repository);

  final BlogRepository _repository;

  Future<Result<List<Blog>>> call() async {
    return await _repository.getAllBlogs();
  }
}