import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/tokens.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/pages/sign_in_page.dart';
import '../features/bookings/presentation/pages/bookings_detail_page.dart';
import '../features/bookings/presentation/pages/bookings_master_page.dart';
import '../features/bookings/presentation/pages/edit_booking_page.dart';
import '../features/bookings/presentation/pages/new_booking_page.dart';
import '../features/comms/presentation/pages/alerts_page.dart';
import '../features/comms/presentation/pages/audit_page.dart';
import '../features/comms/presentation/pages/deliverability_page.dart';
import '../features/comms/presentation/pages/publish_page.dart';
import '../features/enquiries/presentation/pages/enquiries_page.dart';
import '../features/fleet/presentation/pages/add_bike_page.dart';
import '../features/fleet/presentation/pages/bike_allocation_page.dart';
import '../features/fleet/presentation/pages/bikes_page.dart';
import '../features/fleet/presentation/pages/compliance_page.dart';
import '../features/fleet/presentation/pages/equipment_page.dart';
import '../features/fleet/presentation/pages/flagged_bike_page.dart';
import '../features/fleet/presentation/pages/fleet_readiness_page.dart';
import '../features/payments/presentation/pages/payments_page.dart';
import '../features/safety/presentation/pages/hazards_page.dart';
import '../features/safety/presentation/pages/incidents_page.dart';
import '../features/scheduling/presentation/pages/calendar_page.dart';
import '../features/scheduling/presentation/pages/scheduler_page.dart';
import '../features/scheduling/presentation/pages/tours_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../features/email/presentation/pages/email_archive_page.dart';
import '../features/email/presentation/pages/email_templates_page.dart';
import '../features/email/presentation/pages/emails_console_page.dart';
import '../screens/admin_shell.dart';

/// Bridges a Bloc's state stream to a [Listenable] so GoRouter re-runs its
/// redirect whenever auth changes (sign-in / sign-out / expiry).
class _BlocRefresh extends ChangeNotifier {
  late final StreamSubscription<dynamic> _sub;
  _BlocRefresh(Stream<dynamic> stream) {
    notifyListeners();
    _sub = stream.asBroadcastStream().listen((_) => notifyListeners());
  }
  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

/// CHG-014 (refines CHG-013, UXD-18 / UXC-NAV-3): fast fade-OUT of the
/// outgoing page + short fade-IN of the incoming one. The outgoing page's
/// opacity runs 1→0 over only the first half of the 120ms secondary curve
/// (Interval 0.0–0.5 ≈ 60ms), so the leaving page vanishes almost immediately
/// and the two pages barely overlap — no lingering cross-blend wobble.
/// Honours the platform "reduce motion" setting.
CustomTransitionPage<void> _animatedPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 120),
    reverseTransitionDuration: const Duration(milliseconds: 100),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return child;

      final fadeIn = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      // When this page is the one being covered, `secondaryAnimation` runs
      // 0→1; front-loading it into the first 50% (~60ms of the incoming
      // page's 120ms window) drives this page's opacity 1→0 fast.
      final fadeOut = CurvedAnimation(
        parent: secondaryAnimation,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      );

      // FadeTransition over a RepaintBoundary composites the fade as a GPU
      // opacity layer — no per-frame offscreen raster; a no-op once settled.
      return FadeTransition(
        opacity: fadeIn,
        child: FadeTransition(
          opacity: ReverseAnimation(fadeOut),
          child: RepaintBoundary(child: child),
        ),
      );
    },
  );
}

/// Each route owns its scroll viewport and max-width frame, so the ShellRoute
/// Navigator lays out with bounded height (no unbounded-height Navigator/Overlay)
/// and pages become independently scrollable.
Widget _pageScaffold(Widget page) => SingleChildScrollView(
      padding: const EdgeInsets.all(FobSpace.gutter),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1160),
          // CHG-013: the real page mounts immediately (skeleton-first deferral
          // removed) — the transition is short enough not to need a placeholder.
          child: page,
        ),
      ),
    );

GoRoute _shellRoute(String path, Widget page) => GoRoute(
      path: path,
      pageBuilder: (context, state) => _animatedPage(state, _pageScaffold(page)),
    );

/// Like [_shellRoute] but builds the page from the route's path parameters
/// (e.g. the booking `:id` in `/bookings/:id`).
GoRoute _shellParamRoute(String path, Widget Function(GoRouterState state) builder) => GoRoute(
      path: path,
      pageBuilder: (context, state) => _animatedPage(state, _pageScaffold(builder(state))),
    );

/// The app router. Pass the app-wide [AuthBloc] so the redirect can gate the
/// shell without reaching into the widget tree.
GoRouter createRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/calendar',
    refreshListenable: _BlocRefresh(authBloc.stream),
    redirect: (context, state) {
      final signedIn = authBloc.state is AuthSignedIn;
      final atSignIn = state.matchedLocation == '/signin';
      if (!signedIn) return atSignIn ? null : '/signin';
      if (atSignIn) return '/calendar';
      return null;
    },
    routes: [
      GoRoute(
        path: '/signin',
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          key: state.pageKey,
          transitionDuration: const Duration(milliseconds: 220),
          child: const SignInPage(),
          transitionsBuilder: (context, animation, secondary, child) => FadeTransition(opacity: animation, child: child),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => AdminShell(location: state.matchedLocation, child: child),
        routes: [
          _shellRoute('/new-booking', const NewBookingPage()),
          _shellRoute('/payments', const PaymentsPage()),
          _shellRoute('/enquiries', const EnquiriesPage()),
          _shellRoute('/bookings', const BookingsMasterPage()),
          _shellParamRoute('/bookings/:id', (state) => BookingsDetailPage(bookingId: state.pathParameters['id']!)),
          _shellParamRoute('/bookings/:id/edit', (state) => EditBookingPage(bookingId: state.pathParameters['id']!)),
          _shellRoute('/tours', const ToursPage()),
          _shellRoute('/calendar', const CalendarPage()),
          _shellRoute('/scheduler', const SchedulerPage()),
          _shellRoute('/bike-allocation', const BikeAllocationPage()),
          _shellRoute('/alerts', const AlertsPage()),
          _shellRoute('/deliverability', const DeliverabilityPage()),
          _shellRoute('/audit', const AuditPage()),
          _shellRoute('/publish', const PublishPage()),
          _shellRoute('/incidents', const IncidentsPage()),
          _shellRoute('/hazards', const HazardsPage()),
          _shellRoute('/fleet-readiness', const FleetReadinessPage()),
          _shellRoute('/bikes', const BikesPage()),
          _shellRoute('/add-bike', const AddBikePage()),
          _shellRoute('/equipment', const EquipmentPage()),
          _shellRoute('/flagged-bike', const FlaggedBikePage()),
          _shellRoute('/compliance', const CompliancePage()),
          _shellRoute('/settings', const SettingsPage()),
          _shellRoute('/emails-console', const EmailsConsolePage()),
          _shellRoute('/email-archive', const EmailArchivePage()),
          _shellRoute('/email-templates', const EmailTemplatesPage()),
        ],
      ),
    ],
  );
}
