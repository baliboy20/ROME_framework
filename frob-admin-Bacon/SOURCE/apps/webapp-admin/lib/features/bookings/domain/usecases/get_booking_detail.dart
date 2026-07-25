import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/booking_detail.dart';
import '../repositories/booking_repository.dart';

/// Read a single booking aggregate (payments drill-down, A19 detail).
class GetBookingDetail extends UseCase<BookingDetail, String> {
  final BookingRepository repository;
  GetBookingDetail(this.repository);

  @override
  Future<Result<BookingDetail>> call(String id) => repository.getBookingDetail(id);
}
