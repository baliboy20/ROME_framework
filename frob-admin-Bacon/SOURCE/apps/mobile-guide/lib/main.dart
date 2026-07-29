import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import 'app.dart';
import 'services/api_client.dart';
import 'services/device_service.dart';
import 'services/storage_service.dart';
import 'state/tour_cubit.dart';

final getIt = GetIt.instance;

Future<void> bootstrap() async {
  final storage = await StorageService.open();
  final deviceService = DeviceService(storage.db);
  final sessionStore = SessionStore(storage.db);
  final apiClient = ApiClient(deviceService);
  final tourCubit = await TourCubit.restore(sessionStore, apiClient);

  getIt.registerSingleton<StorageService>(storage);
  getIt.registerSingleton<DeviceService>(deviceService);
  getIt.registerSingleton<ApiClient>(apiClient);
  getIt.registerSingleton<TourCubit>(tourCubit);
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrap();
  final deviceId = await getIt<DeviceService>().deviceId();
  runApp(FobGuideApp(tourCubit: getIt<TourCubit>(), deviceId: deviceId));
}
