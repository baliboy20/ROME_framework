import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/api/api_client.dart';
import 'package:fob_webapp_admin/bloc/scheduler_cubit.dart';

void main() {
  group('SchedulerCubit capacity guard (UXD-05, REQ-BOOK11/12)', () {
    late SchedulerCubit cubit;

    setUp(() {
      cubit = SchedulerCubit(ApiClient());
    });

    test('capacity above 10 is blocked', () {
      cubit.startCreate();
      cubit.setCapacity(11);
      expect(cubit.state.capacityError, 'A departure can hold at most 10 riders.');
      expect(cubit.state.canSave, isFalse);
    });

    test('capacity at 10 is allowed', () {
      cubit.startCreate();
      cubit.setCapacity(10);
      expect(cubit.state.capacityError, isNull);
      expect(cubit.state.canSave, isTrue);
    });

    test('edit mode: capacity below current booked count is blocked', () {
      cubit.startEdit(capacity: 8, currentBooked: 6, hasGuide: true);
      cubit.setCapacity(5);
      expect(cubit.state.capacityError, "6 riders are already booked — capacity can't go below that.");
      expect(cubit.state.canSave, isFalse);
    });

    test('edit mode: capacity at or above current booked count is allowed', () {
      cubit.startEdit(capacity: 8, currentBooked: 6, hasGuide: true);
      cubit.setCapacity(6);
      expect(cubit.state.capacityError, isNull);
      expect(cubit.state.canSave, isTrue);
    });

    test('no guide marks departure not-ready-to-run, non-blocking (UXD-06)', () {
      cubit.startCreate();
      cubit.setHasGuide(false);
      expect(cubit.state.notReadyToRun, isTrue);
      expect(cubit.state.canSave, isTrue);
    });
  });
}
