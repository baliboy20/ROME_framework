import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/bike_record.dart';
import '../../domain/usecases/fleet_usecases.dart';

// ---- events ----
sealed class BikesEvent extends Equatable {
  const BikesEvent();
  @override
  List<Object?> get props => [];
}

class LoadBikesEvent extends BikesEvent {
  const LoadBikesEvent();
}

class SearchBikesEvent extends BikesEvent {
  final String query;
  const SearchBikesEvent(this.query);
  @override
  List<Object?> get props => [query];
}

class SelectBikeEvent extends BikesEvent {
  final String id;
  const SelectBikeEvent(this.id);
  @override
  List<Object?> get props => [id];
}

// ---- state ----
class BikesState extends Equatable {
  final bool loading;
  final List<BikeSummary> all;
  final String query;
  final String? selectedId;
  final BikeRecord? detail;
  final bool detailLoading;
  final String? error;

  const BikesState({
    this.loading = true,
    this.all = const [],
    this.query = '',
    this.selectedId,
    this.detail,
    this.detailLoading = false,
    this.error,
  });

  List<BikeSummary> get rows => all.where((b) => b.matches(query)).toList();

  BikesState copyWith({
    bool? loading,
    List<BikeSummary>? all,
    String? query,
    String? selectedId,
    BikeRecord? detail,
    bool? detailLoading,
    String? error,
    bool clearDetail = false,
  }) =>
      BikesState(
        loading: loading ?? this.loading,
        all: all ?? this.all,
        query: query ?? this.query,
        selectedId: selectedId ?? this.selectedId,
        detail: clearDetail ? null : (detail ?? this.detail),
        detailLoading: detailLoading ?? this.detailLoading,
        error: error,
      );

  @override
  List<Object?> get props => [loading, all, query, selectedId, detail, detailLoading, error];
}

// ---- bloc ----
class BikesBloc extends Bloc<BikesEvent, BikesState> {
  final GetFleet getFleet;
  final GetBike getBike;

  BikesBloc({required this.getFleet, required this.getBike}) : super(const BikesState()) {
    on<LoadBikesEvent>(_onLoad);
    on<SearchBikesEvent>(_onSearch);
    on<SelectBikeEvent>(_onSelect);
  }

  Future<void> _onLoad(LoadBikesEvent event, Emitter<BikesState> emit) async {
    emit(state.copyWith(loading: true));
    final result = await getFleet(const NoParams());
    result.fold(
      (f) => emit(state.copyWith(loading: false, error: f.message)),
      (rows) {
        emit(state.copyWith(loading: false, all: rows));
        _autoSelect(emit);
      },
    );
  }

  void _onSearch(SearchBikesEvent event, Emitter<BikesState> emit) {
    emit(state.copyWith(query: event.query));
    _autoSelect(emit);
  }

  void _autoSelect(Emitter<BikesState> emit) {
    final rows = state.rows;
    if (rows.isEmpty) {
      emit(state.copyWith(selectedId: null, clearDetail: true, detailLoading: false));
    } else if (state.selectedId == null || !rows.any((r) => r.id == state.selectedId)) {
      add(SelectBikeEvent(rows.first.id));
    }
  }

  Future<void> _onSelect(SelectBikeEvent event, Emitter<BikesState> emit) async {
    emit(state.copyWith(selectedId: event.id, detailLoading: true));
    final result = await getBike(event.id);
    result.fold(
      (f) => emit(state.copyWith(detailLoading: false)),
      (record) => emit(state.copyWith(detail: record, detailLoading: false)),
    );
  }
}
