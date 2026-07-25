import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/tokens.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';
import '../features/auth/presentation/pages/sign_in_page.dart';
import '../features/bookings/presentation/pages/booking_browser_page.dart';
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

/// Shared-axis horizontal push for content-region page changes. The incoming
/// page is opaque and slides in from the right, cleanly covering whatever is
/// behind it (no see-through overlap / collision); the outgoing page slides
/// left and fades away underneath. Honours the platform "reduce motion" setting.
CustomTransitionPage<void> _animatedPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 300),
    reverseTransitionDuration: const Duration(milliseconds: 260),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return child;

      // Incoming: enters from the right, decelerating; stays fully opaque.
      final slideIn = Tween<Offset>(begin: const Offset(0.12, 0), end: Offset.zero)
          .animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
      // Outgoing (covered): drifts left and fades out beneath the incoming page.
      final slideOut = Tween<Offset>(begin: Offset.zero, end: const Offset(-0.06, 0))
          .animate(CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeInCubic));
      final fadeOut = Tween<double>(begin: 1.0, end: 0.0)
          .animate(CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeIn));

      return SlideTransition(
        position: slideOut,
        child: FadeTransition(
          opacity: fadeOut,
          child: SlideTransition(
            position: slideIn,
            // Opaque background so the incoming page fully occludes the outgoing
            // one as it slides — the two are never blended together.
            child: ColoredBox(
              color: FobColors.surfaceBg,
              child: RepaintBoundary(child: child),
            ),
          ),
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
          child: page,
        ),
      ),
    );

GoRoute _shellRoute(String path, Widget page) => GoRoute(
      path: path,
      pageBuilder: (context, state) => _animatedPage(state, _pageScaffold(page)),
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
          _shellRoute('/booking-browser', const BookingBrowserPage()),
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
        ],
      ),
    ],
  );
}
