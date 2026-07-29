import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/enquiry.dart';
import '../repositories/enquiry_repository.dart';

class GetEnquiries extends UseCase<List<Enquiry>, NoParams> {
  final EnquiryRepository repository;
  GetEnquiries(this.repository);

  @override
  Future<Result<List<Enquiry>>> call(NoParams params) => repository.getEnquiries();
}
