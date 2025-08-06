import 'package:equatable/equatable.dart';

import '../../domain/entities/blog.dart';
import '../../domain/usecases/create_blog.dart';

abstract class BlogEvent extends Equatable {
  const BlogEvent();

  @override
  List<Object?> get props => [];
}

class LoadBlogs extends BlogEvent {
  const LoadBlogs();
}

class SearchBlogsEvent extends BlogEvent {
  const SearchBlogsEvent(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class CreateBlogEvent extends BlogEvent {
  const CreateBlogEvent(this.params);

  final CreateBlogParams params;

  @override
  List<Object?> get props => [params];
}

class UpdateBlogEvent extends BlogEvent {
  const UpdateBlogEvent(this.blog);

  final Blog blog;

  @override
  List<Object?> get props => [blog];
}

class DeleteBlogEvent extends BlogEvent {
  const DeleteBlogEvent(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class PublishBlog extends BlogEvent {
  const PublishBlog(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class UnpublishBlog extends BlogEvent {
  const UnpublishBlog(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}

class RefreshBlogs extends BlogEvent {
  const RefreshBlogs();
}

class ClearSearch extends BlogEvent {
  const ClearSearch();
}