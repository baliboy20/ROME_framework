import '../../../../core/network/api_result.dart';
import '../models/comms_models.dart';

abstract class CommsRemoteDataSource {
  Future<List<MessageModel>> getAlerts();
  Future<List<MessageModel>> getDeliverability();
  Future<List<AuditEntryModel>> getAudit();
  Future<ContentSnapshotModel> getContent();
  Future<void> publish();
}

class CommsRemoteDataSourceImpl implements CommsRemoteDataSource {
  final ApiHttp http;
  CommsRemoteDataSourceImpl(this.http);

  @override
  Future<List<MessageModel>> getAlerts() async {
    final data = await http.get('/admin/alerts');
    return ApiHttp.unwrapList(data, 'alerts')
        .map((j) => MessageModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<List<MessageModel>> getDeliverability() async {
    final data = await http.get('/admin/deliverability');
    return ApiHttp.unwrapList(data, 'messages')
        .map((j) => MessageModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<List<AuditEntryModel>> getAudit() async {
    final data = await http.get('/admin/audit-log');
    return ApiHttp.unwrapList(data, 'entries')
        .map((j) => AuditEntryModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<ContentSnapshotModel> getContent() async {
    final data = await http.get('/admin/content');
    return ContentSnapshotModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<void> publish() async {
    await http.post('/publish');
  }
}
