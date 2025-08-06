import '../../../../core/utils/result.dart';
import '../entities/blog.dart';

/// Repository interface for blog data operations
/// This defines the contract for blog data access in the domain layer
abstract class BlogRepository {
  /// Get all blogs
  /// Returns either a failure or list of blogs
  Future<Result<List<Blog>>> getAllBlogs();

  /// Get blog by ID
  /// Returns either a failure or the blog
  Future<Result<Blog>> getBlogById(String id);

  /// Get blogs by status
  /// Returns either a failure or list of blogs with matching status
  Future<Result<List<Blog>>> getBlogsByStatus(BlogStatus status);

  /// Get blogs by project ID
  /// Returns either a failure or list of blogs for the project
  Future<Result<List<Blog>>> getBlogsByProjectId(String projectId);

  /// Get blogs by task ID
  /// Returns either a failure or list of blogs for the task
  Future<Result<List<Blog>>> getBlogsByTaskId(String taskId);

  /// Get blogs by author
  /// Returns either a failure or list of blogs by the author
  Future<Result<List<Blog>>> getBlogsByAuthor(String authorId);

  /// Search blogs by title or content
  /// Returns either a failure or list of matching blogs
  Future<Result<List<Blog>>> searchBlogs(String query);

  /// Get blogs by tags
  /// Returns either a failure or list of blogs with matching tags
  Future<Result<List<Blog>>> getBlogsByTags(List<String> tags);

  /// Get recent blogs (paginated)
  /// Returns either a failure or list of recent blogs
  Future<Result<List<Blog>>> getRecentBlogs({int limit = 20, int offset = 0});

  /// Get published blogs only
  /// Returns either a failure or list of published blogs
  Future<Result<List<Blog>>> getPublishedBlogs();

  /// Get draft blogs
  /// Returns either a failure or list of draft blogs
  Future<Result<List<Blog>>> getDraftBlogs();

  /// Create a new blog
  /// Returns either a failure or the created blog
  Future<Result<Blog>> createBlog(Blog blog);

  /// Update an existing blog
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> updateBlog(Blog blog);

  /// Delete a blog
  /// Returns either a failure or success
  Future<Result<void>> deleteBlog(String id);

  /// Publish a blog
  /// Returns either a failure or the published blog
  Future<Result<Blog>> publishBlog(String id);

  /// Unpublish a blog (revert to draft)
  /// Returns either a failure or the unpublished blog
  Future<Result<Blog>> unpublishBlog(String id);

  /// Archive a blog
  /// Returns either a failure or the archived blog
  Future<Result<Blog>> archiveBlog(String id);

  /// Restore an archived blog
  /// Returns either a failure or the restored blog
  Future<Result<Blog>> restoreBlog(String id);

  /// Update blog content
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> updateBlogContent(String id, String content);

  /// Add tags to blog
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> addTagsToBlog(String id, List<String> tags);

  /// Remove tags from blog
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> removeTagsFromBlog(String id, List<String> tags);

  /// Link blog to project
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> linkBlogToProject(String id, String projectId);

  /// Unlink blog from project
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> unlinkBlogFromProject(String id);

  /// Link blog to task
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> linkBlogToTask(String id, String taskId);

  /// Unlink blog from task
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> unlinkBlogFromTask(String id);

  /// Upload attachment to blog
  /// Returns either a failure or the updated blog with new attachment
  Future<Result<Blog>> uploadAttachment(String id, String filePath);

  /// Remove attachment from blog
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> removeAttachment(String id, String attachmentId);

  /// Get blog statistics
  /// Returns either a failure or blog statistics
  Future<Result<BlogStatistics>> getBlogStatistics();

  /// Generate auto-summary for blog
  /// Returns either a failure or the blog with generated summary
  Future<Result<Blog>> generateSummary(String id);

  /// Update read time estimate
  /// Returns either a failure or the updated blog
  Future<Result<Blog>> updateReadTime(String id, int readTimeMinutes);
}

/// Blog statistics model
class BlogStatistics {
  const BlogStatistics({
    required this.totalBlogs,
    required this.publishedBlogs,
    required this.draftBlogs,
    required this.archivedBlogs,
    required this.scheduledBlogs,
    required this.totalWords,
    required this.averageReadTime,
    required this.mostUsedTags,
    required this.blogsPerMonth,
  });

  final int totalBlogs;
  final int publishedBlogs;
  final int draftBlogs;
  final int archivedBlogs;
  final int scheduledBlogs;
  final int totalWords;
  final Duration averageReadTime;
  final Map<String, int> mostUsedTags;
  final Map<String, int> blogsPerMonth; // Month -> count

  double get publishedRate {
    if (totalBlogs == 0) return 0.0;
    return publishedBlogs / totalBlogs;
  }

  @override
  String toString() {
    return 'BlogStatistics(total: $totalBlogs, published: $publishedBlogs, drafts: $draftBlogs)';
  }
}

/// Blog search filters
class BlogSearchFilters {
  const BlogSearchFilters({
    this.status,
    this.projectId,
    this.taskId,
    this.authorId,
    this.tags,
    this.dateFrom,
    this.dateTo,
    this.minReadTime,
    this.maxReadTime,
  });

  final BlogStatus? status;
  final String? projectId;
  final String? taskId;
  final String? authorId;
  final List<String>? tags;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final int? minReadTime;
  final int? maxReadTime;

  @override
  String toString() {
    return 'BlogSearchFilters(status: $status, projectId: $projectId, tags: $tags)';
  }
}