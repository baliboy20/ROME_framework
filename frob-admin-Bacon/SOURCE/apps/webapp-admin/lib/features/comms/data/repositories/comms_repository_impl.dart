import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/audit_entry.dart';
import '../../domain/entities/content_snapshot.dart';
import '../../domain/entities/message.dart';
import '../../domain/repositories/comms_repository.dart';
import '../datasources/comms_remote_data_source.dart';

class CommsRepositoryImpl with RepositoryGuard implements CommsRepository {
  final CommsRemoteDataSource remote;
  CommsRepositoryImpl(this.remote);

  @override
  Future<Result<List<Message>>> getAlerts() =>
      guard(() async => await remote.getAlerts());

  @override
  Future<Result<List<Message>>> getDeliverability() =>
      guard(() async => await remote.getDeliverability());

  @override
  Future<Result<List<AuditEntry>>> getAudit() =>
      guard(() async => await remote.getAudit());

  @override
  Future<Result<ContentSnapshot>> getContent() =>
      guard(() async => await remote.getContent());

  @override
  Future<Result<void>> publish() => guard(() async => await remote.publish());
}
