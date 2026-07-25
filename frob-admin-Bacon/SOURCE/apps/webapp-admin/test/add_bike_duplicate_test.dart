import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/api/api_client.dart';
import 'package:fob_webapp_admin/bloc/add_bike_cubit.dart';

void main() {
  group('AddBikeCubit duplicate guard (UXD-10)', () {
    test('duplicate id blocks add and suggests next sequential id', () {
      final cubit = AddBikeCubit(ApiClient());
      cubit.seedExisting(['FOB-001', 'FOB-002']);
      cubit.checkId('FOB-002');
      expect(cubit.state.duplicateError, 'FOB-002 is already in use — next available is FOB-003.');
      expect(cubit.state.canAdd, isFalse);
    });

    test('unique id is not blocked', () {
      final cubit = AddBikeCubit(ApiClient());
      cubit.seedExisting(['FOB-001']);
      cubit.checkId('FOB-002');
      expect(cubit.state.duplicateError, isNull);
      expect(cubit.state.canAdd, isTrue);
    });
  });
}
