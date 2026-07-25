import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';

/// A20 bike allocation — TransferList coverage (UXD-09, REQ-BOOK14).
class BikeAllocationState {
  final bool loading;
  final List<BikeRow> available;
  final List<BikeRow> assigned;
  final int ridersNeeded;
  final String? error;

  const BikeAllocationState({
    this.loading = false,
    this.available = const [],
    this.assigned = const [],
    this.ridersNeeded = 0,
    this.error,
  });

  BikeAllocationState copyWith({
    bool? loading,
    List<BikeRow>? available,
    List<BikeRow>? assigned,
    int? ridersNeeded,
    String? error,
  }) =>
      BikeAllocationState(
        loading: loading ?? this.loading,
        available: available ?? this.available,
        assigned: assigned ?? this.assigned,
        ridersNeeded: ridersNeeded ?? this.ridersNeeded,
        error: error,
      );
}

class BikeAllocationCubit extends Cubit<BikeAllocationState> {
  final ApiClient api;
  BikeAllocationCubit(this.api) : super(const BikeAllocationState());

  Future<void> load(String departureId, {required int ridersNeeded}) async {
    emit(state.copyWith(loading: true, ridersNeeded: ridersNeeded));
    try {
      final data = await api.getAvailableBikes(departureId);
      final bikes = data.map((j) => BikeRow.fromJson(j as Map<String, dynamic>)).toList();
      emit(state.copyWith(loading: false, available: bikes, assigned: const []));
    } catch (e) {
      emit(state.copyWith(loading: false, error: 'Could not load fleet.'));
    }
  }

  void assign(BikeRow bike) {
    if (bike.outOfService || bike.busyOverlap) return;
    emit(state.copyWith(
      available: state.available.where((b) => b.id != bike.id).toList(),
      assigned: [...state.assigned, bike],
    ));
  }

  void unassign(BikeRow bike) {
    emit(state.copyWith(
      assigned: state.assigned.where((b) => b.id != bike.id).toList(),
      available: [...state.available, bike],
    ));
  }

  Future<void> save(String departureId) async {
    try {
      await api.setBikeAssignments(departureId, state.assigned.map((b) => b.id).toList());
    } catch (e) {
      emit(state.copyWith(error: 'Save failed — please try again.'));
    }
  }
}
