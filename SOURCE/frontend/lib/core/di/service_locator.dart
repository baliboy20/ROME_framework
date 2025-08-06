import 'package:get_it/get_it.dart';

import '../../features/project/data/repositories/project_selection_repository_impl.dart';
import '../../features/project/domain/repositories/project_selection_repository.dart';
import '../network/dio_client.dart';

/// Global service locator instance
final sl = GetIt.instance;

/// Initialize the service locator with dependencies
Future<void> initServiceLocator(DioClient dioClient) async {
  // Register ProjectSelectionRepository
  sl.registerLazySingleton<ProjectSelectionRepository>(
    () => ProjectSelectionRepositoryImpl(dioClient),
  );
}