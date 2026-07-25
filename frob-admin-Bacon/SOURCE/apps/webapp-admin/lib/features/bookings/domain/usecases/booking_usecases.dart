import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/booking_created.dart';
import '../entities/booking_summary.dart';
import '../repositories/booking_repository.dart';

class GetBookings extends UseCase<List<BookingSummary>, NoParams> {
  final BookingRepository repository;
  GetBookings(this.repository);
  @override
  Future<Result<List<BookingSummary>>> call(NoParams params) => repository.getBookings();
}

class GetBookingDepartures extends UseCase<List<DepartureSlot>, NoParams> {
  final BookingRepository repository;
  GetBookingDepartures(this.repository);
  @override
  Future<Result<List<DepartureSlot>>> call(NoParams params) => repository.getDepartures();
}

class CreateBooking extends UseCase<BookingCreated, Map<String, dynamic>> {
  final BookingRepository repository;
  CreateBooking(this.repository);
  @override
  Future<Result<BookingCreated>> call(Map<String, dynamic> body) => repository.createBooking(body);
}

class CreateProvisionalBooking extends UseCase<BookingCreated, Map<String, dynamic>> {
  final BookingRepository repository;
  CreateProvisionalBooking(this.repository);
  @override
  Future<Result<BookingCreated>> call(Map<String, dynamic> body) =>
      repository.createProvisionalBooking(body);
}

class UpdateBooking extends UseCase<void, UpdateBookingParams> {
  final BookingRepository repository;
  UpdateBooking(this.repository);
  @override
  Future<Result<void>> call(UpdateBookingParams p) => repository.updateBooking(p.id, p.body);
}

class UpdateBookingParams {
  final String id;
  final Map<String, dynamic> body;
  const UpdateBookingParams(this.id, this.body);
}

class TransitionBooking extends UseCase<void, TransitionParams> {
  final BookingRepository repository;
  TransitionBooking(this.repository);
  @override
  Future<Result<void>> call(TransitionParams p) => repository.transitionBooking(p.id, p.transition);
}

class TransitionParams {
  final String id;
  final String transition;
  const TransitionParams(this.id, this.transition);
}
