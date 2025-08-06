import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/result.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/services/app_logger.dart';
import '../../domain/entities/blog.dart';
import '../../domain/repositories/blog_repository.dart';
import '../models/blog_model.dart';

class BlogRepositoryImpl implements BlogRepository {
  BlogRepositoryImpl(this._dioClient);

  final DioClient _dioClient;

  /// Parse blog from the actual API response format
  Blog _parseBlogFromApi(Map<String, dynamic> json) {
    // Handle different field names from API
    final id = json['_id'] as String? ?? json['id'] as String? ?? '';
    final title = json['title'] as String? ?? json['name'] as String? ?? 'Unnamed Entry';
    final content = json['content'] as String? ?? json['description'] as String? ?? '';
    final status = json['draft'] as bool? ?? false ? BlogStatus.draft : BlogStatus.published;
    
    // Parse dates
    DateTime createdAt;
    DateTime updatedAt;
    
    try {
      createdAt = DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toIso8601String());
    } catch (e) {
      AppLogger.instance.warning('Failed to parse createdAt for blog, using current time: $e');
      createdAt = DateTime.now();
    }
    
    try {
      updatedAt = DateTime.parse(json['updatedAt'] as String? ?? DateTime.now().toIso8601String());
    } catch (e) {
      AppLogger.instance.warning('Failed to parse updatedAt for blog, using current time: $e');
      updatedAt = DateTime.now();
    }
    
    // Handle tags
    final tags = (json['tags'] as List<dynamic>?)?.cast<String>() ?? <String>[];
    
