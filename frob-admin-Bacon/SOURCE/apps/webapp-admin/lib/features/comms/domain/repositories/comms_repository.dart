import '../../../../core/types/result.dart';
import '../entities/audit_entry.dart';
import '../entities/content_snapshot.dart';
import '../entities/message.dart';

abstract class CommsRepository {
  Future<Result<List<Message>>> getAlerts();
  Future<Result<List<Message>>> getDeliverability();
  Future<Result<List<AuditEntry>>> getAudit();
  Future<Result<ContentSnapshot>> getContent();
  Future<Result<void>> publish();
}
