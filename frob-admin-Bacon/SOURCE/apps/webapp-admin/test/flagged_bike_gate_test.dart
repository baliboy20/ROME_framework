import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/api/api_client.dart';
import 'package:fob_webapp_admin/bloc/flagged_bike_cubit.dart';

void main() {
  group('FlaggedBikeCubit clear-to-service gate (UXD-11)', () {
    test('cannot clear with zero maintenance events', () {
      final cubit = FlaggedBikeCubit(ApiClient());
      cubit.openBike('FOB-004');
      expect(cubit.state.canClear, isFalse);
    });

    test('can clear once at least one maintenance event exists', () {
      final cubit = FlaggedBikeCubit(ApiClient());
      cubit.openBike('FOB-004', existingEvents: 1);
      expect(cubit.state.canClear, isTrue);
    });
  });
}
