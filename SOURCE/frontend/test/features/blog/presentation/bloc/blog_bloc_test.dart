import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/core/utils/result.dart';
import '../../../../../lib/features/blog/domain/entities/blog.dart';
import '../../../../../lib/features/blog/domain/usecases/create_blog.dart';
import '../../../../../lib/features/blog/domain/usecases/delete_blog.dart';
import '../../../../../lib/features/blog/domain/usecases/get_all_blogs.dart';
import '../../../../../lib/features/blog/domain/usecases/search_blogs.dart';
import '../../../../../lib/features/blog/domain/usecases/update_blog.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_bloc.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_event.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_state.dart';

// Mock classes
class MockGetAllBlogs extends Mock implements GetAllBlogs {}
class MockSearchBlogs extends Mock implements SearchBlogs {}
class MockCreateBlog extends Mock implements CreateBlog {}
class MockUpdateBlog extends Mock implements UpdateBlog {}
class MockDeleteBlog extends Mock implements DeleteBlog {}

void main() {
  group('BlogBloc', () {
    late BlogBloc blogBloc;
    late MockGetAllBlogs mockGetAllBlogs;
    late MockSearchBlogs mockSearchBlogs;
    late MockCreateBlog mockCreateBlog;
    late MockUpdateBlog mockUpdateBlog;
    late MockDeleteBlog mockDeleteBlog;

    // Test data
    final testBlog = Blog(
      id: '1',
      title: 'Test Blog',
      content: 'Test Content',
      tags: ['test', 'blog'],
      projectId: 'project-1',
      isPublished: false,
      createdAt: DateTime(2025, 1, 1),
      updatedAt: DateTime(2025, 1, 1),
      attachments: [],
    );

    final testBlogs = [
      testBlog,
      Blog(
        id: '2',
        title: 'Another Blog',
        content: 'Another Content',
        tags: ['another', 'test'],
        projectId: 'project-2',
        isPublished: true,
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        attachments: [],
      ),
    ];

    final testCreateParams = CreateBlogParams(
      title: 'New Blog',
      content: 'New Content',
      tags: ['new', 'blog'],
      projectId: 'project-1',
      isPublished: false,
    );

    setUp(() {
      mockGetAllBlogs = MockGetAllBlogs();
      mockSearchBlogs = MockSearchBlogs();
      mockCreateBlog = MockCreateBlog();
      mockUpdateBlog = MockUpdateBlog();
      mockDeleteBlog = MockDeleteBlog();

      blogBloc = BlogBloc(
        getAllBlogs: mockGetAllBlogs,
        searchBlogs: mockSearchBlogs,
        createBlog: mockCreateBlog,
        updateBlog: mockUpdateBlog,
        deleteBlog: mockDeleteBlog,
      );

      // Register fallback values for mocktail
      registerFallbackValue(testCreateParams);
      registerFallbackValue(testBlog);
      registerFallbackValue('test-query');
      registerFallbackValue('test-id');
    });

    tearDown(() {
      blogBloc.close();
    });

    test('initial state should be BlogInitial', () {
      expect(blogBloc.state, const BlogInitial());
    });

    group('LoadBlogs', () {
      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogsLoaded] when GetAllBlogs succeeds',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const LoadBlogs()),
        expect: () => [
          const BlogLoading(),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogError] when GetAllBlogs fails',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Server error')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const LoadBlogs()),
        expect: () => [
          const BlogLoading(),
          const BlogError(ServerFailure('Server error')),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogsLoaded] with empty list when no blogs exist',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(<Blog>[]),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const LoadBlogs()),
        expect: () => [
          const BlogLoading(),
          const BlogsLoaded(<Blog>[]),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogError] when unexpected exception occurs',
        build: () {
          when(() => mockGetAllBlogs()).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const LoadBlogs()),
        expect: () => [
          const BlogLoading(),
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('SearchBlogsEvent', () {
      const searchQuery = 'test query';

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogsLoaded] when SearchBlogs succeeds',
        build: () {
          when(() => mockSearchBlogs(any())).thenAnswer(
            (_) async => Result.success([testBlog]),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const SearchBlogsEvent(searchQuery)),
        expect: () => [
          const BlogLoading(),
          BlogsLoaded([testBlog], isSearchResult: true, searchQuery: searchQuery),
        ],
        verify: (_) {
          verify(() => mockSearchBlogs(searchQuery)).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogError] when SearchBlogs fails',
        build: () {
          when(() => mockSearchBlogs(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Search failed')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const SearchBlogsEvent(searchQuery)),
        expect: () => [
          const BlogLoading(),
          const BlogError(ServerFailure('Search failed')),
        ],
        verify: (_) {
          verify(() => mockSearchBlogs(searchQuery)).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'triggers LoadBlogs when search query is empty',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const SearchBlogsEvent('')),
        expect: () => [
          const BlogLoading(),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
          verifyNever(() => mockSearchBlogs(any()));
        },
      );

      blocTest<BlogBloc, BlogState>(
        'triggers LoadBlogs when search query is only whitespace',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const SearchBlogsEvent('   ')),
        expect: () => [
          const BlogLoading(),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
          verifyNever(() => mockSearchBlogs(any()));
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogLoading, BlogError] when unexpected exception occurs',
        build: () {
          when(() => mockSearchBlogs(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const SearchBlogsEvent(searchQuery)),
        expect: () => [
          const BlogLoading(),
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('CreateBlogEvent', () {
      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogCreated, BlogsLoaded] when CreateBlog succeeds',
        build: () {
          when(() => mockCreateBlog(any())).thenAnswer(
            (_) async => Result.success(testBlog),
          );
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(CreateBlogEvent(testCreateParams)),
        expect: () => [
          const BlogOperationLoading('Creating blog entry'),
          BlogCreated(testBlog),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockCreateBlog(testCreateParams)).called(1);
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when CreateBlog fails with validation error',
        build: () {
          when(() => mockCreateBlog(any())).thenAnswer(
            (_) async => Result.failure(const ValidationFailure('Title is required')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(CreateBlogEvent(testCreateParams)),
        expect: () => [
          const BlogOperationLoading('Creating blog entry'),
          const BlogError(ValidationFailure('Title is required')),
        ],
        verify: (_) {
          verify(() => mockCreateBlog(testCreateParams)).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when CreateBlog fails with server error',
        build: () {
          when(() => mockCreateBlog(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to create blog')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(CreateBlogEvent(testCreateParams)),
        expect: () => [
          const BlogOperationLoading('Creating blog entry'),
          const BlogError(ServerFailure('Failed to create blog')),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when unexpected exception occurs',
        build: () {
          when(() => mockCreateBlog(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(CreateBlogEvent(testCreateParams)),
        expect: () => [
          const BlogOperationLoading('Creating blog entry'),
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('UpdateBlogEvent', () {
      final updatedBlog = testBlog.copyWith(
        title: 'Updated Blog Title',
        content: 'Updated Content',
        isPublished: true,
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogUpdated, BlogsLoaded] when UpdateBlog succeeds',
        build: () {
          when(() => mockUpdateBlog(any())).thenAnswer(
            (_) async => Result.success(updatedBlog),
          );
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(UpdateBlogEvent(updatedBlog)),
        expect: () => [
          const BlogOperationLoading('Updating blog entry'),
          BlogUpdated(updatedBlog),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockUpdateBlog(updatedBlog)).called(1);
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when UpdateBlog fails',
        build: () {
          when(() => mockUpdateBlog(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to update blog')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(UpdateBlogEvent(updatedBlog)),
        expect: () => [
          const BlogOperationLoading('Updating blog entry'),
          const BlogError(ServerFailure('Failed to update blog')),
        ],
        verify: (_) {
          verify(() => mockUpdateBlog(updatedBlog)).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when blog is not found',
        build: () {
          when(() => mockUpdateBlog(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Blog not found')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(UpdateBlogEvent(updatedBlog)),
        expect: () => [
          const BlogOperationLoading('Updating blog entry'),
          const BlogError(NotFoundFailure('Blog not found')),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when unexpected exception occurs',
        build: () {
          when(() => mockUpdateBlog(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(UpdateBlogEvent(updatedBlog)),
        expect: () => [
          const BlogOperationLoading('Updating blog entry'),
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('DeleteBlogEvent', () {
      const blogId = 'test-blog-id';

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogDeleted, BlogsLoaded] when DeleteBlog succeeds',
        build: () {
          when(() => mockDeleteBlog(any())).thenAnswer(
            (_) async => Result.success(null),
          );
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const DeleteBlogEvent(blogId)),
        expect: () => [
          const BlogOperationLoading('Deleting blog entry'),
          const BlogDeleted(blogId),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockDeleteBlog(blogId)).called(1);
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when DeleteBlog fails',
        build: () {
          when(() => mockDeleteBlog(any())).thenAnswer(
            (_) async => Result.failure(const ServerFailure('Failed to delete blog')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const DeleteBlogEvent(blogId)),
        expect: () => [
          const BlogOperationLoading('Deleting blog entry'),
          const BlogError(ServerFailure('Failed to delete blog')),
        ],
        verify: (_) {
          verify(() => mockDeleteBlog(blogId)).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when blog is not found for deletion',
        build: () {
          when(() => mockDeleteBlog(any())).thenAnswer(
            (_) async => Result.failure(const NotFoundFailure('Blog not found')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const DeleteBlogEvent(blogId)),
        expect: () => [
          const BlogOperationLoading('Deleting blog entry'),
          const BlogError(NotFoundFailure('Blog not found')),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogOperationLoading, BlogError] when unexpected exception occurs',
        build: () {
          when(() => mockDeleteBlog(any())).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const DeleteBlogEvent(blogId)),
        expect: () => [
          const BlogOperationLoading('Deleting blog entry'),
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('ClearSearch', () {
      blocTest<BlogBloc, BlogState>(
        'triggers LoadBlogs when ClearSearch is called',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const ClearSearch()),
        expect: () => [
          const BlogLoading(),
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
        },
      );
    });

    group('RefreshBlogs', () {
      blocTest<BlogBloc, BlogState>(
        'emits [BlogsLoaded] when RefreshBlogs succeeds (no loading state)',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const RefreshBlogs()),
        expect: () => [
          BlogsLoaded(testBlogs),
        ],
        verify: (_) {
          verify(() => mockGetAllBlogs()).called(1);
        },
      );

      blocTest<BlogBloc, BlogState>(
        'emits [BlogError] when RefreshBlogs fails',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.failure(const NetworkFailure('Network error')),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const RefreshBlogs()),
        expect: () => [
          const BlogError(NetworkFailure('Network error')),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'emits BlogError when unexpected exception occurs',
        build: () {
          when(() => mockGetAllBlogs()).thenThrow(
            Exception('Unexpected error'),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const RefreshBlogs()),
        expect: () => [
          isA<BlogError>().having(
            (error) => error.failure,
            'failure',
            isA<UnexpectedFailure>(),
          ),
        ],
      );
    });

    group('Sequential Events', () {
      blocTest<BlogBloc, BlogState>(
        'handles multiple sequential events correctly',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          when(() => mockCreateBlog(any())).thenAnswer(
            (_) async => Result.success(testBlog),
          );
          return blogBloc;
        },
        act: (bloc) {
          bloc.add(const LoadBlogs());
          bloc.add(CreateBlogEvent(testCreateParams));
        },
        expect: () => [
          const BlogLoading(),
          BlogsLoaded(testBlogs),
          const BlogOperationLoading('Creating blog entry'),
          BlogCreated(testBlog),
          BlogsLoaded(testBlogs),
        ],
      );

      blocTest<BlogBloc, BlogState>(
        'handles search then clear search correctly',
        build: () {
          when(() => mockSearchBlogs(any())).thenAnswer(
            (_) async => Result.success([testBlog]),
          );
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(testBlogs),
          );
          return blogBloc;
        },
        act: (bloc) {
          bloc.add(const SearchBlogsEvent('test'));
          bloc.add(const ClearSearch());
        },
        expect: () => [
          const BlogLoading(),
          BlogsLoaded([testBlog], isSearchResult: true, searchQuery: 'test'),
          const BlogLoading(),
          BlogsLoaded(testBlogs),
        ],
      );
    });

    group('State Equality', () {
      test('BlogsLoaded states with same blogs should be equal', () {
        final state1 = BlogsLoaded(testBlogs);
        final state2 = BlogsLoaded(testBlogs);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('BlogsLoaded states with different search parameters should not be equal', () {
        final state1 = BlogsLoaded(testBlogs, isSearchResult: true, searchQuery: 'test');
        final state2 = BlogsLoaded(testBlogs, isSearchResult: false);
        
        expect(state1, isNot(equals(state2)));
      });

      test('BlogError states with same failure should be equal', () {
        const failure = ServerFailure('Error message');
        const state1 = BlogError(failure);
        const state2 = BlogError(failure);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('BlogCreated states with same blog should be equal', () {
        final state1 = BlogCreated(testBlog);
        final state2 = BlogCreated(testBlog);
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });

      test('BlogOperationLoading states with same operation should be equal', () {
        const state1 = BlogOperationLoading('Creating blog entry');
        const state2 = BlogOperationLoading('Creating blog entry');
        
        expect(state1, equals(state2));
        expect(state1.hashCode, equals(state2.hashCode));
      });
    });

    group('Event Equality', () {
      test('SearchBlogsEvent events with same query should be equal', () {
        const event1 = SearchBlogsEvent('test query');
        const event2 = SearchBlogsEvent('test query');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('CreateBlogEvent events with same params should be equal', () {
        final event1 = CreateBlogEvent(testCreateParams);
        final event2 = CreateBlogEvent(testCreateParams);
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('DeleteBlogEvent events with same id should be equal', () {
        const event1 = DeleteBlogEvent('test-id');
        const event2 = DeleteBlogEvent('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('PublishBlog events with same id should be equal', () {
        const event1 = PublishBlog('test-id');
        const event2 = PublishBlog('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });

      test('UnpublishBlog events with same id should be equal', () {
        const event1 = UnpublishBlog('test-id');
        const event2 = UnpublishBlog('test-id');
        
        expect(event1, equals(event2));
        expect(event1.hashCode, equals(event2.hashCode));
      });
    });

    group('Edge Cases', () {
      test('BlogError message property returns failure message', () {
        const failure = ServerFailure('Test error message');
        const blogError = BlogError(failure);
        
        expect(blogError.message, equals('Test error message'));
      });

      blocTest<BlogBloc, BlogState>(
        'handles null results gracefully',
        build: () {
          when(() => mockGetAllBlogs()).thenAnswer(
            (_) async => Result.success(null),
          );
          return blogBloc;
        },
        act: (bloc) => bloc.add(const LoadBlogs()),
        expect: () => [
          const BlogLoading(),
          const BlogsLoaded(<Blog>[]),
        ],
      );

      test('BlogsLoaded with search parameters has correct properties', () {
        const state = BlogsLoaded(
          [],
          isSearchResult: true,
          searchQuery: 'test query',
        );
        
        expect(state.isSearchResult, isTrue);
        expect(state.searchQuery, equals('test query'));
      });

      test('BlogsLoaded without search parameters has correct defaults', () {
        const state = BlogsLoaded([]);
        
        expect(state.isSearchResult, isFalse);
        expect(state.searchQuery, isNull);
      });
    });
  });
}