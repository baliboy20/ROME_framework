import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/email_entities.dart';
import '../../domain/entities/html_import_report.dart';
import '../../domain/repositories/email_repository.dart';
import '../datasources/email_remote_data_source.dart';

class EmailRepositoryImpl with RepositoryGuard implements EmailRepository {
  final EmailRemoteDataSource remote;
  EmailRepositoryImpl(this.remote);

  @override
  Future<Result<ArchiveResults>> searchArchive(String query) =>
      guard(() async => await remote.searchArchive(query));

  @override
  Future<Result<EmailThread>> getThread(String id) => guard(() async => await remote.getThread(id));

  @override
  Future<Result<void>> linkThread(String id, {String? bookingId, String? enquiryId}) =>
      guard(() async => await remote.linkThread(id, bookingId: bookingId, enquiryId: enquiryId));

  @override
  Future<Result<String>> replyToThread(String id, String body) =>
      guard(() async => await remote.replyToThread(id, body));

  @override
  Future<Result<List<EmailTemplate>>> getTemplates() =>
      guard(() async => await remote.getTemplates());

  @override
  Future<Result<void>> createTemplate(Map<String, dynamic> body) =>
      guard(() async => await remote.createTemplate(body));

  @override
  Future<Result<void>> updateTemplate(String id, Map<String, dynamic> body) =>
      guard(() async => await remote.updateTemplate(id, body));

  @override
  Future<Result<void>> deleteTemplate(String id) =>
      guard(() async => await remote.deleteTemplate(id));

  @override
  Future<Result<String>> testSendTemplate(String id, {String? to}) =>
      guard(() async => await remote.testSendTemplate(id, to: to));

  @override
  Future<Result<HtmlImportReport>> importTemplateHtml(String id, String html) =>
      guard(() async => await remote.importTemplateHtml(id, html));
}
