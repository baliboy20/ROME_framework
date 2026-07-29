import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/enquiry.dart';
import '../../domain/repositories/enquiry_repository.dart';
import '../datasources/enquiry_remote_data_source.dart';

class EnquiryRepositoryImpl with RepositoryGuard implements EnquiryRepository {
  final EnquiryRemoteDataSource remote;
  EnquiryRepositoryImpl(this.remote);

  @override
  Future<Result<List<Enquiry>>> getEnquiries() =>
      guard(() async => await remote.getEnquiries());

  @override
  Future<Result<void>> replyEnquiry(String id, String status) =>
      guard(() async => await remote.replyEnquiry(id, status));

  @override
  Future<Result<String>> sendReply(String id, String body) =>
      guard(() async => await remote.sendReply(id, body));
}
