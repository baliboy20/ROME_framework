import '../../../../core/network/api_result.dart';
import '../../domain/entities/email_entities.dart';
import '../models/email_models.dart';
import '../../domain/entities/html_import_report.dart';

abstract class EmailRemoteDataSource {
  Future<ArchiveResults> searchArchive(String query);
  Future<EmailThread> getThread(String id);
  Future<void> linkThread(String id, {String? bookingId, String? enquiryId});
  Future<String> replyToThread(String id, String body);
  Future<List<EmailTemplate>> getTemplates();
  Future<void> createTemplate(Map<String, dynamic> body);
  Future<void> updateTemplate(String id, Map<String, dynamic> body);
  Future<void> deleteTemplate(String id);
  Future<String> testSendTemplate(String id, {String? to});

  /// FR-001 workstream 5 — send a complete HTML document to be stored as this
  /// template's body. Returns the server's report on what it found.
  Future<HtmlImportReport> importTemplateHtml(String id, String html);
}

class EmailRemoteDataSourceImpl implements EmailRemoteDataSource {
  final ApiHttp http;
  EmailRemoteDataSourceImpl(this.http);

  @override
  Future<ArchiveResults> searchArchive(String query) async {
    final data = await http.get('/admin/email-archive', query: query.isEmpty ? null : {'q': query});
    final m = (data as Map).cast<String, dynamic>();
    final received = ((m['received'] as List?) ?? const [])
        .map((j) => archivedFromJson((j as Map).cast<String, dynamic>()))
        .toList();
    final sent = ((m['sent'] as List?) ?? const [])
        .map((j) => sentFromJson((j as Map).cast<String, dynamic>()))
        .toList();
    return ArchiveResults(received: received, sent: sent);
  }

  @override
  Future<EmailThread> getThread(String id) async {
    final data = await http.get('/admin/email-threads/$id');
    final m = (data as Map).cast<String, dynamic>();
    final t = (m['thread'] as Map).cast<String, dynamic>();
    final categorisation = t['categorisation']?.toString() ?? 'unlinked';
    final received = ((m['received'] as List?) ?? const [])
        .map((j) => archivedFromJson((j as Map).cast<String, dynamic>(), categorisationOverride: categorisation))
        .toList();
    return EmailThread(
      id: t['id']?.toString() ?? id,
      categorisation: categorisation,
      bookingId: t['booking_id']?.toString(),
      enquiryId: t['enquiry_id']?.toString(),
      received: received,
    );
  }

  @override
  Future<void> linkThread(String id, {String? bookingId, String? enquiryId}) async {
    await http.patch('/admin/email-threads/$id/link', body: {
      if (bookingId != null) 'bookingId': bookingId,
      if (enquiryId != null) 'enquiryId': enquiryId,
    });
  }

  @override
  Future<String> replyToThread(String id, String body) async {
    final data = await http.post('/admin/email-threads/$id/reply', body: {'body': body});
    return ((data as Map?)?.cast<String, dynamic>()['status'])?.toString() ?? 'sent';
  }

  @override
  Future<List<EmailTemplate>> getTemplates() async {
    final data = await http.get('/admin/email-templates');
    return ApiHttp.unwrapList(data, 'templates')
        .map((j) => templateFromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> createTemplate(Map<String, dynamic> body) async {
    await http.post('/admin/email-templates', body: body);
  }

  @override
  Future<void> updateTemplate(String id, Map<String, dynamic> body) async {
    await http.patch('/admin/email-templates/$id', body: body);
  }

  @override
  Future<void> deleteTemplate(String id) async {
    await http.delete('/admin/email-templates/$id');
  }

  @override
  Future<String> testSendTemplate(String id, {String? to}) async {
    final data = await http.post(
      '/admin/email-templates/$id/test-send',
      body: {if (to != null && to.isNotEmpty) 'to': to},
    );
    return (data as Map)['sentTo']?.toString() ?? '';
  }

  @override
  Future<HtmlImportReport> importTemplateHtml(String id, String html) async {
    final data = await http.post(
      '/admin/email-templates/$id/import-html',
      body: {'html': html},
    );
    return HtmlImportReport.fromJson(
      ((data as Map)['report'] as Map).cast<String, dynamic>(),
    );
  }
}