    return Blog(
      id: id,
      title: title,
      content: content,
      status: status,
      createdAt: createdAt,
      updatedAt: updatedAt,
      tags: tags,
    );
  }

  @override
  Future<Result<List<Blog>>> getAllBlogs() async {
    try {
      AppLogger.instance.debug('Starting to fetch all blogs from ${AppConstants.blogsEndpoint}');
      
      final response = await _dioClient.get<Map<String, dynamic>>(
        AppConstants.blogsEndpoint,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('Received null data from blogs endpoint');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw blogs API response: $data');
      
      // Handle the actual API response format: {"success": true, "data": [...]}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        AppLogger.instance.error('Blogs API returned success=false');
        return Result.failure(const ServerFailure('API request was not successful'));
      }
      
      final blogsJson = data['data'] as List<dynamic>? ?? [];
      AppLogger.instance.debug('Found ${blogsJson.length} blogs in API response');
      
      final blogs = <Blog>[];
      for (final blogJson in blogsJson) {
        try {
          final blog = _parseBlogFromApi(blogJson as Map<String, dynamic>);
          blogs.add(blog);
        } catch (e) {
          AppLogger.instance.warning('Failed to parse blog: $e, skipping blog: $blogJson');
        }
      }
      
      AppLogger.instance.info('Successfully fetched ${blogs.length} blogs from API');
      return Result.success(blogs);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error while fetching blogs', error: e);
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error while fetching blogs', error: e);
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error fetching blogs: $e');
      return Result.failure(UnexpectedFailure('Failed to fetch blogs: $e'));
    }
  }

  @override
  Future<Result<Blog>> getBlogById(String id) async {
    try {
      // TODO: Replace with actual API call
      await Future.delayed(const Duration(milliseconds: 500));
      return Result.failure(const ServerFailure('Blog not found'));
    } catch (e) {
      return Result.failure(ServerFailure('Failed to load blog: $e'));
    }
  }

  @override
  Future<Result<Blog>> createBlog(Blog blog) async {
    try {
      AppLogger.instance.debug('Creating blog: ${blog.title}');
      
      final blogModel = BlogModel.fromEntity(blog);
      final requestData = blogModel.toCreateJson();
      AppLogger.instance.debug('Sending create blog request: $requestData');
      
      final response = await _dioClient.post<Map<String, dynamic>>(
        AppConstants.blogsEndpoint,
        data: requestData,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from create blog API');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw create blog API response: $data');
      
      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        final errorMessage = data['message'] as String? ?? 'API request was not successful';
        final errors = data['errors'] as List<dynamic>? ?? [];
        AppLogger.instance.error('Create blog API returned success=false: $errorMessage, errors: $errors');
        return Result.failure(ServerFailure(errorMessage));
      }
      
      final blogData = data['data'] as Map<String, dynamic>?;
      if (blogData == null) {
        AppLogger.instance.error('No blog data in successful API response');
        return Result.failure(const ServerFailure('No blog data in response'));
      }
      
      final createdBlog = _parseBlogFromApi(blogData);
      
      AppLogger.instance.info('Successfully created blog: ${createdBlog.title}');
      return Result.success(createdBlog);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error creating blog: ${e.message}, status: ${e.statusCode}');
      if (e.statusCode == 400) {
        return Result.failure(ServerFailure('Invalid blog data: ${e.message}', statusCode: e.statusCode));
      }
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error creating blog: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error creating blog: $e');
      return Result.failure(ServerFailure('Failed to create blog: $e'));
    }
  }

  @override
  Future<Result<Blog>> updateBlog(Blog blog) async {
    try {
      AppLogger.instance.debug('Updating blog: ${blog.title}');
      
      final blogModel = BlogModel.fromEntity(blog);
      final requestData = blogModel.toCreateJson(); // Use create JSON to exclude server-managed fields
      AppLogger.instance.debug('Sending update blog request: $requestData');
      
      final response = await _dioClient.put<Map<String, dynamic>>(
        '${AppConstants.blogsEndpoint}/${blog.id}',
        data: requestData,
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from update blog API');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw update blog API response: $data');
      
      // Handle the API response format: {"success": true, "data": {...}}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        // Extract detailed error message from backend validation error  
        String errorMessage = 'API request was not successful';
        
        // Try to extract the error message from the response
        if (data['error'] is Map<String, dynamic>) {
          final error = data['error'] as Map<String, dynamic>;
          errorMessage = error['message'] as String? ?? errorMessage;
        } else if (data['message'] is String) {
          errorMessage = data['message'] as String;
        }
        
        AppLogger.instance.error('Update blog failed: $errorMessage, full response: $data');
        return Result.failure(ServerFailure(errorMessage));
      }
      
      final blogData = data['data'] as Map<String, dynamic>?;
      if (blogData == null) {
        AppLogger.instance.error('No blog data in successful API response');
        return Result.failure(const ServerFailure('No blog data in response'));
      }
      
      final updatedBlog = _parseBlogFromApi(blogData);
      
      AppLogger.instance.info('Successfully updated blog: ${updatedBlog.title}');
      return Result.success(updatedBlog);
      
    } on ServerException catch (e) {
      String errorMessage = e.message;
      
      // Try to extract more detailed error information from server response
      if (e.statusCode == 400) {
        // For validation errors, provide more specific messaging
        if (errorMessage.toLowerCase().contains('validation')) {
          errorMessage = 'Validation failed: $errorMessage';
        }
      }
      
      AppLogger.instance.error('Server error updating blog: $errorMessage, status: ${e.statusCode}');
      return Result.failure(ServerFailure(errorMessage, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error updating blog: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error updating blog: $e');
      return Result.failure(ServerFailure('Failed to update blog: $e'));
    }
  }

  @override
  Future<Result<void>> deleteBlog(String id) async {
    try {
      AppLogger.instance.debug('Deleting blog with ID: $id');
      
      final response = await _dioClient.delete<Map<String, dynamic>>(
        '${AppConstants.blogsEndpoint}/$id',
      );
      
      final data = response.data;
      if (data == null) {
        AppLogger.instance.error('No data received from delete blog API');
        return Result.failure(const ServerFailure('No data received from server'));
      }
      
      AppLogger.instance.debug('Raw delete blog API response: $data');
      
      // Handle the API response format: {"success": true}
      final success = data['success'] as bool? ?? false;
      if (!success) {
        final errorMessage = data['message'] as String? ?? 'API request was not successful';
        AppLogger.instance.error('Delete blog API returned success=false: $errorMessage');
        return Result.failure(ServerFailure(errorMessage));
      }
      
      AppLogger.instance.info('Successfully deleted blog: $id');
      return Result.success(null);
      
    } on ServerException catch (e) {
      AppLogger.instance.error('Server error deleting blog: ${e.message}, status: ${e.statusCode}');
      return Result.failure(ServerFailure(e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      AppLogger.instance.error('Network error deleting blog: ${e.message}');
      return Result.failure(NetworkFailure(e.message));
    } catch (e) {
      AppLogger.instance.error('Unexpected error deleting blog: $e');
      return Result.failure(ServerFailure('Failed to delete blog: $e'));
    }
  }

  @override
  Future<Result<List<Blog>>> searchBlogs(String query) async {
    try {
      AppLogger.instance.debug('Searching blogs with query: $query');
      
      // For now, implement search as client-side filtering since we don't have search API
      final allBlogsResult = await getAllBlogs();
      
      if (allBlogsResult is Error) {
        return allBlogsResult;
      }
      
      final allBlogs = (allBlogsResult as Success<List<Blog>>).data;
      final filteredBlogs = allBlogs.where((blog) {
        return blog.title.toLowerCase().contains(query.toLowerCase()) ||
               blog.content.toLowerCase().contains(query.toLowerCase()) ||
               blog.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase()));
      }).toList();
      
      AppLogger.instance.info('Found ${filteredBlogs.length} blogs matching query: $query');
      return Result.success(filteredBlogs);
      
    } catch (e) {
      AppLogger.instance.error('Error searching blogs: $e');
      return Result.failure(UnexpectedFailure('Failed to search blogs: $e'));
    }
  }

  // Placeholder implementations for remaining methods
  @override
  Future<Result<List<Blog>>> getBlogsByStatus(BlogStatus status) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getBlogsByProjectId(String projectId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getBlogsByTaskId(String taskId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getBlogsByAuthor(String authorId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getBlogsByTags(List<String> tags) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getRecentBlogs({int limit = 20, int offset = 0}) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getPublishedBlogs() async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<List<Blog>>> getDraftBlogs() async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> publishBlog(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> unpublishBlog(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> archiveBlog(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> restoreBlog(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> updateBlogContent(String id, String content) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> addTagsToBlog(String id, List<String> tags) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> removeTagsFromBlog(String id, List<String> tags) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> linkBlogToProject(String id, String projectId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> unlinkBlogFromProject(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> linkBlogToTask(String id, String taskId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> unlinkBlogFromTask(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> uploadAttachment(String id, String filePath) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> removeAttachment(String id, String attachmentId) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<BlogStatistics>> getBlogStatistics() async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> generateSummary(String id) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }

  @override
  Future<Result<Blog>> updateReadTime(String id, int readTimeMinutes) async {
    return Result.failure(const NotImplementedFailure('Not implemented yet'));
  }
}

class NotImplementedFailure extends Failure {
  const NotImplementedFailure(super.message);
}