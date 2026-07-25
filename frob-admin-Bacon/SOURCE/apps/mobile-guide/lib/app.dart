import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'state/tour_cubit.dart';
import 'screens/g2_home_screen.dart';
import 'screens/g3_kit_screen.dart';
import 'screens/g4_bike_inspection_screen.dart';
import 'screens/g5_risk_screen.dart';
import 'screens/g6_checkin_screen.dart';
import 'screens/g7_briefing_screen.dart';
import 'screens/g8_final_signoff_screen.dart';
import 'screens/g9_mid_tour_event_screen.dart';
import 'screens/g10_emergency_screen.dart';
import 'screens/g11_post_ride_review_screen.dart';
import 'screens/g12_incident_report_screen.dart';
import 'screens/g13_hazard_screen.dart';
import 'theme/fob_theme.dart';

/// UXC-NAV-1: single-stack shell — G2 is the hub, every other surface is a
/// push with a persistent back affordance that returns to the hub.
GoRouter buildGuideRouter(String deviceId) => GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(path: '/', builder: (context, state) => G2HomeScreen(deviceId: deviceId)),
        GoRoute(path: '/kit', builder: (context, state) => const G3KitScreen()),
        GoRoute(path: '/bike-inspection', builder: (context, state) => const G4BikeInspectionScreen()),
        GoRoute(path: '/risk', builder: (context, state) => const G5RiskScreen()),
        GoRoute(path: '/checkin', builder: (context, state) => const G6CheckinScreen()),
        GoRoute(path: '/briefing', builder: (context, state) => const G7BriefingScreen()),
        GoRoute(path: '/final-signoff', builder: (context, state) => const G8FinalSignoffScreen()),
        GoRoute(path: '/mid-tour-event', builder: (context, state) => const G9MidTourEventScreen()),
        GoRoute(path: '/emergency', builder: (context, state) => const G10EmergencyScreen()),
        GoRoute(path: '/post-ride-review', builder: (context, state) => const G11PostRideReviewScreen()),
        GoRoute(path: '/incident-report', builder: (context, state) => const G12IncidentReportScreen()),
        GoRoute(path: '/hazard', builder: (context, state) => const G13HazardScreen()),
      ],
    );

class FobGuideApp extends StatelessWidget {
  const FobGuideApp({super.key, required this.tourCubit, required this.deviceId});

  final TourCubit tourCubit;
  final String deviceId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: tourCubit,
      child: MaterialApp.router(
        title: 'Friends on Bikes — Guide',
        debugShowCheckedModeBanner: false,
        theme: buildFobGuideTheme(),
        routerConfig: buildGuideRouter(deviceId),
      ),
    );
  }
}
