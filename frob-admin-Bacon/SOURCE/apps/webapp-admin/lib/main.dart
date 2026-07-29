import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'injection_container.dart';
import 'router/app_router.dart';
import 'theme/tokens.dart';

void main() {
  configureDependencies();
  runApp(const FobAdminApp());
}

/// webapp-admin — FOB back-office console (A1–A22). Satisfies TDR-13.
class FobAdminApp extends StatefulWidget {
  const FobAdminApp({super.key});

  @override
  State<FobAdminApp> createState() => _FobAdminAppState();
}

class _FobAdminAppState extends State<FobAdminApp> {
  // One AuthBloc instance drives both the router redirect and the widget tree.
  final AuthBloc _authBloc = sl<AuthBloc>();
  late final GoRouter _router = createRouter(_authBloc);

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: _authBloc,
      child: MaterialApp.router(
        title: 'FOB Booking Admin',
        debugShowCheckedModeBanner: false,
        theme: buildFobTheme(),
        routerConfig: _router,
      ),
    );
  }
}
