import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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

/// Sequenced fade-through for content-region page changes: the outgoing page
/// fades fully out over the first half of the transition, then the incoming
/// page fades in over the second half — the two are never visible at the same
/// time. Honours the platform "reduce motion" setting (instant swap when set).
CustomTransitionPage<void> _animatedPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 340),
    reverseTransitionDuration: const Duration(milliseconds: 340),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return child;

      // Incoming page: invisible until the halfway point, then fades in.
      final fadeIn = CurvedAnimation(parent: animation, curve: const Interval(0.5, 1.0, curve: Curves.easeOut));
      // Outgoing page (covered by a push): fully out by the halfway point.
      final fadeOutWhenCovered = Tween<double>(begin: 1.0, end: 0.0).animate(
        CurvedAnimation(parent: secondaryAnimation, curve: const Interval(0.0, 0.5, curve: Curves.easeIn)),
      );

      return AnimatedBuilder(
        animation: Listenable.merge([fadeIn, fadeOutWhenCovered]),
        child: child,
        builder: (_, inner) {
          final opacity = (fadeIn.value * fadeOutWhenCovered.value).clamp(0.0, 1.0);
          return Opacity(
            opacity: opacity,
            child: Transform.translate(
              // subtle rise as the incoming page fades in
              offset: Offset(0, (1 - fadeIn.value) * 6),
              child: inner,
            ),
          );
        },
      );
    },
  );
}

GoRoute _shellRoute(String path, Widget page) =>
    GoRoute(path: path, pageBuilder: (context, state) => _animatedPage(state, page));

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
