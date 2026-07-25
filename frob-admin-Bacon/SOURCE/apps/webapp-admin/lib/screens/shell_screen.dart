import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_cubit.dart';
import '../theme/tokens.dart';
import '../widgets/tree_nav.dart';
import '../features/payments/presentation/pages/payments_page.dart';
import '../features/enquiries/presentation/pages/enquiries_page.dart';
import '../features/scheduling/presentation/pages/calendar_page.dart';
import '../features/scheduling/presentation/pages/scheduler_page.dart';
import '../features/fleet/presentation/pages/bike_allocation_page.dart';
import '../features/fleet/presentation/pages/add_bike_page.dart';
import '../features/fleet/presentation/pages/flagged_bike_page.dart';
import 'new_booking_screen.dart';
import 'booking_browser_screen.dart';
import '../features/comms/presentation/pages/alerts_page.dart';
import '../features/comms/presentation/pages/deliverability_page.dart';
import '../features/comms/presentation/pages/audit_page.dart';
import '../features/comms/presentation/pages/publish_page.dart';
import '../features/safety/presentation/pages/incidents_page.dart';
import '../features/safety/presentation/pages/hazards_page.dart';
import '../features/fleet/presentation/pages/equipment_page.dart';
import '../features/fleet/presentation/pages/fleet_readiness_page.dart';
import '../features/fleet/presentation/pages/bikes_page.dart';
import '../features/fleet/presentation/pages/compliance_page.dart';
import '../features/scheduling/presentation/pages/tours_page.dart';

const kNavGroups = [
  NavGroup('Bookings & payments', [
    NavLeaf('A7', 'New booking', '/new-booking'),
    NavLeaf('A8', 'Payments & refunds', '/payments'),
    NavLeaf('A9', 'Enquiries', '/enquiries'),
    NavLeaf('A19', 'Booking browser', '/booking-browser'),
  ], hue: FobColors.pink),
  NavGroup('Scheduling', [
    NavLeaf('A22', 'Tours & routes', '/tours'),
    NavLeaf('A17', 'Departure calendar', '/calendar'),
    NavLeaf('A18', 'Scheduler', '/scheduler'),
    NavLeaf('A20', 'Bike allocation', '/bike-allocation'),
  ], hue: FobColors.cyan),
  NavGroup('Alerts & records', [
    NavLeaf('A4', 'Owner alerts', '/alerts'),
    NavLeaf('A3', 'Deliverability', '/deliverability'),
    NavLeaf('A5', 'Audit log', '/audit'),
  ], hue: FobColors.orange),
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
];

/// Console shell — persistent TreeNav + top bar + swapping content region
/// (UXC-NAV-3, UXD-18).
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  String activeRoute = '/calendar';

  Widget _content() {
    switch (activeRoute) {
      case '/new-booking':
        return const NewBookingScreen();
      case '/enquiries':
        return const EnquiriesPage();
      case '/booking-browser':
        return const BookingBrowserScreen();
      case '/tours':
        return const ToursPage();
      case '/calendar':
        return const CalendarPage();
      case '/scheduler':
        return const SchedulerPage();
      case '/bike-allocation':
        return const BikeAllocationPage();
      case '/alerts':
        return const AlertsPage();
      case '/deliverability':
        return const DeliverabilityPage();
      case '/audit':
        return const AuditPage();
      case '/publish':
        return const PublishPage();
      case '/incidents':
        return const IncidentsPage();
      case '/hazards':
        return const HazardsPage();
      case '/fleet-readiness':
        return const FleetReadinessPage();
      case '/bikes':
        return const BikesPage();
      case '/add-bike':
        return const AddBikePage();
      case '/equipment':
        return const EquipmentPage();
      case '/flagged-bike':
        return const FlaggedBikePage();
      case '/compliance':
        return const CompliancePage();
      case '/payments':
        return const PaymentsPage();
      default:
        return const CalendarPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FobColors.surfaceBg,
      body: Row(
        children: [
          TreeNav(
            groups: kNavGroups,
            activeRoute: activeRoute,
            onSelect: (r) => setState(() => activeRoute = r),
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
                      Text(activeRoute.replaceFirst('/', '').toUpperCase(), style: FobText.microLabel),
                      const Spacer(),
                      const Text('William · Owner', style: FobText.body),
                      const SizedBox(width: 12),
                      TextButton(
                        key: const Key('signout-button'),
                        onPressed: () => context.read<AuthCubit>().signOut(),
                        child: const Text('Sign out'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(FobSpace.gutter),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1160),
                      child: _content(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
