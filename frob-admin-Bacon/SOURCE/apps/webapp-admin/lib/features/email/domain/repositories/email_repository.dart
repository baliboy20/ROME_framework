import '../../../../core/types/result.dart';
import '../entities/email_entities.dart';

abstract class EmailRepository {
  Future<Result<ArchiveResults>> searchArchive(String query);
  Future<Result<EmailThread>> getThread(String id);
  Future<Result<void>> linkThread(String id, {String? bookingId, String? enquiryId});
  Future<Result<String>> replyToThread(String id, String body);
  Future<Result<List<EmailTemplate>>> getTemplates();
  Future<Result<void>> createTemplate(Map<String, dynamic> body);
  Future<Result<void>> updateTemplate(String id, Map<String, dynamic> body);
  Future<Result<void>> deleteTemplate(String id);
  Future<Result<String>> testSendTemplate(String id, {String? to});
}
