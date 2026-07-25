import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_web_plugins/flutter_web_plugins.dart';

import 'application/admin/admin_payments_bloc.dart';
import 'application/payment/checkout_bloc.dart';
import 'application/payment/session_status_bloc.dart';
import 'core/env.dart';
import 'domain/admin/admin_repository.dart';
import 'domain/payment/payment_repository.dart';
import 'infrastructure/admin/admin_repository_impl.dart';
import 'infrastructure/payment/payment_repository_impl.dart';
import 'presentation/admin_payments_screen.dart';
import 'presentation/payment_screen.dart';
import 'presentation/return_screen.dart';

void main() {
  // Without this, Flutter Web uses hash-based URLs (e.g. `/#/return`), which does not match
  // Stripe's `return_url` of `http://host/return?session_id=...` (no hash) — the browser would
  // land on a path the app's router never sees. Path-based URLs are required for the post-payment
  // redirect to actually reach the return screen.
  usePathUrlStrategy();
  runApp(const FobStripePocApp());
}

class FobStripePocApp extends StatelessWidget {
  const FobStripePocApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<PaymentRepository>(
          create: (_) => PaymentRepositoryImpl(apiBaseUrl: Env.apiBaseUrl),
        ),
        RepositoryProvider<AdminRepository>(
          create: (_) => AdminRepositoryImpl(
            apiBaseUrl: Env.apiBaseUrl,
            adminApiKey: Env.adminApiKey,
          ),
        ),
      ],
      child: MaterialApp(
        title: 'FOB — Stripe Embedded Checkout POC',
        theme: ThemeData(colorSchemeSeed: Colors.teal, useMaterial3: true),
        // No `initialRoute` here: with `usePathUrlStrategy()` above, omitting it lets Flutter
        // Web derive the first route from the actual browser URL (path + query string) at boot,
        // e.g. `/return?session_id=...` on Stripe's post-payment redirect. A hardcoded
        // `initialRoute: '/'` would silently discard that and always reboot to the payment
        // screen regardless of what URL the browser actually landed on.
        onGenerateRoute: _onGenerateRoute,
      ),
    );
  }

  /// Minimal hand-rolled router (no routing package needed for this POC).
  ///
  /// - `/` -> payment screen, with a fresh [CheckoutBloc].
  /// - `/return` -> return screen, reading `session_id` from the URL query
  ///   string and driving a fresh [SessionStatusBloc].
  Route<void> _onGenerateRoute(RouteSettings settings) {
    final uri = Uri.parse(settings.name ?? '/');

    if (uri.path == '/admin') {
      return MaterialPageRoute(
        settings: settings,
        builder: (context) => BlocProvider(
          create: (context) =>
              AdminPaymentsBloc(repository: context.read<AdminRepository>())
                ..add(const AdminPaymentsLoadRequested()),
          child: const AdminPaymentsScreen(),
        ),
      );
    }

    if (uri.path == '/return') {
      return MaterialPageRoute(
        settings: settings,
        builder: (context) => BlocProvider(
          create: (context) => SessionStatusBloc(
            repository: context.read<PaymentRepository>(),
          ),
          child: ReturnScreen(sessionId: uri.queryParameters['session_id']),
        ),
      );
    }

    return MaterialPageRoute(
      settings: settings,
      builder: (context) => BlocProvider(
        create: (context) =>
            CheckoutBloc(repository: context.read<PaymentRepository>()),
        child: const PaymentScreen(),
      ),
    );
  }
}
