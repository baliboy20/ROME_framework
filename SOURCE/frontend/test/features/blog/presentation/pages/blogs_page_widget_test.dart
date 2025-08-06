import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../../../lib/core/errors/failures.dart';
import '../../../../../lib/features/blog/domain/entities/blog.dart';
import '../../../../../lib/features/blog/domain/usecases/create_blog.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_bloc.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_event.dart';
import '../../../../../lib/features/blog/presentation/bloc/blog_state.dart';
import '../../../../../lib/features/blog/presentation/pages/blogs_page.dart';

// Mock classes
class MockBlogBloc extends MockBloc<BlogEvent, BlogState> implements BlogBloc {}

void main() {
  group('BlogsPage Widget Tests', () {
    late MockBlogBloc mockBlogBloc;

    // Test data
    final testBlogs = [
      Blog(
        id: '1',
        title: 'Test Blog 1',
        content: 'This is the content for test blog 1. It contains some meaningful text to test the display functionality.',
        status: BlogStatus.published,
        createdAt: DateTime(2025, 1, 1),
        updatedAt: DateTime(2025, 1, 1),
        tags: ['test', 'important'],
      ),
      Blog(
        id: '2',
        title: 'Test Blog 2',
        content: 'This is a much longer content for test blog 2. This content is designed to be more than 200 characters long so that we can test the truncation functionality in the blog card display. It should show only the first 200 characters followed by ellipsis.',
        status: BlogStatus.draft,
        createdAt: DateTime(2025, 1, 2),
        updatedAt: DateTime(2025, 1, 2),
        tags: ['draft', 'work-in-progress'],
      ),
      Blog(
        id: '3',
        title: 'Test Blog 3',
        content: 'Short content for blog 3.',
        status: BlogStatus.published,
        createdAt: DateTime(2025, 1, 3),
        updatedAt: DateTime(2025, 1, 3),
        tags: [],
      ),
    ];

    setUp(() {
      mockBlogBloc = MockBlogBloc();
      when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
    });

    Widget createTestWidget() {
      return MacosApp(
        home: BlocProvider<BlogBloc>.value(
          value: mockBlogBloc,
          child: const BlogsPage(),
        ),
      );
    }

    group('Initial Load', () {
      testWidgets('should dispatch LoadBlogs event on init', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogLoading());

        // Act
        await tester.pumpWidget(createTestWidget());

        // Assert
        verify(() => mockBlogBloc.add(const LoadBlogs())).called(1);
      });

      testWidgets('should show loading indicator when BlogLoading state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogLoading());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogLoading()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(ProgressCircle), findsOneWidget);
      });
    });

    group('Empty State', () {
      testWidgets('should show empty state when no blog entries', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogsLoaded([], false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogsLoaded([], false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('No Journal Entries Yet'), findsOneWidget);
        expect(find.text('Start documenting your thoughts and progress'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.book), findsOneWidget);
        expect(find.text('New Entry'), findsOneWidget);
      });

      testWidgets('should show create blog dialog when tapping New Entry button in empty state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogsLoaded([], false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogsLoaded([], false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('New Entry'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('New Journal Entry'), findsOneWidget);
        expect(find.byType(CreateBlogDialog), findsOneWidget);
      });

      testWidgets('should show search empty state when no search results', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogsLoaded([], true));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogsLoaded([], true)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Simulate search by entering text
        await tester.enterText(find.byType(MacosSearchField), 'nonexistent');
        await tester.pump();

        // Assert
        expect(find.text('No Matching Entries'), findsOneWidget);
        expect(find.text('Try adjusting your search terms'), findsOneWidget);
      });
    });

    group('Blogs List', () {
      testWidgets('should display blogs list when BlogsLoaded state with blogs', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('3 entries'), findsOneWidget);
        expect(find.text('Test Blog 1'), findsOneWidget);
        expect(find.text('Test Blog 2'), findsOneWidget);
        expect(find.text('Test Blog 3'), findsOneWidget);
      });

      testWidgets('should display blog content with truncation for long content', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('This is the content for test blog 1'), findsOneWidget);
        expect(find.textContaining('This is a much longer content'), findsOneWidget);
        expect(find.textContaining('...'), findsOneWidget); // Truncation indicator
        expect(find.text('Short content for blog 3.'), findsOneWidget);
      });

      testWidgets('should display tags for blogs that have them', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('test'), findsOneWidget);
        expect(find.text('important'), findsOneWidget);
        expect(find.text('draft'), findsOneWidget);
        expect(find.text('work-in-progress'), findsOneWidget);
        // Blog 3 has no tags, so we don't expect to find them
      });

      testWidgets('should display view, edit and delete buttons for each blog', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byIcon(CupertinoIcons.eye), findsNWidgets(3));
        expect(find.byIcon(CupertinoIcons.pencil), findsNWidgets(3));
        expect(find.byIcon(CupertinoIcons.trash), findsNWidgets(3));
      });

      testWidgets('should show relative date formatting for blog entries', (tester) async {
        // Arrange
        final recentBlog = [Blog(
          id: '1',
          title: 'Recent Blog',
          content: 'Recent content',
          status: BlogStatus.published,
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          updatedAt: DateTime.now(),
          tags: [],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(recentBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(recentBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('hours ago'), findsAtLeastNWidgets(1));
      });
    });

    group('Search Bar', () {
      testWidgets('should display search field and entry count', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.byType(MacosSearchField), findsOneWidget);
        expect(find.text('3 entries'), findsOneWidget);
      });

      testWidgets('should trigger search when text is entered', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.enterText(find.byType(MacosSearchField), 'test query');
        await tester.pump();

        // Assert
        verify(() => mockBlogBloc.add(const SearchBlogsEvent('test query'))).called(1);
      });

      testWidgets('should load all blogs when search is cleared', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Enter search text
        await tester.enterText(find.byType(MacosSearchField), 'test');
        await tester.pump();

        // Clear search
        await tester.enterText(find.byType(MacosSearchField), '');
        await tester.pump();

        // Assert
        verify(() => mockBlogBloc.add(const LoadBlogs())).called(atLeast(1));
      });

      testWidgets('should show search results count when searching', (tester) async {
        // Arrange
        final searchResults = [testBlogs.first];
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(searchResults, true));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(searchResults, true)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Simulate search
        await tester.enterText(find.byType(MacosSearchField), 'test');
        await tester.pump();

        // Assert
        expect(find.textContaining('1 results for "test"'), findsOneWidget);
      });
    });

    group('Toolbar', () {
      testWidgets('should display Journal title in toolbar', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Journal'), findsOneWidget);
      });

      testWidgets('should show New Entry button in toolbar', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('New Entry'), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.plus), findsOneWidget);
      });

      testWidgets('should show create blog dialog when tapping New Entry button', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogInitial()));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.text('New Entry'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('New Journal Entry'), findsOneWidget);
        expect(find.byType(CreateBlogDialog), findsOneWidget);
      });
    });

    group('Error State', () {
      testWidgets('should display error state when BlogError', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load blog entries';
        when(() => mockBlogBloc.state).thenReturn(const BlogError(ServerFailure(errorMessage)));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('Error Loading Journal Entries'), findsOneWidget);
        expect(find.text(errorMessage), findsOneWidget);
        expect(find.byIcon(CupertinoIcons.exclamationmark_triangle), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
      });

      testWidgets('should dispatch LoadBlogs when tapping Retry button', (tester) async {
        // Arrange
        const errorMessage = 'Failed to load blog entries';
        when(() => mockBlogBloc.state).thenReturn(const BlogError(ServerFailure(errorMessage)));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(const BlogError(ServerFailure(errorMessage))));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockBlogBloc);

        await tester.tap(find.text('Retry'));
        await tester.pump();

        // Assert
        verify(() => mockBlogBloc.add(const LoadBlogs())).called(1);
      });
    });

    group('Blog Actions', () {
      testWidgets('should show view dialog when tapping view button', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.eye).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.byType(ViewBlogDialog), findsOneWidget);
        expect(find.text('Test Blog 1'), findsAtLeastNWidgets(1)); // Title in dialog
      });

      testWidgets('should show edit dialog when tapping edit button', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.pencil).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Edit Journal Entry'), findsOneWidget);
        expect(find.byType(EditBlogDialog), findsOneWidget);
      });

      testWidgets('should show delete confirmation dialog when tapping delete button', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Entry'), findsOneWidget);
        expect(find.textContaining('Are you sure you want to delete'), findsOneWidget);
        expect(find.text('Delete'), findsOneWidget);
        expect(find.text('Cancel'), findsOneWidget);
      });

      testWidgets('should dispatch DeleteBlogEvent when confirming delete', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Clear previous calls
        clearInteractions(mockBlogBloc);

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete'));
        await tester.pump();

        // Assert
        verify(() => mockBlogBloc.add(DeleteBlogEvent(testBlogs.first.id))).called(1);
      });

      testWidgets('should close delete dialog when tapping Cancel', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(testBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(testBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        await tester.tap(find.byIcon(CupertinoIcons.trash).first);
        await tester.pumpAndSettle();

        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Delete Entry'), findsNothing);
        verifyNever(() => mockBlogBloc.add(any()));
      });
    });

    group('BLoC Listener', () {
      testWidgets('should show error dialog when BlogError state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const BlogError(ServerFailure('Error message')),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Error'), findsOneWidget);
        expect(find.text('Error message'), findsOneWidget);
      });

      testWidgets('should show success dialog when BlogCreated state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.fromIterable([
          BlogCreated(testBlogs.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Blog entry created successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when BlogUpdated state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.fromIterable([
          BlogUpdated(testBlogs.first),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Blog entry updated successfully'), findsOneWidget);
      });

      testWidgets('should show success dialog when BlogDeleted state', (tester) async {
        // Arrange
        when(() => mockBlogBloc.state).thenReturn(const BlogInitial());
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.fromIterable([
          const BlogDeleted('blog-1'),
        ]));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Success'), findsOneWidget);
        expect(find.text('Blog entry deleted successfully'), findsOneWidget);
      });
    });

    group('Edge Cases', () {
      testWidgets('should handle single blog entry correctly', (tester) async {
        // Arrange
        final singleBlog = [testBlogs.first];
        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(singleBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(singleBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('1 entries'), findsOneWidget);
        expect(find.text('Test Blog 1'), findsOneWidget);
      });

      testWidgets('should handle blogs with very long titles', (tester) async {
        // Arrange
        final longTitleBlog = [Blog(
          id: '1',
          title: 'Very Long Blog Title That Should Be Displayed Correctly Even When It Exceeds Normal Length Expectations',
          content: 'Regular content',
          status: BlogStatus.published,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: [],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(longTitleBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(longTitleBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Very Long Blog Title'), findsOneWidget);
      });

      testWidgets('should handle blogs with special characters', (tester) async {
        // Arrange
        final specialCharBlog = [Blog(
          id: '1',
          title: 'Blog with émöjis 🚀 & spéciál chars',
          content: 'Content with @#\$%^&*()[]{}|\\',
          status: BlogStatus.published,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: ['spéciál', 'émöjis🚀'],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(specialCharBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(specialCharBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('Blog with émöjis 🚀'), findsOneWidget);
        expect(find.textContaining('Content with @#\$%^&*()[]{}|\\'), findsOneWidget);
        expect(find.text('spéciál'), findsOneWidget);
        expect(find.text('émöjis🚀'), findsOneWidget);
      });

      testWidgets('should handle blogs with many tags', (tester) async {
        // Arrange
        final manyTagsBlog = [Blog(
          id: '1',
          title: 'Blog with Many Tags',
          content: 'Content',
          status: BlogStatus.published,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8'],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(manyTagsBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(manyTagsBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        for (int i = 1; i <= 8; i++) {
          expect(find.text('tag$i'), findsOneWidget);
        }
      });
    });

    group('Scrolling Behavior', () {
      testWidgets('should be scrollable when many blog entries are present', (tester) async {
        // Arrange
        final manyBlogs = List.generate(20, (index) => Blog(
          id: 'blog-$index',
          title: 'Blog Entry $index',
          content: 'Content for blog entry $index',
          status: BlogStatus.values[index % BlogStatus.values.length],
          createdAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          updatedAt: DateTime(2025, 1, 1).add(Duration(days: index)),
          tags: ['tag$index'],
        ));

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(manyBlogs, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(manyBlogs, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('20 entries'), findsOneWidget);
        expect(find.byType(ListView), findsOneWidget);
        
        // Verify scrolling works
        expect(find.text('Blog Entry 0'), findsOneWidget);
        await tester.scrollUntilVisible(find.text('Blog Entry 19'), 500);
        expect(find.text('Blog Entry 19'), findsOneWidget);
      });
    });

    group('Content Truncation', () {
      testWidgets('should show full content when under 200 characters', (tester) async {
        // Arrange
        final shortContentBlog = [Blog(
          id: '1',
          title: 'Short Content Blog',
          content: 'This content is short and should be displayed in full.',
          status: BlogStatus.published,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: [],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(shortContentBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(shortContentBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.text('This content is short and should be displayed in full.'), findsOneWidget);
        expect(find.textContaining('...'), findsNothing);
      });

      testWidgets('should truncate content when over 200 characters', (tester) async {
        // Arrange
        final longContent = 'a' * 250; // 250 characters
        final longContentBlog = [Blog(
          id: '1',
          title: 'Long Content Blog',
          content: longContent,
          status: BlogStatus.published,
          createdAt: DateTime(2025, 1, 1),
          updatedAt: DateTime(2025, 1, 1),
          tags: [],
        )];

        when(() => mockBlogBloc.state).thenReturn(BlogsLoaded(longContentBlog, false));
        when(() => mockBlogBloc.stream).thenAnswer((_) => Stream.value(BlogsLoaded(longContentBlog, false)));

        // Act
        await tester.pumpWidget(createTestWidget());
        await tester.pump();

        // Assert
        expect(find.textContaining('...'), findsOneWidget);
        // Should show exactly 200 characters plus ellipsis
        expect(find.textContaining('a' * 200), findsOneWidget);
      });
    });
  });
}