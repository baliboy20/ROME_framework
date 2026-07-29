import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/payment.dart';
import '../repositories/payment_repository.dart';

/// A8 — load the payments list.
class GetPayments extends UseCase<List<Payment>, NoParams> {
  final PaymentRepository repository;
  GetPayments(this.repository);

  @override
  Future<Result<List<Payment>>> call(NoParams params) => repository.getPayments();
}
