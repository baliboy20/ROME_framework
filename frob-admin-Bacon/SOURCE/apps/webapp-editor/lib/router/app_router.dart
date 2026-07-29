import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import '../bloc/auth/auth_cubit.dart';
import '../screens/content_edit_screen.dart';
import '../screens/content_list_screen.dart';
import '../screens/login_screen.dart';
import '../screens/quality_screen.dart';

GoRouter buildRouter(AuthCubit authCubit) {
  return GoRouter(
    initialLocation: '/content',
    refreshListenable: _AuthListenable(authCubit),
    redirect: (context, state) {
      final loggedIn = authCubit.state.isOwner;
      final onLogin = state.matchedLocation == '/login';
      if (!loggedIn && !onLogin) return '/login';
      if (loggedIn && onLogin) return '/content';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/content',
        builder: (context, state) => const ContentListScreen(),
      ),
      GoRoute(
        path: '/content/:id',
        builder: (context, state) => ContentEditScreen(
          contentId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(path: '/quality', builder: (context, state) => const QualityScreen()),
    ],
  );
}

/// Minimal adapter so go_router can refresh its redirect logic on every
/// `AuthCubit` emission, without pulling in an extra listenable package.
class _AuthListenable extends ChangeNotifier {
  late final StreamSubscription<AuthState> _subscription;

  _AuthListenable(AuthCubit cubit) {
    _subscription = cubit.stream.listen((_) => notifyListeners());
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
