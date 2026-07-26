import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/entities/departure.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/entities/departure_detail.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/entities/lookups.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/entities/tour.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/repositories/scheduling_repository.dart';
import 'package:fob_webapp_admin/features/scheduling/domain/usecases/scheduling_usecases.dart';
import 'package:fob_webapp_admin/features/scheduling/presentation/bloc/scheduler_bloc.dart';

class _FakeRepo implements SchedulingRepository {
  List<DepartureEditOption> departures;
  _FakeRepo({this.departures = const []});

  @override
  Future<Result<List<DepartureEditOption>>> getDepartures() async => Success(departures);
  @override
  Future<Result<List<GuideOption>>> getGuides() async => const Success([]);
  @override
  Future<Result<List<Tour>>> getTours() async => const Success([]);
  @override
  Future<Result<void>> createDeparture(Map<String, dynamic> b) async => const Success(null);
  @override
  Future<Result<void>> updateDeparture(String id, Map<String, dynamic> b) async => const Success(null);
  @override
  Future<Result<void>> cancelDeparture(String id, {Map<String, dynamic>? notice}) async =>
      const Success(null);

  // unused
  @override
  Future<Result<List<Departure>>> getCalendar() async => const Success([]);
  @override
  Future<Result<DepartureDetail>> getDeparture(String id) async =>
      const Success(DepartureDetail(bookings: [], participants: []));
  @override
  Future<Result<void>> createTour(Map<String, dynamic> b) async => const Success(null);
  @override
  Future<Result<void>> updateTour(String id, Map<String, dynamic> b) async => const Success(null);
  @override
  Future<Result<void>> deleteTour(String id) async => const Success(null);
}

SchedulerBloc _bloc(_FakeRepo repo) => SchedulerBloc(
      getDepartures: GetDepartures(repo),
      getGuides: GetGuides(repo),
      getTours: GetTours(repo),
      saveDeparture: SaveDeparture(repo),
      cancelDeparture: CancelDeparture(repo),
    );

void main() {
  group('SchedulerBloc capacity guard (UXD-05, REQ-BOOK11/12)', () {
    test('capacity above 10 is blocked', () async {
      final bloc = _bloc(_FakeRepo());
      bloc.add(const SetCapacityEvent(11));
      await Future.delayed(Duration.zero);
      expect(bloc.state.capacityError, 'A departure can hold at most 10 riders.');
      expect(bloc.state.canSave, isFalse);
    });

    test('capacity at 10 is allowed', () async {
      final bloc = _bloc(_FakeRepo());
      bloc.add(const SetCapacityEvent(10));
      await Future.delayed(Duration.zero);
      expect(bloc.state.capacityError, isNull);
      expect(bloc.state.canSave, isTrue);
    });

    test('edit mode: capacity below current booked count is blocked', () async {
      final repo = _FakeRepo(departures: [
        const DepartureEditOption(id: 'd1', tourId: 't', date: '2026-08-15', time: '09:30', capacity: 8, confirmedCount: 6),
      ]);
      final bloc = _bloc(repo);
      bloc.add(const LoadSchedulerEvent());
      await Future.delayed(Duration.zero);
      bloc.add(const SelectDepartureForEditEvent('d1'));
      await Future.delayed(Duration.zero);
      bloc.add(const SetCapacityEvent(5));
      await Future.delayed(Duration.zero);
      expect(bloc.state.capacityError, "6 riders are already booked — capacity can't go below that.");
      expect(bloc.state.canSave, isFalse);
    });

    test('edit mode: capacity at or above current booked count is allowed', () async {
      final repo = _FakeRepo(departures: [
        const DepartureEditOption(id: 'd1', tourId: 't', date: '2026-08-15', time: '09:30', capacity: 8, confirmedCount: 6),
      ]);
      final bloc = _bloc(repo);
      bloc.add(const LoadSchedulerEvent());
      await Future.delayed(Duration.zero);
      bloc.add(const SelectDepartureForEditEvent('d1'));
      await Future.delayed(Duration.zero);
      bloc.add(const SetCapacityEvent(6));
      await Future.delayed(Duration.zero);
      expect(bloc.state.capacityError, isNull);
      expect(bloc.state.canSave, isTrue);
    });

    test('no guide marks departure not-ready-to-run, non-blocking (UXD-06)', () async {
      final bloc = _bloc(_FakeRepo());
      bloc.add(const SetGuideEvent(null));
      await Future.delayed(Duration.zero);
      expect(bloc.state.notReadyToRun, isTrue);
      expect(bloc.state.canSave, isTrue);
    });
  });
}
