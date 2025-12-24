import 'package:get_it/get_it.dart';
import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';

import 'domain/repositories/product_repository.dart';
import 'data/repositories/product_repository_impl.dart';
import 'presentation/bloc/product/product_bloc.dart';
import 'domain/repositories/user_repository.dart';
import 'data/repositories/user_repository_impl.dart';
import 'presentation/bloc/user/user_bloc.dart';

/// Service locator instance
final sl = GetIt.instance;

/// Initialize dependency injection
Future<void> initializeDependencies() async {
  // Parse Server initialization
  await _initializeParse();

  // Register repositories
  sl.registerLazySingleton<ProductRepository>(
    () => ProductRepositoryImpl(),
  );

  sl.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(),
  );

  // Register BLoCs
  sl.registerFactory(
    () => ProductBloc(sl<ProductRepository>()),
  );

  sl.registerFactory(
    () => UserBloc(sl<UserRepository>()),
  );

}

/// Initialize Parse Server SDK
Future<void> _initializeParse() async {
  const keyApplicationId = 'YOUR_APP_ID';
  const keyClientKey = 'YOUR_CLIENT_KEY';
  const keyParseServerUrl = 'https://parseapi.back4app.com';

  await Parse().initialize(
    keyApplicationId,
    keyParseServerUrl,
    clientKey: keyClientKey,
    autoSendSessionId: true,
    debug: true,
  );
}
