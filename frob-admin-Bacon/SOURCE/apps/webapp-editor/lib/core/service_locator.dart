import 'package:get_it/get_it.dart';

import 'api_client.dart';

final getIt = GetIt.instance;

/// Registers app-wide singletons. Called once from `main()`.
void setupServiceLocator({String baseUrl = 'https://api.friendsonbikes.uk'}) {
  if (!getIt.isRegistered<ApiClient>()) {
    getIt.registerSingleton<ApiClient>(ApiClient(baseUrl: baseUrl));
  }
}
