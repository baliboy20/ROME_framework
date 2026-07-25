import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/pages/sign_in_page.dart';
import 'injection_container.dart';
import 'screens/shell_screen.dart';
import 'theme/tokens.dart';

void main() {
  configureDependencies();
  runApp(const FobAdminApp());
}

/// webapp-admin — FOB back-office console (A1–A22). Satisfies TDR-13.
class FobAdminApp extends StatelessWidget {
  const FobAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>(
      create: (_) => sl<AuthBloc>(),
      child: MaterialApp(
        title: 'FOB Booking Admin',
        debugShowCheckedModeBanner: false,
        theme: buildFobTheme(),
        home: const _RootGate(),
      ),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is AuthSignedIn) return const ShellScreen();
        return const SignInPage();
      },
    );
  }
}
