import '../../../../core/network/api_result.dart';
import '../models/enquiry_model.dart';

abstract class EnquiryRemoteDataSource {
  Future<List<EnquiryModel>> getEnquiries();
  Future<void> replyEnquiry(String id, String status);
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
}
