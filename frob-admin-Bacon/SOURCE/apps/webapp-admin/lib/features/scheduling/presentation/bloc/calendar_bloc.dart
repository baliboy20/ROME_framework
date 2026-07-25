import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/departure.dart';
import '../../domain/usecases/scheduling_usecases.dart';

enum CalendarView { list, calendar }

// ---- events ----
sealed class CalendarEvent extends Equatable {
  const CalendarEvent();
  @override
  List<Object?> get props => [];
}

class LoadCalendarEvent extends CalendarEvent {
  const LoadCalendarEvent();
}

class SetCalendarViewEvent extends CalendarEvent {
  final CalendarView view;
  const SetCalendarViewEvent(this.view);
  @override
  List<Object?> get props => [view];
}

// ---- state ----
class CalendarState extends Equatable {
  final bool loading;
  final List<Departure> departures;
  final CalendarView view;
  final String? error;

  const CalendarState({
    this.loading = false,
    this.departures = const [],
    this.view = CalendarView.list,
    this.error,
  });

  CalendarState copyWith({bool? loading, List<Departure>? departures, CalendarView? view, String? error}) =>
      CalendarState(
        loading: loading ?? this.loading,
        departures: departures ?? this.departures,
        view: view ?? this.view,
        error: error,
      );

  @override
  List<Object?> get props => [loading, departures, view, error];
}

// ---- bloc ----
/// A17 departure calendar — dual view + drill-down (UXD-08), readiness (UXD-07).
class CalendarBloc extends Bloc<CalendarEvent, CalendarState> {
  final GetCalendar getCalendar;

  CalendarBloc(this.getCalendar) : super(const CalendarState()) {
    on<LoadCalendarEvent>(_onLoad);
    on<SetCalendarViewEvent>((event, emit) => emit(state.copyWith(view: event.view)));
  }

  Future<void> _onLoad(LoadCalendarEvent event, Emitter<CalendarState> emit) async {
    emit(state.copyWith(loading: true));
    final result = await getCalendar(const NoParams());
    result.fold(
      (f) => emit(state.copyWith(loading: false, error: 'Could not load the departure calendar.')),
      (rows) => emit(state.copyWith(loading: false, departures: rows)),
    );
  }
}
