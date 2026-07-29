import 'package:equatable/equatable.dart';
import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/enquiry_repository.dart';

class ReplyEnquiry extends UseCase<void, ReplyParams> {
  final EnquiryRepository repository;
  ReplyEnquiry(this.repository);

  @override
  Future<Result<void>> call(ReplyParams params) =>
      repository.replyEnquiry(params.id, params.status);
}

class ReplyParams extends Equatable {
  final String id;
  final String status;
  const ReplyParams({required this.id, required this.status});

  @override
  List<Object?> get props => [id, status];
}
