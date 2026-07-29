import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/booking_summary.dart';
import '../../domain/usecases/booking_usecases.dart';

// ---- events ----
sealed class NewBookingEvent extends Equatable {
  const NewBookingEvent();
  @override
  List<Object?> get props => [];
}

class LoadNewBookingEvent extends NewBookingEvent {
  const LoadNewBookingEvent();
}

class SubmitBookingEvent extends NewBookingEvent {
  final String departureId;
  final int partySize;
  final int pricePence;
  final String email;
  final bool confirmed;
  const SubmitBookingEvent({
    required this.departureId,
    required this.partySize,
    required this.pricePence,
    required this.email,
    required this.confirmed,
  });
  @override
  List<Object?> get props => [departureId, partySize, pricePence, email, confirmed];
}

class ClearNewBookingNoticeEvent extends NewBookingEvent {
  const ClearNewBookingNoticeEvent();
}

// ---- state ----
class NewBookingState extends Equatable {
  final List<DepartureSlot> departures;
  final bool submitting;
  final String? notice; // toast text after a submit

  const NewBookingState({this.departures = const [], this.submitting = false, this.notice});

  NewBookingState copyWith({List<DepartureSlot>? departures, bool? submitting, String? notice}) =>
      NewBookingState(
        departures: departures ?? this.departures,
        submitting: submitting ?? this.submitting,
        notice: notice,
      );

  @override
  List<Object?> get props => [departures, submitting, notice];
}

// ---- bloc ----
/// A7 new owner booking (REQ-BOOK08 / REQ-BOOK10). DR-B11: the customer
/// supplies attendee/consent details via a completion link sent to their email.
class NewBookingBloc extends Bloc<NewBookingEvent, NewBookingState> {
  final GetBookingDepartures getDepartures;
  final CreateBooking createBooking;
  final CreateProvisionalBooking createProvisionalBooking;

  NewBookingBloc({
    required this.getDepartures,
    required this.createBooking,
    required this.createProvisionalBooking,
  }) : super(const NewBookingState()) {
    on<LoadNewBookingEvent>(_onLoad);
    on<SubmitBookingEvent>(_onSubmit);
    on<ClearNewBookingNoticeEvent>((e, emit) => emit(state.copyWith(notice: null)));
  }

  Future<void> _onLoad(LoadNewBookingEvent event, Emitter<NewBookingState> emit) async {
    final result = await getDepartures(const NoParams());
    emit(state.copyWith(departures: result.valueOrNull ?? const []));
  }

  Future<void> _onSubmit(SubmitBookingEvent event, Emitter<NewBookingState> emit) async {
    emit(state.copyWith(submitting: true));
    final result = event.confirmed
        ? await createBooking({
            'departureId': event.departureId,
            'partySize': event.partySize,
            'agreedTotalPricePence': event.pricePence,
            'customerEmail': event.email,
          })
        : await createProvisionalBooking({
            'departureId': event.departureId,
            'partySize': event.partySize,
            'pricePerPersonPence': (event.pricePence / event.partySize).round(),
            'holdExpiresAt': DateTime.now().add(const Duration(days: 3)).toUtc().toIso8601String(),
            'customerEmail': event.email,
          });
    emit(result.fold(
      (f) => state.copyWith(submitting: false, notice: 'Could not create booking: ${f.message}'),
      (created) {
        final idPart = created.id.isNotEmpty ? ' (${created.id})' : '';
        return state.copyWith(
          submitting: false,
          notice: created.completionLinkSent
              ? 'Booking created$idPart. Completion link sent to ${event.email}.'
              : 'Booking created$idPart. Could not send the completion link — resend from the booking record.',
        );
      },
    ));
  }
}
