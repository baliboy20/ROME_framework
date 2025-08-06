import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/services/app_logger.dart';
import '../../../../core/utils/result.dart';
import '../../../../main.dart';
import '../../domain/usecases/create_blog.dart';
import '../../domain/usecases/delete_blog.dart';
import '../../domain/usecases/get_all_blogs.dart';
import '../../domain/usecases/search_blogs.dart';
import '../../domain/usecases/update_blog.dart';
import 'blog_event.dart';
import 'blog_state.dart';

class BlogBloc extends Bloc<BlogEvent, BlogState> {
  BlogBloc({
    required GetAllBlogs getAllBlogs,
    required SearchBlogs searchBlogs,
    required CreateBlog createBlog,
    required UpdateBlog updateBlog,
    required DeleteBlog deleteBlog,
  })  : _getAllBlogs = getAllBlogs,
        _searchBlogs = searchBlogs,
        _createBlog = createBlog,
        _updateBlog = updateBlog,
        _deleteBlog = deleteBlog,
        super(const BlogInitial()) {
    on<LoadBlogs>(_onLoadBlogs);
    on<SearchBlogsEvent>(_onSearchBlogs);
    on<CreateBlogEvent>(_onCreateBlog);
    on<UpdateBlogEvent>(_onUpdateBlog);
    on<DeleteBlogEvent>(_onDeleteBlog);
    on<ClearSearch>(_onClearSearch);
    on<RefreshBlogs>(_onRefreshBlogs);
  }

  final GetAllBlogs _getAllBlogs;
  final SearchBlogs _searchBlogs;
  final CreateBlog _createBlog;
  final UpdateBlog _updateBlog;
  final DeleteBlog _deleteBlog;

  Future<void> _onLoadBlogs(
    LoadBlogs event,
    Emitter<BlogState> emit,
  ) async {
    emit(const BlogLoading());
    
    try {
      final result = await _getAllBlogs();
      
      switch (result) {
        case Success<List<dynamic>>():
          final blogs = result.data;
          emit(BlogsLoaded(blogs));
          logger.i('Loaded ${blogs.length} blogs');
        case Error<List<dynamic>>():
          emit(BlogError(result.failure));
          logger.e('Failed to load blogs: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error loading blogs', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onSearchBlogs(
    SearchBlogsEvent event,
    Emitter<BlogState> emit,
  ) async {
    if (event.query.trim().isEmpty) {
      // Load all blogs when search is cleared
      add(const LoadBlogs());
      return;
    }

    emit(const BlogLoading());
    
    try {
      final result = await _searchBlogs(event.query);
      
      switch (result) {
        case Success<List<dynamic>>():
          final blogs = result.data;
          emit(BlogsLoaded(blogs, isSearchResult: true, searchQuery: event.query));
          logger.i('Found ${blogs.length} blogs matching "${event.query}"');
        case Error<List<dynamic>>():
          emit(BlogError(result.failure));
          logger.e('Failed to search blogs: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error searching blogs', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onCreateBlog(
    CreateBlogEvent event,
    Emitter<BlogState> emit,
  ) async {
    emit(const BlogOperationLoading('Creating blog entry'));
    
    try {
      final result = await _createBlog(event.params);
      
      switch (result) {
        case Success():
          final blog = result.data;
          emit(BlogCreated(blog));
          logger.i('Created blog: ${blog.title}');
          
          // Automatically reload blogs after creation
          add(const RefreshBlogs());
        case Error():
          emit(BlogError(result.failure));
          logger.e('Failed to create blog: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error creating blog', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onUpdateBlog(
    UpdateBlogEvent event,
    Emitter<BlogState> emit,
  ) async {
    emit(const BlogOperationLoading('Updating blog entry'));
    
    try {
      final result = await _updateBlog(event.blog);
      
      switch (result) {
        case Success():
          final blog = result.data;
          emit(BlogUpdated(blog));
          logger.i('Updated blog: ${blog.title}');
          
          // Automatically reload blogs after update
          add(const RefreshBlogs());
        case Error():
          emit(BlogError(result.failure));
          logger.e('Failed to update blog: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error updating blog', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onDeleteBlog(
    DeleteBlogEvent event,
    Emitter<BlogState> emit,
  ) async {
    emit(const BlogOperationLoading('Deleting blog entry'));
    
    try {
      final result = await _deleteBlog(event.id);
      
      switch (result) {
        case Success():
          emit(BlogDeleted(event.id));
          logger.i('Deleted blog: ${event.id}');
          
          // Automatically reload blogs after deletion
          add(const RefreshBlogs());
        case Error():
          emit(BlogError(result.failure));
          logger.e('Failed to delete blog ${event.id}: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error deleting blog ${event.id}', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }

  Future<void> _onClearSearch(
    ClearSearch event,
    Emitter<BlogState> emit,
  ) async {
    // Load all blogs when search is cleared
    add(const LoadBlogs());
  }

  Future<void> _onRefreshBlogs(
    RefreshBlogs event,
    Emitter<BlogState> emit,
  ) async {
    // Don't show loading state for refresh
    try {
      final result = await _getAllBlogs();
      
      switch (result) {
        case Success<List<dynamic>>():
          final blogs = result.data;
          emit(BlogsLoaded(blogs));
          logger.i('Refreshed ${blogs.length} blogs');
        case Error<List<dynamic>>():
          emit(BlogError(result.failure));
          logger.e('Failed to refresh blogs: ${result.failure.message}');
      }
    } catch (e, stackTrace) {
      logger.e('Unexpected error refreshing blogs', error: e, stackTrace: stackTrace);
      emit(BlogError(UnexpectedFailure('An unexpected error occurred: $e')));
    }
  }
}

class UnexpectedFailure extends Failure {
  const UnexpectedFailure(super.message);
}