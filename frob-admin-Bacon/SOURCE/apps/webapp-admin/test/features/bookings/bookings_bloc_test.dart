import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_created.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_detail.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_summary.dart';
import 'package:fob_webapp_admin/features/bookings/domain/repositories/booking_repository.dart';
import 'package:fob_webapp_admin/features/bookings/domain/usecases/booking_usecases.dart';
import 'package:fob_webapp_admin/features/bookings/domain/usecases/get_booking_detail.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/bloc/bookings_bloc.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/bloc/new_booking_bloc.dart';

class _FakeRepo implements BookingRepository {
  List<BookingSummary> bookings;
  int transitions = 0;
  Map<String, dynamic>? lastCreateBody;
  _FakeRepo({this.bookings = const []});

  @override
  Future<Result<List<BookingSummary>>> getBookings() async => Success(bookings);
  @override
  Future<Result<BookingDetail>> getBookingDetail(String id) async => Success(BookingDetail(
        id: id, status: 'confirmed', partySize: 1, priceTotalPence: 9000,
        attendees: const [], emergencyContact: null, consent: const Consent(),
        statusHistory: const StatusHistory(), paymentAttempts: const [],
      ));
  @override
  Future<Result<void>> transitionBooking(String id, String t) async {
    transitions++;
    return const Success(null);
  }

  @override
  Future<Result<List<DepartureSlot>>> getDepartures() async =>
      const Success([DepartureSlot(id: 'd1', tourId: 't', date: '2026-08-15', time: '09:30')]);
  @override
  Future<Result<BookingCreated>> createBooking(Map<String, dynamic> body) async {
    lastCreateBody = body;
    return const Success(BookingCreated(id: 'b9', completionLinkSent: true));
  }

  @override
  Future<Result<BookingCreated>> createProvisionalBooking(Map<String, dynamic> body) async =>
      const Success(BookingCreated(id: 'b9', completionLinkSent: true));
  @override
  Future<Result<void>> updateBooking(String id, Map<String, dynamic> body) async => const Success(null);
  @override
  Future<Result<String>> sendBookingEmail(String id, Map<String, dynamic> body) async =>
      Success(body['to']?.toString() ?? '');
}

BookingSummary _b(String id, {String status = 'confirmed', String name = 'Alex'}) => BookingSummary(
      id: id, customerName: name, tourName: 'City', date: '2026-08-15', status: status, partySize: 2, paidPence: 9000);

void main() {
  group('BookingsBloc', () {
    test('load then auto-select first booking detail', () async {
      final repo = _FakeRepo(bookings: [_b('b1'), _b('b2')]);
      final bloc = BookingsBloc(getBookings: GetBookings(repo), getBookingDetail: GetBookingDetail(repo), transitionBooking: TransitionBooking(repo));
      bloc.add(const LoadBookingsEvent());
      await Future.delayed(const Duration(milliseconds: 5));
      expect(bloc.state.all.length, 2);
      expect(bloc.state.selectedId, 'b1');
      expect(bloc.state.detail, isNotNull);
    });

    test('search filters the visible rows', () async {
      final repo = _FakeRepo(bookings: [_b('b1', name: 'Alex'), _b('b2', name: 'Blair')]);
      final bloc = BookingsBloc(getBookings: GetBookings(repo), getBookingDetail: GetBookingDetail(repo), transitionBooking: TransitionBooking(repo));
      bloc.add(const LoadBookingsEvent());
      await Future.delayed(const Duration(milliseconds: 5));
      bloc.add(const SearchBookingsEvent('blair'));
      await Future.delayed(Duration.zero);
      expect(bloc.state.rows.map((r) => r.id), ['b2']);
    });

    test('transition calls the use case and reloads', () async {
      final repo = _FakeRepo(bookings: [_b('b1', status: 'draft')]);
      final bloc = BookingsBloc(getBookings: GetBookings(repo), getBookingDetail: GetBookingDetail(repo), transitionBooking: TransitionBooking(repo));
      bloc.add(const LoadBookingsEvent());
      await Future.delayed(const Duration(milliseconds: 5));
      bloc.add(const TransitionBookingEvent('b1', 'confirm'));
      await Future.delayed(const Duration(milliseconds: 5));
      expect(repo.transitions, 1);
    });
  });

  group('NewBookingBloc', () {
    test('confirmed submit builds an agreed-total body and reports link sent', () async {
      final repo = _FakeRepo();
      final bloc = NewBookingBloc(getDepartures: GetBookingDepartures(repo), createBooking: CreateBooking(repo), createProvisionalBooking: CreateProvisionalBooking(repo));
      bloc.add(const SubmitBookingEvent(departureId: 'd1', partySize: 2, pricePence: 9000, email: 'c@x.com', confirmed: true));
      await Future.delayed(const Duration(milliseconds: 5));
      expect(repo.lastCreateBody!['agreedTotalPricePence'], 9000);
      expect(bloc.state.notice, contains('Completion link sent'));
    });

    test('failed submit surfaces the failure message', () async {
      final repo = _ThrowingRepo();
      final bloc = NewBookingBloc(getDepartures: GetBookingDepartures(repo), createBooking: CreateBooking(repo), createProvisionalBooking: CreateProvisionalBooking(repo));
      bloc.add(const SubmitBookingEvent(departureId: 'd1', partySize: 2, pricePence: 9000, email: 'c@x.com', confirmed: true));
      await Future.delayed(const Duration(milliseconds: 5));
      expect(bloc.state.notice, contains('Could not create booking'));
    });
  });
}

class _ThrowingRepo extends _FakeRepo {
  @override
  Future<Result<BookingCreated>> createBooking(Map<String, dynamic> body) async =>
      const Error(ServerFailure('boom'));
}
