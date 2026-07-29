import '../../../../core/network/api_result.dart';
import '../models/enquiry_model.dart';

abstract class EnquiryRemoteDataSource {
  Future<List<EnquiryModel>> getEnquiries();
  Future<void> replyEnquiry(String id, String status);
  Future<String> sendReply(String id, String body);
}

class EnquiryRemoteDataSourceImpl implements EnquiryRemoteDataSource {
  final ApiHttp http;
  EnquiryRemoteDataSourceImpl(this.http);

  @override
  Future<List<EnquiryModel>> getEnquiries() async {
    final data = await http.get('/admin/enquiries');
    return ApiHttp.unwrapList(data, 'enquiries')
        .map((j) => EnquiryModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> replyEnquiry(String id, String status) async {
    await http.patch('/admin/enquiries/$id', body: {'status': status});
  }

  @override
  Future<String> sendReply(String id, String body) async {
    // DR-17: in-tool email reply; sends then marks the enquiry responded.
    final data = await http.post('/admin/enquiries/$id/reply', body: {'body': body});
    return ((data as Map?)?.cast<String, dynamic>()['status'])?.toString() ?? 'sent';
  }
}
