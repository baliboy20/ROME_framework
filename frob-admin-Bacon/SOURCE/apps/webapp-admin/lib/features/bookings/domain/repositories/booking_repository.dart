import '../../../../core/types/result.dart';
import '../entities/booking_detail.dart';

/// Domain contract for booking reads/writes. Grows through Phase 2; the read
/// slice ships first to serve the payments drill-down modals.
abstract class BookingRepository {
  Future<Result<BookingDetail>> getBookingDetail(String id);
}
