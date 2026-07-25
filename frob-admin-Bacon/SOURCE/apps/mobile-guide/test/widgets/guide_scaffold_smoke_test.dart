import 'package:fob_mobile_guide/models/guide_models.dart';
import 'package:fob_mobile_guide/services/api_client.dart';
import 'package:fob_mobile_guide/services/device_service.dart';
import 'package:fob_mobile_guide/services/storage_service.dart';
import 'package:fob_mobile_guide/state/tour_cubit.dart';
import 'package:fob_mobile_guide/screens/g2_home_screen.dart';
import 'package:fob_mobile_guide/screens/g6_checkin_screen.dart';
import 'package:fob_mobile_guide/theme/fob_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sembast/sembast_memory.dart';

int _dbCounter = 0;

Future<TourCubit> _newCubit() async {
  // Unique DB name per call — see note in test/tour_cubit_test.dart.
  final db = await databaseFactoryMemory.openDatabase('widget-test-${_dbCounter++}.db');
  final store = SessionStore(db);
  final deviceService = DeviceService(db);
  final api = ApiClient(deviceService, baseUrl: 'http://offline.invalid');
  return TourCubit.restore(store, api);
}

Widget _wrap(TourCubit cubit, Widget child) => MaterialApp(
      theme: buildFobGuideTheme(),
      home: BlocProvider.value(value: cubit, child: child),
    );

void main() {
  testWidgets('G2 home shows 0/6 progress and six playbook steps', (tester) async {
    // sembast's memory backend serializes reads/writes through a real
    // Timer-based lock queue, which never fires under
    // TestWidgetsFlutterBinding's synchronous test zone — run the DB setup
    // through `runAsync` so its real Futures/Timers actually resolve.
    final cubit = await tester.runAsync(_newCubit);
    await tester.pumpWidget(_wrap(cubit!, const G2HomeScreen(deviceId: 'DEV-GUIDE-TEST01')));
    await tester.pumpAndSettle();

    expect(find.text('0/6'), findsOneWidget);
    expect(find.text('Travel kit checklist'), findsOneWidget);
    expect(find.text('Bike inspection'), findsOneWidget);
  });

  testWidgets('G6 rider refusal renders REFUSED pill and does not surface money controls',
      (tester) async {
    final cubit = await tester.runAsync(_newCubit);
    cubit!.refuseRider(cubit.state.riders.first.id, 'Medical');
    await tester.pumpWidget(_wrap(cubit, const G6CheckinScreen()));
    await tester.pumpAndSettle();

    expect(find.text('REFUSED'), findsOneWidget);
    // The screen surfaces "flagged for William" both in the general
    // instructional copy and in the per-rider reason line, so at least
    // one (not exactly one) match is the correct expectation.
    expect(find.textContaining('flagged for William'), findsAtLeastNWidgets(1));
    // UXC-CMP-3: the guide app never surfaces an amount/refund control.
    expect(find.textContaining('£'), findsNothing);
    expect(find.text('Refund'), findsNothing);
  });

  test('RiderStatus enum satisfies UXC-STA-3 three-value machine', () {
    expect(RiderStatus.values, [RiderStatus.pending, RiderStatus.checked, RiderStatus.refused]);
  });
}
