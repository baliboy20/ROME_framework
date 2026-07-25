import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';

enum CalendarView { list, calendar }
enum CalendarRange { week, month, all }

/// A17 departure calendar — dual view + drill-down (UXD-08), readiness (UXD-07).
class CalendarState {
  final bool loading;
  final List<DepartureRow> departures;
  final CalendarView view;
  final CalendarRange range;
  final DepartureRow? openDeparture;
  final String? error;

  const CalendarState({
    this.loading = false,
    this.departures = const [],
    this.view = CalendarView.list,
    this.range = CalendarRange.month,
    this.openDeparture,
    this.error,
  });

  CalendarState copyWith({
    bool? loading,
    List<DepartureRow>? departures,
    CalendarView? view,
    CalendarRange? range,
    DepartureRow? openDeparture,
    bool clearOpen = false,
    String? error,
  }) =>
      CalendarState(
        loading: loading ?? this.loading,
        departures: departures ?? this.departures,
        view: view ?? this.view,
        range: range ?? this.range,
        openDeparture: clearOpen ? null : (openDeparture ?? this.openDeparture),
        error: error,
      );
}

class CalendarCubit extends Cubit<CalendarState> {
  final ApiClient api;
  CalendarCubit(this.api) : super(const CalendarState());

  Future<void> load() async {
    emit(state.copyWith(loading: true));
    try {
      final data = await api.getCalendar();
      final rows = data.map((j) => DepartureRow.fromJson(j as Map<String, dynamic>)).toList();
      emit(state.copyWith(loading: false, departures: rows));
    } catch (e) {
      emit(state.copyWith(loading: false, error: 'Could not load the departure calendar.'));
    }
  }

  void setView(CalendarView v) => emit(state.copyWith(view: v));
  void setRange(CalendarRange r) => emit(state.copyWith(range: r));
  void openDeparture(DepartureRow d) => emit(state.copyWith(openDeparture: d));
  void closeOverlay() => emit(state.copyWith(clearOpen: true));
}
