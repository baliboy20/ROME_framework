import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'bloc/auth/auth_cubit.dart';
import 'bloc/content/content_cubit.dart';
import 'core/service_locator.dart';
import 'core/api_client.dart';
import 'router/app_router.dart';
import 'theme/forest_theme.dart';

class EditorApp extends StatelessWidget {
  const EditorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthCubit>(
          create: (_) => AuthCubit(getIt<ApiClient>()),
        ),
        BlocProvider<ContentCubit>(
          create: (context) => ContentCubit(
            getIt<ApiClient>(),
            context.read<AuthCubit>(),
          ),
        ),
      ],
      child: Builder(
        builder: (context) {
          final router = buildRouter(context.read<AuthCubit>());
          return MaterialApp.router(
            title: 'Friends on Bikes — Content editor',
            debugShowCheckedModeBanner: false,
            theme: ForestTheme.light,
            routerConfig: router,
          );
        },
      ),
    );
  }
}
