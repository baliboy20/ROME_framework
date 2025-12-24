import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'presentation/screens/product_list_screen.dart';
import 'presentation/screens/product_detail_screen.dart';
import 'presentation/screens/user_list_screen.dart';
import 'presentation/screens/user_detail_screen.dart';

/// GoRouter configuration
final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),

    GoRoute(
      path: '/products',
      name: 'product_list',
      builder: (context, state) => const ProductListScreen(),
      routes: [
        GoRoute(
          path: ':id',
          name: 'product_detail',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return ProductDetailScreen(id: id);
          },
        ),
      ],
    ),

    GoRoute(
      path: '/users',
      name: 'user_list',
      builder: (context, state) => const UserListScreen(),
      routes: [
        GoRoute(
          path: ':id',
          name: 'user_detail',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return UserDetailScreen(id: id);
          },
        ),
      ],
    ),

  ],
  errorBuilder: (context, state) => ErrorScreen(
    error: state.error.toString(),
  ),
);

/// Home screen
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Products'),
            trailing: const Icon(Icons.arrow_forward),
            onTap: () => context.go('/products'),
          ),
          ListTile(
            title: const Text('Users'),
            trailing: const Icon(Icons.arrow_forward),
            onTap: () => context.go('/users'),
          ),
        ],
      ),
    );
  }
}

/// Error screen
class ErrorScreen extends StatelessWidget {
  final String error;

  const ErrorScreen({required this.error, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Error')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
