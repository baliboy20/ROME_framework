import '../../../../core/utils/result.dart';
import '../entities/blog.dart';
import '../repositories/blog_repository.dart';

class SearchBlogs {
  const SearchBlogs(this._repository);

  final BlogRepository _repository;

  Future<Result<List<Blog>>> call(String query) async {
    if (query.trim().isEmpty) {
      // Return empty list for empty queries
      return Result.success([]);
    }
    
    return await _repository.searchBlogs(query.trim());
  }
}