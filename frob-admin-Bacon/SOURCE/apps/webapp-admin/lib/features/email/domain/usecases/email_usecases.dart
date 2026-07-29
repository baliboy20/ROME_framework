import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/email_entities.dart';
import '../repositories/email_repository.dart';

class SearchArchive extends UseCase<ArchiveResults, String> {
  final EmailRepository repository;
  SearchArchive(this.repository);
  @override
  Future<Result<ArchiveResults>> call(String query) => repository.searchArchive(query);
}

class GetThread extends UseCase<EmailThread, String> {
  final EmailRepository repository;
  GetThread(this.repository);
  @override
  Future<Result<EmailThread>> call(String id) => repository.getThread(id);
}

class LinkThread extends UseCase<void, LinkThreadParams> {
  final EmailRepository repository;
  LinkThread(this.repository);
  @override
  Future<Result<void>> call(LinkThreadParams p) =>
      repository.linkThread(p.threadId, bookingId: p.bookingId, enquiryId: p.enquiryId);
}

class LinkThreadParams {
  final String threadId;
  final String? bookingId;
  final String? enquiryId;
  const LinkThreadParams(this.threadId, {this.bookingId, this.enquiryId});
}

class ReplyToThread extends UseCase<String, ReplyParams> {
  final EmailRepository repository;
  ReplyToThread(this.repository);
  @override
  Future<Result<String>> call(ReplyParams p) => repository.replyToThread(p.threadId, p.body);
}

class ReplyParams {
  final String threadId;
  final String body;
  const ReplyParams(this.threadId, this.body);
}

class GetTemplates extends UseCase<List<EmailTemplate>, NoParams> {
  final EmailRepository repository;
  GetTemplates(this.repository);
  @override
  Future<Result<List<EmailTemplate>>> call(NoParams params) => repository.getTemplates();
}

class SaveTemplate extends UseCase<void, SaveTemplateParams> {
  final EmailRepository repository;
  SaveTemplate(this.repository);
  @override
  Future<Result<void>> call(SaveTemplateParams p) => p.id == null
      ? repository.createTemplate(p.body)
      : repository.updateTemplate(p.id!, p.body);
}

class SaveTemplateParams {
  final String? id;
  final Map<String, dynamic> body;
  const SaveTemplateParams({this.id, required this.body});
}

/// Hard-delete a template (worker allows only an unused draft; otherwise 409).
class DeleteTemplate extends UseCase<void, String> {
  final EmailRepository repository;
  DeleteTemplate(this.repository);
  @override
  Future<Result<void>> call(String id) => repository.deleteTemplate(id);
}

/// Test-send a template with sample data; returns the recipient it went to.
class TestSendTemplate extends UseCase<String, TestSendParams> {
  final EmailRepository repository;
  TestSendTemplate(this.repository);
  @override
  Future<Result<String>> call(TestSendParams p) => repository.testSendTemplate(p.id, to: p.to);
}

class TestSendParams {
  final String id;
  final String? to;
  const TestSendParams(this.id, {this.to});
}
