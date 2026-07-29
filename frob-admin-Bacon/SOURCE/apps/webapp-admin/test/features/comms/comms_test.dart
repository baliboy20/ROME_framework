import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/presentation/list_bloc.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/core/usecases/usecase.dart';
import 'package:fob_webapp_admin/features/comms/domain/entities/audit_entry.dart';
import 'package:fob_webapp_admin/features/comms/domain/entities/content_snapshot.dart';
import 'package:fob_webapp_admin/features/comms/domain/entities/message.dart';
import 'package:fob_webapp_admin/features/comms/domain/repositories/comms_repository.dart';
import 'package:fob_webapp_admin/features/comms/domain/usecases/comms_usecases.dart';
import 'package:fob_webapp_admin/features/comms/presentation/bloc/publish_bloc.dart';

class _FakeRepo implements CommsRepository {
  Failure? fail;
  int published = 0;
  @override
  Future<Result<List<Message>>> getAlerts() async => fail != null ? Error(fail!) : const Success([]);
  @override
  Future<Result<List<Message>>> getDeliverability() async => const Success([]);
  @override
  Future<Result<List<AuditEntry>>> getAudit() async => const Success([]);
  @override
  Future<Result<ContentSnapshot>> getContent() async =>
      const Success(ContentSnapshot(pages: [], quality: []));
  @override
  Future<Result<void>> publish() async {
    published++;
    return const Success(null);
  }
}

void main() {
  test('generic ListBloc emits Loading then Loaded via GetAlerts', () async {
    final repo = _FakeRepo();
    final bloc = ListBloc<Message>(() => GetAlerts(repo)(const NoParams()));
    final states = <ListState<Message>>[];
    bloc.stream.listen(states.add);
    bloc.add(const LoadList());
    await Future.delayed(Duration.zero);
    expect(states.first, isA<ListLoading<Message>>());
    expect(states.last, isA<ListLoaded<Message>>());
  });

  test('generic ListBloc surfaces failure message', () async {
    final repo = _FakeRepo()..fail = const AuthFailure('nope');
    final bloc = ListBloc<Message>(() => GetAlerts(repo)(const NoParams()));
    bloc.add(const LoadList());
    await Future.delayed(Duration.zero);
    expect((bloc.state as ListFailure<Message>).message, 'nope');
  });

  test('PublishBloc publish action triggers publish then reload', () async {
    final repo = _FakeRepo();
    final bloc = PublishBloc(getContent: GetContent(repo), publish: Publish(repo));
    bloc.add(const LoadContentEvent());
    await Future.delayed(Duration.zero);
    bloc.add(const PublishNowEvent());
    await Future.delayed(const Duration(milliseconds: 5));
    expect(repo.published, 1);
    expect(bloc.state, isA<PublishLoaded>());
  });
}
