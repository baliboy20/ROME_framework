import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/safety/domain/entities/hazard.dart';
import 'package:fob_webapp_admin/features/safety/domain/entities/incident.dart';
import 'package:fob_webapp_admin/features/safety/domain/repositories/safety_repository.dart';
import 'package:fob_webapp_admin/features/safety/domain/usecases/safety_usecases.dart';
import 'package:fob_webapp_admin/features/safety/presentation/bloc/hazards_bloc.dart';
import 'package:fob_webapp_admin/features/safety/presentation/bloc/incidents_bloc.dart';

class _FakeRepo implements SafetyRepository {
  List<Incident> incidents;
  List<Hazard> hazards;
  Failure? fail;
  int dispatched = 0;
  int reviewed = 0;
  _FakeRepo({this.incidents = const [], this.hazards = const []});

  @override
  Future<Result<List<Incident>>> getIncidents() async =>
      fail != null ? Error(fail!) : Success(incidents);
  @override
  Future<Result<void>> dispatchIncident(String id) async {
    dispatched++;
    return const Success(null);
  }

  @override
  Future<Result<List<Hazard>>> getHazards() async =>
      fail != null ? Error(fail!) : Success(hazards);
  @override
  Future<Result<void>> reviewHazard(String id, String status) async {
    reviewed++;
    return const Success(null);
  }
}

const _inc = Incident(
    id: 'i1', location: 'Loc', type: 'fall', severity: 'high',
    description: 'd', status: 'submitted', tourId: 't', occurredAt: 'now');
const _haz = Hazard(
    id: 'h1', street: 'St', hazardType: 'pothole', description: 'd',
    severity: 'high', status: 'pending_review', observedAt: 'now');

void main() {
  test('IncidentsBloc load emits Loading then Loaded', () async {
    final repo = _FakeRepo(incidents: [_inc]);
    final bloc = IncidentsBloc(getIncidents: GetIncidents(repo), dispatchIncident: DispatchIncident(repo));
    final states = <IncidentsState>[];
    bloc.stream.listen(states.add);
    bloc.add(const LoadIncidentsEvent());
    await Future.delayed(Duration.zero);
    expect(states.first, isA<IncidentsLoading>());
    expect((states.last as IncidentsLoaded).rows.single.canDispatch, isTrue);
  });

  test('IncidentsBloc dispatch reloads the list', () async {
    final repo = _FakeRepo(incidents: [_inc]);
    final bloc = IncidentsBloc(getIncidents: GetIncidents(repo), dispatchIncident: DispatchIncident(repo));
    bloc.add(const DispatchIncidentEvent('i1'));
    await Future.delayed(const Duration(milliseconds: 5));
    expect(repo.dispatched, 1);
    expect(bloc.state, isA<IncidentsLoaded>());
  });

  test('HazardsBloc load failure surfaces the message', () async {
    final repo = _FakeRepo()..fail = const NetworkFailure('offline');
    final bloc = HazardsBloc(getHazards: GetHazards(repo), reviewHazard: ReviewHazard(repo));
    bloc.add(const LoadHazardsEvent());
    await Future.delayed(Duration.zero);
    expect((bloc.state as HazardsLoadFailure).message, 'offline');
  });

  test('HazardsBloc approve reloads', () async {
    final repo = _FakeRepo(hazards: [_haz]);
    final bloc = HazardsBloc(getHazards: GetHazards(repo), reviewHazard: ReviewHazard(repo));
    bloc.add(const ApproveHazardEvent('h1'));
    await Future.delayed(const Duration(milliseconds: 5));
    expect(repo.reviewed, 1);
  });
}
