import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../theme/tokens.dart';
import '../widgets/command_palette.dart';
import '../widgets/tree_nav.dart';

const kNavGroups = [
  NavGroup('Bookings & payments', [
    NavLeaf('A7', 'New booking', '/new-booking'),
    NavLeaf('A8', 'Payments', '/payments'),
    NavLeaf('A9', 'Enquiries', '/enquiries'),
    NavLeaf('A19', 'Bookings', '/bookings'),
  ], hue: FobColors.pink),
  NavGroup('Tours and departures', [
    NavLeaf('A22', 'Tours & routes', '/tours'),
    NavLeaf('A17', 'Departure calendar', '/calendar'),
    NavLeaf('A18', 'Departure scheduler', '/scheduler'),
    NavLeaf('A20', 'Bike allocation', '/bike-allocation'),
  ], hue: FobColors.cyan),
  NavGroup('Alerts & records', [
    NavLeaf('A4', 'Owner alerts', '/alerts'),
    NavLeaf('A3', 'Deliverability', '/deliverability'),
    NavLeaf('A5', 'Audit log', '/audit'),
  ], hue: FobColors.orange),
  NavGroup('Email', [
    NavLeaf('A5d', 'Emails', '/emails-console'),
    NavLeaf('A5b', 'Email archive', '/email-archive'),
    NavLeaf('A5c', 'Templates', '/email-templates'),
  ], hue: FobColors.pink),
  NavGroup('Content', [
    NavLeaf('A6', 'Publish & content', '/publish'),
  ], hue: FobColors.cyan),
  NavGroup('Safety', [
    NavLeaf('A10', 'Incidents', '/incidents'),
    NavLeaf('A11', 'Hazard log', '/hazards'),
  ], hue: FobColors.orange),
  NavGroup('Fleet & equipment', [
    NavLeaf('A14', 'Fleet readiness', '/fleet-readiness'),
    NavLeaf('A21', 'Bikes', '/bikes'),
    NavLeaf('A12', 'Add bike', '/add-bike'),
    NavLeaf('A13', 'Equipment', '/equipment'),
    NavLeaf('A15', 'Flagged bike', '/flagged-bike'),
    NavLeaf('A16', 'Compliance', '/compliance'),
  ], hue: FobColors.lime),
  NavGroup('System', [
    NavLeaf('A6b', 'Settings', '/settings'),
  ], hue: FobColors.cyan),
];

/// Console shell — persistent TreeNav + top bar wrapping the animated content
/// region (UXC-NAV-3, UXD-18). Navigation is driven by go_router; [child] is
/// the current route's page and [location] its matched path.
class AdminShell extends StatelessWidget {
  final Widget child;
  final String location;
  const AdminShell({super.key, required this.child, required this.location});

  @override
  Widget build(BuildContext context) {
    // Cmd-K anywhere in the shell. Registered here rather than on the icon so
    // it works regardless of what currently holds focus.
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): () =>
            showCommandPalette(context),
      },
      child: Focus(autofocus: true, child: _buildShell(context)),
    );
  }

  Widget _buildShell(BuildContext context) {
    return Scaffold(
      backgroundColor: FobColors.surfaceBg,
      body: Row(
        children: [
          TreeNav(
            groups: kNavGroups,
            activeRoute: location,
            onSelect: (r) => context.go(r),
          ),
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(horizontal: FobSpace.card),
                  decoration: const BoxDecoration(
                    color: FobColors.surfaceCard,
                    border: Border(bottom: BorderSide(color: FobColors.hairline)),
                  ),
                  child: Row(
                    children: [
                      Text(location.replaceFirst('/', '').toUpperCase(), style: FobText.microLabel),
                      const Spacer(),
                      // FR-001 workstream 4 — quick navigation. Cmd-K is the
                      // macOS convention (DEV-5) and does not collide with a
                      // system or menu-bar shortcut.
                      IconButton(
                        key: const Key('palette-open'),
                        tooltip: 'Go to…  (⌘K)',
                        icon: const Icon(Icons.search, size: 18, color: FobColors.textMuted),
                        onPressed: () => showCommandPalette(context),
                      ),
                      const SizedBox(width: 4),
                      const Text('William · Owner', style: FobText.body),
                      const SizedBox(width: 12),
                      TextButton(
                        key: const Key('signout-button'),
                        onPressed: () => context.read<AuthBloc>().add(const SignOutRequested()),
                        child: const Text('Sign out'),
                      ),
                    ],
                  ),
                ),
                // Bounded content region. Each route provides its own scroll
                // viewport (see app_router) so the ShellRoute Navigator is never
                // given unbounded height.
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
