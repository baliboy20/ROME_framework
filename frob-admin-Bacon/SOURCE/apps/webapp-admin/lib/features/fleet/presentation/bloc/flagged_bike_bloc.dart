import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/bike_record.dart';
import '../../domain/usecases/fleet_usecases.dart';

// ---- events ----
sealed class FlaggedBikeEvent extends Equatable {
  const FlaggedBikeEvent();
  @override
  List<Object?> get props => [];
}

class LoadFlaggedBikesEvent extends FlaggedBikeEvent {
  const LoadFlaggedBikesEvent();
}

class OpenFlaggedBikeEvent extends FlaggedBikeEvent {
  final String bikeId;
  const OpenFlaggedBikeEvent(this.bikeId);
  @override
  List<Object?> get props => [bikeId];
}

class LogMaintenanceEvent extends FlaggedBikeEvent {
  final String note;
  const LogMaintenanceEvent(this.note);
  @override
  List<Object?> get props => [note];
}

class ClearToServiceEvent extends FlaggedBikeEvent {
  const ClearToServiceEvent();
}

// ---- state ----
class FlaggedBikeState extends Equatable {
  final List<BikeSummary> flagged;
  final String? bikeId;
  final int maintenanceEventCount;
  final bool cleared;
  final bool saving;

  const FlaggedBikeState({
    this.flagged = const [],
    this.bikeId,
    this.maintenanceEventCount = 0,
    this.cleared = false,
    this.saving = false,
  });

  bool get canClear => maintenanceEventCount > 0 && !cleared;

  FlaggedBikeState copyWith({
    List<BikeSummary>? flagged,
    String? bikeId,
    int? maintenanceEventCount,
    bool? cleared,
    bool? saving,
  }) =>
      FlaggedBikeState(
        flagged: flagged ?? this.flagged,
        bikeId: bikeId ?? this.bikeId,
        maintenanceEventCount: maintenanceEventCount ?? this.maintenanceEventCount,
        cleared: cleared ?? this.cleared,
        saving: saving ?? this.saving,
      );

  @override
  List<Object?> get props => [flagged, bikeId, maintenanceEventCount, cleared, saving];
}

// ---- bloc ----
/// A15 flagged-bike clear-to-service gate (UXD-11).
class FlaggedBikeBloc extends Bloc<FlaggedBikeEvent, FlaggedBikeState> {
  final GetFleet getFleet;
  final LogMaintenance logMaintenance;
  final SetBikeStatus setBikeStatus;

  static const _flaggedStatuses = {'flagged_for_service', 'in_maintenance'};

  FlaggedBikeBloc({
    required this.getFleet,
    required this.logMaintenance,
    required this.setBikeStatus,
  }) : super(const FlaggedBikeState()) {
    on<LoadFlaggedBikesEvent>(_onLoad);
    on<OpenFlaggedBikeEvent>(_onOpen);
    on<LogMaintenanceEvent>(_onLog);
    on<ClearToServiceEvent>(_onClear);
  }

  Future<void> _onLoad(LoadFlaggedBikesEvent event, Emitter<FlaggedBikeState> emit) async {
    final result = await getFleet(const NoParams());
    result.fold(
      (_) {},
      (rows) => emit(state.copyWith(
          flagged: rows.where((b) => _flaggedStatuses.contains(b.status)).toList())),
    );
  }

  void _onOpen(OpenFlaggedBikeEvent event, Emitter<FlaggedBikeState> emit) {
    emit(FlaggedBikeState(flagged: state.flagged, bikeId: event.bikeId));
  }

  Future<void> _onLog(LogMaintenanceEvent event, Emitter<FlaggedBikeState> emit) async {
    final id = state.bikeId;
    if (id == null) return;
    emit(state.copyWith(saving: true));
    final result = await logMaintenance(MaintenanceParams(id, event.note));
    result.fold(
      (_) => emit(state.copyWith(saving: false)),
      (_) => emit(state.copyWith(saving: false, maintenanceEventCount: state.maintenanceEventCount + 1)),
    );
  }

  Future<void> _onClear(ClearToServiceEvent event, Emitter<FlaggedBikeState> emit) async {
    final id = state.bikeId;
    if (id == null || !state.canClear) return;
    emit(state.copyWith(saving: true));
    final result = await setBikeStatus(StatusParams(id, 'in_service'));
    result.fold(
      (_) => emit(state.copyWith(saving: false)),
      (_) => emit(state.copyWith(saving: false, cleared: true)),
    );
  }
}
