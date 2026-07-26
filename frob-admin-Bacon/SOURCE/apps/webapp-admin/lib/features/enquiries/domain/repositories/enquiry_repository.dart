import '../../../../core/types/result.dart';
import '../entities/enquiry.dart';

abstract class EnquiryRepository {
  Future<Result<List<Enquiry>>> getEnquiries();
  Future<Result<void>> replyEnquiry(String id, String status);
  Future<Result<String>> sendReply(String id, String body);
}
