import 'package:equatable/equatable.dart';

import '../../../../core/errors/failures.dart';
import '../../domain/entities/blog.dart';

abstract class BlogState extends Equatable {
  const BlogState();

  @override
  List<Object?> get props => [];
}

class BlogInitial extends BlogState {
  const BlogInitial();
}

class BlogLoading extends BlogState {
  const BlogLoading();
}

class BlogsLoaded extends BlogState {
  const BlogsLoaded(this.blogs, {this.isSearchResult = false, this.searchQuery});

  final List<Blog> blogs;
  final bool isSearchResult;
  final String? searchQuery;

  @override
  List<Object?> get props => [blogs, isSearchResult, searchQuery];
}

class BlogCreated extends BlogState {
  const BlogCreated(this.blog);

  final Blog blog;

  @override
  List<Object?> get props => [blog];
}

class BlogUpdated extends BlogState {
  const BlogUpdated(this.blog);

  final Blog blog;

  @override
  List<Object?> get props => [blog];
}

class BlogDeleted extends BlogState {
  const BlogDeleted(this.blogId);

  final String blogId;

  @override
  List<Object?> get props => [blogId];
}

class BlogPublished extends BlogState {
  const BlogPublished(this.blog);

  final Blog blog;

  @override
  List<Object?> get props => [blog];
}

class BlogUnpublished extends BlogState {
  const BlogUnpublished(this.blog);

  final Blog blog;

  @override
  List<Object?> get props => [blog];
}

class BlogError extends BlogState {
  const BlogError(this.failure);

  final Failure failure;

  @override
  List<Object?> get props => [failure];

  String get message => failure.message;
}

class BlogOperationLoading extends BlogState {
  const BlogOperationLoading(this.operation);

  final String operation;

  @override
  List<Object?> get props => [operation];
}