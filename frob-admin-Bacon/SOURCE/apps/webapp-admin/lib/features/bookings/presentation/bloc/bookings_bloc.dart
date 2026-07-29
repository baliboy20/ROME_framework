import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/entities/booking_summary.dart';
import '../../domain/usecases/booking_usecases.dart';
import '../../domain/usecases/get_booking_detail.dart';

// ---- events ----
sealed class BookingsEvent extends Equatable {
  const BookingsEvent();
  @override
  List<Object?> get props => [];
}

class LoadBookingsEvent extends BookingsEvent {
  const LoadBookingsEvent();
}

class SearchBookingsEvent extends BookingsEvent {
  final String query;
  const SearchBookingsEvent(this.query);
  @override
  List<Object?> get props => [query];
}

class SelectBookingEvent extends BookingsEvent {
  final String id;
  const SelectBookingEvent(this.id);
  @override
  List<Object?> get props => [id];
}

class TransitionBookingEvent extends BookingsEvent {
  final String id;
  final String transition;
  const TransitionBookingEvent(this.id, this.transition);
  @override
  List<Object?> get props => [id, transition];
}

/// Dispatched after the edit dialog saves, to refresh list + detail.
class RefreshBookingEvent extends BookingsEvent {
  final String id;
  const RefreshBookingEvent(this.id);
  @override
  List<Object?> get props => [id];
}

// ---- state ----
class BookingsState extends Equatable {
  final bool loading;
  final List<BookingSummary> all;
  final String query;
  final String? selectedId;
  final BookingDetail? detail;
  final bool detailLoading;
  final String? notice;

  const BookingsState({
    this.loading = true,
    this.all = const [],
    this.query = '',
    this.selectedId,
    this.detail,
    this.detailLoading = false,
    this.notice,
  });

  List<BookingSummary> get rows => all.where((b) => b.matches(query)).toList();

  BookingsState copyWith({
    bool? loading,
    List<BookingSummary>? all,
    String? query,
    String? selectedId,
    BookingDetail? detail,
    bool? detailLoading,
    String? notice,
    bool clearDetail = false,
  }) =>
      BookingsState(
        loading: loading ?? this.loading,
        all: all ?? this.all,
        query: query ?? this.query,
        selectedId: selectedId ?? this.selectedId,
        detail: clearDetail ? null : (detail ?? this.detail),
        detailLoading: detailLoading ?? this.detailLoading,
        notice: notice,
      );

  @override
  List<Object?> get props => [loading, all, query, selectedId, detail, detailLoading, notice];
}

// ---- bloc ----
/// A19 booking browser (BO05/BO06) — master-detail + status transitions.
class BookingsBloc extends Bloc<BookingsEvent, BookingsState> {
  final GetBookings getBookings;
  final GetBookingDetail getBookingDetail;
  final TransitionBooking transitionBooking;

  BookingsBloc({
    required this.getBookings,
    required this.getBookingDetail,
    required this.transitionBooking,
  }) : super(const BookingsState()) {
    on<LoadBookingsEvent>(_onLoad);
    on<SearchBookingsEvent>(_onSearch);
    on<SelectBookingEvent>(_onSelect);
    on<TransitionBookingEvent>(_onTransition);
    on<RefreshBookingEvent>(_onRefresh);
  }

  Future<void> _onLoad(LoadBookingsEvent event, Emitter<BookingsState> emit) async {
    emit(state.copyWith(loading: true));
    final result = await getBookings(const NoParams());
    result.fold(
      (f) => emit(state.copyWith(loading: false, notice: f.message)),
      (rows) {
        emit(state.copyWith(loading: false, all: rows));
        _autoSelect(emit);
      },
    );
  }

  void _onSearch(SearchBookingsEvent event, Emitter<BookingsState> emit) {
    emit(state.copyWith(query: event.query));
    _autoSelect(emit);
  }

  void _autoSelect(Emitter<BookingsState> emit) {
    final rows = state.rows;
    if (rows.isEmpty) {
      emit(state.copyWith(selectedId: null, clearDetail: true, detailLoading: false));
    } else if (state.selectedId == null || !rows.any((r) => r.id == state.selectedId)) {
      add(SelectBookingEvent(rows.first.id));
    }
  }

  Future<void> _onSelect(SelectBookingEvent event, Emitter<BookingsState> emit) async {
    emit(state.copyWith(selectedId: event.id, detailLoading: true));
    final result = await getBookingDetail(event.id);
    result.fold(
      (f) => emit(state.copyWith(detailLoading: false)),
      (detail) => emit(state.copyWith(detail: detail, detailLoading: false)),
    );
  }

  Future<void> _onTransition(TransitionBookingEvent event, Emitter<BookingsState> emit) async {
    final result = await transitionBooking(TransitionParams(event.id, event.transition));
    await result.fold(
      (f) async => emit(state.copyWith(notice: 'Could not update status: ${f.message}')),
      (_) async {
        emit(state.copyWith(notice: 'Booking updated.'));
        add(RefreshBookingEvent(event.id));
      },
    );
  }

  Future<void> _onRefresh(RefreshBookingEvent event, Emitter<BookingsState> emit) async {
    final list = await getBookings(const NoParams());
    list.fold((f) {}, (rows) => emit(state.copyWith(all: rows)));
    add(SelectBookingEvent(event.id));
  }
}
