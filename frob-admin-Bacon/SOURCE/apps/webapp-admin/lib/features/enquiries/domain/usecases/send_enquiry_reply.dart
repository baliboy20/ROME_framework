import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/enquiry_repository.dart';

/// REQ-PRE05 / DR-17 — send an in-tool email reply to an enquiry, which marks
/// it responded. Returns the send status.
class SendEnquiryReply extends UseCase<String, SendReplyParams> {
  final EnquiryRepository repository;
  SendEnquiryReply(this.repository);

  @override
  Future<Result<String>> call(SendReplyParams p) => repository.sendReply(p.id, p.body);
}

class SendReplyParams {
  final String id;
  final String body;
  const SendReplyParams(this.id, this.body);
}
