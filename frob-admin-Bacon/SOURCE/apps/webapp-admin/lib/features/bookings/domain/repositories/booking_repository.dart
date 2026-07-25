import '../../../../core/types/result.dart';
import '../entities/booking_created.dart';
import '../entities/booking_detail.dart';
import '../entities/booking_summary.dart';

/// Domain contract for booking reads/writes (A7 create, A19 browse/edit/transition).
abstract class BookingRepository {
  Future<Result<BookingDetail>> getBookingDetail(String id);
  Future<Result<List<BookingSummary>>> getBookings();
  Future<Result<List<DepartureSlot>>> getDepartures();
  Future<Result<BookingCreated>> createBooking(Map<String, dynamic> body);
  Future<Result<BookingCreated>> createProvisionalBooking(Map<String, dynamic> body);
  Future<Result<void>> updateBooking(String id, Map<String, dynamic> body);
  Future<Result<void>> transitionBooking(String id, String transition);
}
