import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/tokens.dart';
import '../widgets/deferred_content.dart';
import '../widgets/skeleton_page.dart';
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
import '../features/settings/presentation/pages/settings_page.dart';
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

/// A plain opacity cross-fade for content-region page changes: the incoming
/// page fades in while the outgoing fades out. Cheap because the transition
/// only ever animates the skeleton placeholder (the real page is deferred past
/// it — see DeferredContent). Honours the platform "reduce motion" setting.
CustomTransitionPage<void> _animatedPage(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 240),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) return child;

      final fadeIn = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      final fadeOut = Tween<double>(begin: 1.0, end: 0.0)
          .animate(CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeIn));

      // FadeTransition over a RepaintBoundary composites the fade as a GPU
      // opacity layer — no per-frame offscreen raster. Each fade is a no-op at 1.0.
      return FadeTransition(
        opacity: fadeOut,
        child: FadeTransition(
          opacity: fadeIn,
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
          // Skeleton-first: animate a cheap placeholder during the transition,
          // then mount the real page (and its data load) once it has settled.
          child: DeferredContent(
            placeholder: const SkeletonPage(),
            builder: (_) => page,
          ),
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
          _shellRoute('/settings', const SettingsPage()),
        ],
      ),
    ],
  );
}
