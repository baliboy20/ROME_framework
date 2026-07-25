import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/bike.dart';
import '../../domain/entities/departure_option.dart';
import '../../domain/usecases/fleet_usecases.dart';

// ---- events ----
sealed class BikeAllocationEvent extends Equatable {
  const BikeAllocationEvent();
  @override
  List<Object?> get props => [];
}

class LoadDeparturesEvent extends BikeAllocationEvent {
  const LoadDeparturesEvent();
}

class SelectDepartureEvent extends BikeAllocationEvent {
  final String departureId;
  const SelectDepartureEvent(this.departureId);
  @override
  List<Object?> get props => [departureId];
}

class AssignBikeEvent extends BikeAllocationEvent {
  final Bike bike;
  const AssignBikeEvent(this.bike);
  @override
  List<Object?> get props => [bike];
}

class UnassignBikeEvent extends BikeAllocationEvent {
  final Bike bike;
  const UnassignBikeEvent(this.bike);
  @override
  List<Object?> get props => [bike];
}

class SaveAllocationEvent extends BikeAllocationEvent {
  const SaveAllocationEvent();
}

// ---- state ----
class BikeAllocationState extends Equatable {
  final List<DepartureOption> departures;
  final String? selectedDepartureId;
  final bool loading;
  final List<Bike> available;
  final List<Bike> assigned;
  final int ridersNeeded;
  final String? error;
  final bool saved;

  const BikeAllocationState({
    this.departures = const [],
    this.selectedDepartureId,
    this.loading = false,
    this.available = const [],
    this.assigned = const [],
    this.ridersNeeded = 0,
    this.error,
    this.saved = false,
  });

  BikeAllocationState copyWith({
    List<DepartureOption>? departures,
    String? selectedDepartureId,
    bool? loading,
    List<Bike>? available,
    List<Bike>? assigned,
    int? ridersNeeded,
    String? error,
    bool? saved,
  }) =>
      BikeAllocationState(
        departures: departures ?? this.departures,
        selectedDepartureId: selectedDepartureId ?? this.selectedDepartureId,
        loading: loading ?? this.loading,
        available: available ?? this.available,
        assigned: assigned ?? this.assigned,
        ridersNeeded: ridersNeeded ?? this.ridersNeeded,
        error: error,
        saved: saved ?? this.saved,
      );

  @override
  List<Object?> get props =>
      [departures, selectedDepartureId, loading, available, assigned, ridersNeeded, error, saved];
}

// ---- bloc ----
/// A20 bike allocation — TransferList coverage (UXD-09, REQ-BOOK14).
class BikeAllocationBloc extends Bloc<BikeAllocationEvent, BikeAllocationState> {
  final GetDepartureOptions getDepartureOptions;
  final GetAvailableBikes getAvailableBikes;
  final SetBikeAssignments setBikeAssignments;

  BikeAllocationBloc({
    required this.getDepartureOptions,
    required this.getAvailableBikes,
    required this.setBikeAssignments,
  }) : super(const BikeAllocationState()) {
    on<LoadDeparturesEvent>(_onLoadDepartures);
    on<SelectDepartureEvent>(_onSelect);
    on<AssignBikeEvent>(_onAssign);
    on<UnassignBikeEvent>(_onUnassign);
    on<SaveAllocationEvent>(_onSave);
  }

  Future<void> _onLoadDepartures(LoadDeparturesEvent event, Emitter<BikeAllocationState> emit) async {
    final result = await getDepartureOptions(const NoParams());
    result.fold(
      (f) => emit(state.copyWith(error: f.message)),
      (list) => emit(state.copyWith(departures: list)),
    );
  }

  Future<void> _onSelect(SelectDepartureEvent event, Emitter<BikeAllocationState> emit) async {
    final dep = state.departures.where((d) => d.id == event.departureId).firstOrNull;
    emit(state.copyWith(
      selectedDepartureId: event.departureId,
      loading: true,
      ridersNeeded: dep?.confirmedCount ?? 0,
      saved: false,
    ));
    final result = await getAvailableBikes(event.departureId);
    result.fold(
      (f) => emit(state.copyWith(loading: false, error: 'Could not load fleet.')),
      (bikes) => emit(state.copyWith(loading: false, available: bikes, assigned: const [])),
    );
  }

  void _onAssign(AssignBikeEvent event, Emitter<BikeAllocationState> emit) {
    if (!event.bike.assignable) return;
    emit(state.copyWith(
      available: state.available.where((b) => b.id != event.bike.id).toList(),
      assigned: [...state.assigned, event.bike],
    ));
  }

  void _onUnassign(UnassignBikeEvent event, Emitter<BikeAllocationState> emit) {
    emit(state.copyWith(
      assigned: state.assigned.where((b) => b.id != event.bike.id).toList(),
      available: [...state.available, event.bike],
    ));
  }

  Future<void> _onSave(SaveAllocationEvent event, Emitter<BikeAllocationState> emit) async {
    final id = state.selectedDepartureId;
    if (id == null) return;
    final result = await setBikeAssignments(
        AssignmentParams(id, state.assigned.map((b) => b.id).toList()));
    result.fold(
      (f) => emit(state.copyWith(error: 'Save failed — please try again.')),
      (_) => emit(state.copyWith(saved: true)),
    );
  }
}
