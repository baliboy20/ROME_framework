import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'api/api_client.dart';
import 'bloc/auth_cubit.dart';
import 'screens/shell_screen.dart';
import 'screens/sign_in_screen.dart';
import 'theme/tokens.dart';

void main() {
  runApp(const FobAdminApp());
}

/// webapp-admin — FOB back-office console (A1–A20). Satisfies TDR-13.
class FobAdminApp extends StatelessWidget {
  const FobAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return RepositoryProvider<ApiClient>(
      create: (_) => ApiClient(),
      child: BlocProvider<AuthCubit>(
        create: (ctx) => AuthCubit(ctx.read<ApiClient>()),
        child: MaterialApp(
          title: 'FOB Booking Admin',
          debugShowCheckedModeBanner: false,
          theme: buildFobTheme(),
          home: const _RootGate(),
        ),
      ),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        if (state.status == AuthStatus.signedIn) {
          return const ShellScreen();
        }
        return const SignInScreen();
      },
    );
  }
}
