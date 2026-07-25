import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/bike.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/bike_record.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/compliance_item.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/departure_option.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/equipment.dart';
import 'package:fob_webapp_admin/features/fleet/domain/entities/fleet_readiness.dart';
import 'package:fob_webapp_admin/features/fleet/domain/repositories/fleet_repository.dart';
import 'package:fob_webapp_admin/features/fleet/domain/usecases/fleet_usecases.dart';
import 'package:fob_webapp_admin/features/fleet/presentation/bloc/add_bike_bloc.dart';
import 'package:fob_webapp_admin/features/fleet/presentation/bloc/flagged_bike_bloc.dart';

class _FakeRepo implements FleetRepository {
  List<BikeSummary> fleet;
  _FakeRepo({this.fleet = const []});

  @override
  Future<Result<List<BikeSummary>>> getFleet() async => Success(fleet);
  @override
  Future<Result<void>> addBike(String id, String label) async => const Success(null);
  @override
  Future<Result<void>> logMaintenance(String bikeId, String note) async => const Success(null);
  @override
  Future<Result<void>> setBikeStatus(String bikeId, String status) async => const Success(null);

  // unused in these tests
  @override
  Future<Result<BikeRecord>> getBike(String id) async =>
      Success(const BikeRecord(id: 'x', make: '', model: '', frameSize: '', colour: '', status: ''));
  @override
  Future<Result<FleetReadiness>> getFleetReadiness() async =>
      const Success(FleetReadiness(counts: {}, alerts: []));
  @override
  Future<Result<List<Bike>>> getAvailableBikes(String departureId) async => const Success([]);
  @override
  Future<Result<void>> setBikeAssignments(String d, List<String> b) async => const Success(null);
  @override
  Future<Result<List<Equipment>>> getEquipment() async => const Success([]);
  @override
  Future<Result<void>> addEquipment(String t, String d, String p) async => const Success(null);
  @override
  Future<Result<List<ComplianceItem>>> getCompliance() async => const Success([]);
  @override
  Future<Result<void>> renewCompliance(String id, String e) async => const Success(null);
  @override
  Future<Result<List<DepartureOption>>> getDepartureOptions() async => const Success([]);
}

BikeSummary _bike(String id, {String status = 'in_service'}) =>
    BikeSummary(id: id, make: 'Trek', model: 'X', frameSize: 'M', colour: 'red', status: status);

void main() {
  group('AddBikeBloc duplicate guard (UXD-10)', () {
    test('duplicate id blocks add and suggests next sequential id', () async {
      final repo = _FakeRepo(fleet: [_bike('FOB-001'), _bike('FOB-002')]);
      final bloc = AddBikeBloc(getFleet: GetFleet(repo), addBike: AddBike(repo));
      bloc.add(const LoadExistingBikesEvent());
      await Future.delayed(Duration.zero);
      bloc.add(const CheckBikeIdEvent('FOB-002'));
      await Future.delayed(Duration.zero);
      expect(bloc.state.duplicateError, 'FOB-002 is already in use — next available is FOB-003.');
      expect(bloc.state.canAdd, isFalse);
    });

    test('unique id is not blocked', () async {
      final repo = _FakeRepo(fleet: [_bike('FOB-001')]);
      final bloc = AddBikeBloc(getFleet: GetFleet(repo), addBike: AddBike(repo));
      bloc.add(const LoadExistingBikesEvent());
      await Future.delayed(Duration.zero);
      bloc.add(const CheckBikeIdEvent('FOB-002'));
      await Future.delayed(Duration.zero);
      expect(bloc.state.duplicateError, isNull);
      expect(bloc.state.canAdd, isTrue);
    });
  });

  group('FlaggedBikeBloc clear-to-service gate (UXD-11)', () {
    FlaggedBikeBloc build(_FakeRepo repo) => FlaggedBikeBloc(
        getFleet: GetFleet(repo), logMaintenance: LogMaintenance(repo), setBikeStatus: SetBikeStatus(repo));

    test('cannot clear with zero maintenance events', () async {
      final bloc = build(_FakeRepo());
      bloc.add(const OpenFlaggedBikeEvent('FOB-004'));
      await Future.delayed(Duration.zero);
      expect(bloc.state.canClear, isFalse);
    });

    test('can clear once at least one maintenance event is logged', () async {
      final bloc = build(_FakeRepo());
      bloc.add(const OpenFlaggedBikeEvent('FOB-004'));
      await Future.delayed(Duration.zero);
      bloc.add(const LogMaintenanceEvent('trued wheel'));
      await Future.delayed(Duration.zero);
      expect(bloc.state.maintenanceEventCount, 1);
      expect(bloc.state.canClear, isTrue);
    });

    test('flagged loader keeps only flagged/in_maintenance bikes', () async {
      final repo = _FakeRepo(fleet: [
        _bike('a', status: 'in_service'),
        _bike('b', status: 'flagged_for_service'),
        _bike('c', status: 'in_maintenance'),
      ]);
      final bloc = build(repo);
      bloc.add(const LoadFlaggedBikesEvent());
      await Future.delayed(Duration.zero);
      expect(bloc.state.flagged.map((b) => b.id), ['b', 'c']);
    });
  });
}
