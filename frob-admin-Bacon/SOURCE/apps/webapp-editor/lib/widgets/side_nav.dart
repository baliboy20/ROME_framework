import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/forest_theme.dart';

/// [SPA] Editor side nav — fixed left rail, wide-screen only
/// (design-system.md §5.4). Active item gets forest-50 background +
/// forest-700 left border accent.
class SideNav extends StatelessWidget {
  final String currentRoute;

  const SideNav({super.key, required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      color: ForestTokens.paper,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.all(ForestTokens.space6),
            child: Text('Friends on Bikes',
                style: TextStyle(
                    fontFamily: 'Syne',
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: ForestTokens.charcoal)),
          ),
          _NavItem(
            label: 'Tour content',
            route: '/content',
            active: currentRoute.startsWith('/content'),
          ),
          _NavItem(
            label: 'Sitemap & quality',
            route: '/quality',
            active: currentRoute.startsWith('/quality'),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final String label;
  final String route;
  final bool active;

  const _NavItem({required this.label, required this.route, required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: active ? ForestTokens.forest50 : Colors.transparent,
        border: Border(
          left: BorderSide(
            color: active ? ForestTokens.forest700 : Colors.transparent,
            width: 3,
          ),
        ),
      ),
      child: ListTile(
        title: Text(label,
            style: TextStyle(
                color: active ? ForestTokens.forest700 : ForestTokens.charcoal,
                fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
        onTap: () => context.go(route),
      ),
    );
  }
}
