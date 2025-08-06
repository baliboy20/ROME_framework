import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:logger/logger.dart';

import 'core/di/dependency_injection.dart';
import 'core/di/service_locator.dart';
import 'core/network/dio_client.dart';
import 'core/services/app_logger.dart';
import 'core/theme/app_theme.dart';
import 'features/project/presentation/pages/home_page.dart';

/// Global dependencies
late final Logger logger;
late final DioClient dioClient;
late final AppLogger appLogger;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize enhanced logging
  appLogger = AppLogger.instance;
  
  // Initialize legacy logger for compatibility
  logger = Logger(
    printer: PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 50,
      colors: true,
      printEmojis: true,
    ),
  );
  
  dioClient = DioClient();
  await dioClient.initialize();
  
  // Initialize dependency injection
  await DependencyInjection.init(dioClient);
  
  // Initialize service locator
  await initServiceLocator(dioClient);
  
  appLogger.info('Application started successfully');
  
  runApp(const ProjectManagementApp());
}

class ProjectManagementApp extends StatelessWidget {
  const ProjectManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => DependencyInjection.createProjectBloc()),
        BlocProvider(create: (_) => DependencyInjection.createTaskBloc()),
        BlocProvider(create: (_) => DependencyInjection.createBlogBloc()),
      ],
      child: MacosApp(
        title: 'Project Management',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const HomePage(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
