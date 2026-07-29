import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/audit_entry.dart';
import '../entities/content_snapshot.dart';
import '../entities/message.dart';
import '../repositories/comms_repository.dart';

class GetAlerts extends UseCase<List<Message>, NoParams> {
  final CommsRepository repository;
  GetAlerts(this.repository);
  @override
  Future<Result<List<Message>>> call(NoParams params) => repository.getAlerts();
}

class GetDeliverability extends UseCase<List<Message>, NoParams> {
  final CommsRepository repository;
  GetDeliverability(this.repository);
  @override
  Future<Result<List<Message>>> call(NoParams params) => repository.getDeliverability();
}

class GetAudit extends UseCase<List<AuditEntry>, NoParams> {
  final CommsRepository repository;
  GetAudit(this.repository);
  @override
  Future<Result<List<AuditEntry>>> call(NoParams params) => repository.getAudit();
}

class GetContent extends UseCase<ContentSnapshot, NoParams> {
  final CommsRepository repository;
  GetContent(this.repository);
  @override
  Future<Result<ContentSnapshot>> call(NoParams params) => repository.getContent();
}

class Publish extends UseCase<void, NoParams> {
  final CommsRepository repository;
  Publish(this.repository);
  @override
  Future<Result<void>> call(NoParams params) => repository.publish();
}
