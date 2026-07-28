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

/// CR-004 (CHG-012, REQ-NOTIF11) — send an active booking-aware template to
/// the booking's lead (editable recipient, optional personal message).
/// Resolves to the address the worker sent to ("Sent to <address>").
class SendBookingEmail extends UseCase<String, SendBookingEmailParams> {
  final BookingRepository repository;
  SendBookingEmail(this.repository);
  @override
  Future<Result<String>> call(SendBookingEmailParams p) =>
      repository.sendBookingEmail(p.bookingId, p.payload);
}

class SendBookingEmailParams {
  final String bookingId;
  final String templateId;
  final String to;
  final String? personalMessage;
  const SendBookingEmailParams({
    required this.bookingId,
    required this.templateId,
    required this.to,
    this.personalMessage,
  });

  /// Contract payload (api-contracts.md#cr-004): templateId + to + optional
  /// personalMessage — never any body/subject fields (template-only send).
  Map<String, dynamic> get payload => {
        'templateId': templateId,
        'to': to,
        if (personalMessage != null && personalMessage!.isNotEmpty)
          'personalMessage': personalMessage,
      };
}
