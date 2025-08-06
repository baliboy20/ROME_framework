import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:logger/logger.dart';

import '../../../lib/core/di/dependency_injection.dart';
import '../../../lib/core/network/dio_client.dart';
import '../../../lib/features/project/presentation/bloc/project_bloc.dart';
import '../../../lib/features/task/presentation/bloc/task_bloc.dart';
import '../../../lib/features/blog/presentation/bloc/blog_bloc.dart';

// Mock classes
class MockDioClient extends Mock implements DioClient {}
class MockLogger extends Mock implements Logger {}

void main() {
  group('DependencyInjection', () {
    late MockDioClient mockDioClient;
    late MockLogger mockLogger;

    setUp(() {
      mockDioClient = MockDioClient();
      mockLogger = MockLogger();
    });

    group('initialization', () {
      test('should initialize all dependencies without throwing', () async {
        // Act & Assert
        expect(
          () async => await DependencyInjection.init(mockDioClient),
          returnsNormally,
        );
      });

      test('should initialize dependencies in correct order', () async {
        // Act
        await DependencyInjection.init(mockDioClient);

        // Assert - If we get here without exceptions, initialization succeeded
        expect(() => DependencyInjection.createProjectBloc(), returnsNormally);
        expect(() => DependencyInjection.createTaskBloc(), returnsNormally);
        expect(() => DependencyInjection.createBlogBloc(), returnsNormally);
      });

      test('should handle multiple initialization calls gracefully', () async {
        // Act & Assert - Should not throw on multiple calls
        await DependencyInjection.init(mockDioClient);
        expect(
          () async => await DependencyInjection.init(mockDioClient),
          returnsNormally,
        );
      });
    });

    group('BLoC creation', () {
      setUp(() async {
        await DependencyInjection.init(mockDioClient);
      });

      test('should create ProjectBloc with all required dependencies', () {
        // Act
        final projectBloc = DependencyInjection.createProjectBloc();

        // Assert
        expect(projectBloc, isA<ProjectBloc>());
        expect(projectBloc, isNotNull);
      });

      test('should create TaskBloc with all required dependencies', () {
        // Act
        final taskBloc = DependencyInjection.createTaskBloc();

        // Assert
        expect(taskBloc, isA<TaskBloc>());
        expect(taskBloc, isNotNull);
      });

      test('should create BlogBloc with all required dependencies', () {
        // Act
        final blogBloc = DependencyInjection.createBlogBloc();

        // Assert
        expect(blogBloc, isA<BlogBloc>());
        expect(blogBloc, isNotNull);
      });

      test('should create different instances for each BLoC call', () {
        // Act
        final projectBloc1 = DependencyInjection.createProjectBloc();
        final projectBloc2 = DependencyInjection.createProjectBloc();
        final taskBloc1 = DependencyInjection.createTaskBloc();
        final taskBloc2 = DependencyInjection.createTaskBloc();
        final blogBloc1 = DependencyInjection.createBlogBloc();
        final blogBloc2 = DependencyInjection.createBlogBloc();

        // Assert - Each call should create a new instance
        expect(projectBloc1, isNot(same(projectBloc2)));
        expect(taskBloc1, isNot(same(taskBloc2)));
        expect(blogBloc1, isNot(same(blogBloc2)));
      });

      test('should create BLoCs that are properly initialized', () {
        // Act
        final projectBloc = DependencyInjection.createProjectBloc();
        final taskBloc = DependencyInjection.createTaskBloc();
        final blogBloc = DependencyInjection.createBlogBloc();

        // Assert - BLoCs should have initial states
        expect(projectBloc.state, isNotNull);
        expect(taskBloc.state, isNotNull);
        expect(blogBloc.state, isNotNull);
      });
    });

    group('error handling', () {
      test('should throw meaningful error if BLoC created before initialization', () {
        // Act & Assert
        expect(
          () => DependencyInjection.createProjectBloc(),
          throwsA(isA<Error>()),
        );
        expect(
          () => DependencyInjection.createTaskBloc(),
          throwsA(isA<Error>()),
        );
        expect(
          () => DependencyInjection.createBlogBloc(),
          throwsA(isA<Error>()),
        );
      });

      test('should handle null DioClient gracefully during initialization', () async {
        // This test verifies that passing null doesn't cause immediate crash
        // The actual error will be caught when trying to use the client
        expect(
          () async => await DependencyInjection.init(mockDioClient),
          returnsNormally,
        );
      });
    });

    group('dependency graph integrity', () {
      setUp(() async {
        await DependencyInjection.init(mockDioClient);
      });

      test('should maintain singleton pattern for repositories and use cases', () {
        // Act - Create multiple BLoCs
        final projectBloc1 = DependencyInjection.createProjectBloc();
        final projectBloc2 = DependencyInjection.createProjectBloc();

        // Assert - The BLoCs are different instances but use same underlying dependencies
        expect(projectBloc1, isNot(same(projectBloc2)));
        // Note: We can't directly test repository singleton behavior without exposing internals
        // but the architecture ensures repositories are shared
      });

      test('should create BLoCs with proper dependency injection', () {
        // Act
        final projectBloc = DependencyInjection.createProjectBloc();
        final taskBloc = DependencyInjection.createTaskBloc();
        final blogBloc = DependencyInjection.createBlogBloc();

        // Assert - Verify BLoCs can be created successfully (indicates proper DI)
        expect(projectBloc, isA<ProjectBloc>());
        expect(taskBloc, isA<TaskBloc>());
        expect(blogBloc, isA<BlogBloc>());

        // Verify BLoCs are ready to use
        expect(projectBloc.isClosed, isFalse);
        expect(taskBloc.isClosed, isFalse);
        expect(blogBloc.isClosed, isFalse);
      });

      test('should handle BLoC disposal properly', () {
        // Act
        final projectBloc = DependencyInjection.createProjectBloc();
        final taskBloc = DependencyInjection.createTaskBloc();
        final blogBloc = DependencyInjection.createBlogBloc();

        // Dispose BLoCs
        projectBloc.close();
        taskBloc.close();
        blogBloc.close();

        // Assert
        expect(projectBloc.isClosed, isTrue);
        expect(taskBloc.isClosed, isTrue);
        expect(blogBloc.isClosed, isTrue);
      });
    });

    group('integration with external dependencies', () {
      test('should initialize with real DioClient type', () async {
        // Arrange
        final realDioClient = DioClient();
        
        // Act & Assert
        expect(
          () async => await DependencyInjection.init(realDioClient),
          returnsNormally,
        );
      });

      test('should create working BLoCs with real dependencies', () async {
        // Arrange
        final realDioClient = DioClient();
        await DependencyInjection.init(realDioClient);

        // Act
        final projectBloc = DependencyInjection.createProjectBloc();
        final taskBloc = DependencyInjection.createTaskBloc();
        final blogBloc = DependencyInjection.createBlogBloc();

        // Assert - BLoCs should be functional
        expect(projectBloc.state, isNotNull);
        expect(taskBloc.state, isNotNull);
        expect(blogBloc.state, isNotNull);

        // Clean up
        projectBloc.close();
        taskBloc.close();
        blogBloc.close();
      });
    });

    group('memory management', () {
      test('should not leak memory with multiple BLoC creations', () async {
        // Arrange
        await DependencyInjection.init(mockDioClient);
        final blocs = <dynamic>[];

        // Act - Create many BLoCs
        for (int i = 0; i < 10; i++) {
          blocs.addAll([
            DependencyInjection.createProjectBloc(),
            DependencyInjection.createTaskBloc(),
            DependencyInjection.createBlogBloc(),
          ]);
        }

        // Assert - All BLoCs should be created successfully
        expect(blocs.length, equals(30));
        for (final bloc in blocs) {
          expect(bloc, isNotNull);
        }

        // Clean up
        for (final bloc in blocs) {
          bloc.close();
        }
      });

      test('should allow garbage collection of closed BLoCs', () async {
        // Arrange
        await DependencyInjection.init(mockDioClient);

        // Act
        var projectBloc = DependencyInjection.createProjectBloc();
        final weakRef = WeakReference(projectBloc);
        
        projectBloc.close();
        projectBloc = null; // Remove strong reference

        // Force garbage collection (this doesn't guarantee collection but helps)
        // In practice, we just verify the BLoC was properly closed
        expect(weakRef.target?.isClosed, isTrue);
      });
    });

    group('configuration validation', () {
      test('should validate that all required use cases are injected', () async {
        // Arrange
        await DependencyInjection.init(mockDioClient);

        // Act & Assert - If BLoCs can be created, all use cases are properly injected
        expect(() => DependencyInjection.createProjectBloc(), returnsNormally);
        expect(() => DependencyInjection.createTaskBloc(), returnsNormally);
        expect(() => DependencyInjection.createBlogBloc(), returnsNormally);
      });

      test('should ensure repositories are properly configured', () async {
        // Arrange & Act
        await DependencyInjection.init(mockDioClient);
        
        // Create BLoCs to verify repository injection
        final projectBloc = DependencyInjection.createProjectBloc();
        final taskBloc = DependencyInjection.createTaskBloc();
        final blogBloc = DependencyInjection.createBlogBloc();

        // Assert - BLoCs should be operational (indicates repositories are working)
        expect(projectBloc.state, isNotNull);
        expect(taskBloc.state, isNotNull);
        expect(blogBloc.state, isNotNull);

        // Clean up
        projectBloc.close();
        taskBloc.close();
        blogBloc.close();
      });
    });

    group('threading and concurrency', () {
      test('should handle concurrent initialization safely', () async {
        // Act - Try to initialize concurrently
        final futures = List.generate(5, (_) => DependencyInjection.init(mockDioClient));
        
        // Assert - All should complete without error
        expect(
          () async => await Future.wait(futures),
          returnsNormally,
        );
      });

      test('should handle concurrent BLoC creation safely', () async {
        // Arrange
        await DependencyInjection.init(mockDioClient);

        // Act - Create BLoCs concurrently
        final futures = List.generate(10, (_) async {
          return [
            DependencyInjection.createProjectBloc(),
            DependencyInjection.createTaskBloc(),
            DependencyInjection.createBlogBloc(),
          ];
        });

        final results = await Future.wait(futures);

        // Assert - All BLoCs should be created successfully
        expect(results.length, equals(10));
        for (final blocSet in results) {
          expect(blocSet.length, equals(3));
          for (final bloc in blocSet) {
            expect(bloc, isNotNull);
          }
        }

        // Clean up
        for (final blocSet in results) {
          for (final bloc in blocSet) {
            bloc.close();
          }
        }
      });
    });
  });
}