import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';

/// A15 flagged-bike clear-to-service gate (UXD-11).
class FlaggedBikeState {
  final String bikeId;
  final int maintenanceEventCount;
  final bool cleared;
  final bool saving;

  const FlaggedBikeState({this.bikeId = '', this.maintenanceEventCount = 0, this.cleared = false, this.saving = false});

  bool get canClear => maintenanceEventCount > 0 && !cleared;

  FlaggedBikeState copyWith({String? bikeId, int? maintenanceEventCount, bool? cleared, bool? saving}) =>
      FlaggedBikeState(
        bikeId: bikeId ?? this.bikeId,
        maintenanceEventCount: maintenanceEventCount ?? this.maintenanceEventCount,
        cleared: cleared ?? this.cleared,
        saving: saving ?? this.saving,
      );
}

class FlaggedBikeCubit extends Cubit<FlaggedBikeState> {
  final ApiClient api;
  FlaggedBikeCubit(this.api) : super(const FlaggedBikeState());

  void openBike(String bikeId, {int existingEvents = 0}) =>
      emit(FlaggedBikeState(bikeId: bikeId, maintenanceEventCount: existingEvents));

  Future<void> logMaintenance(String note) async {
    if (state.bikeId.isEmpty) return;
    emit(state.copyWith(saving: true));
    try {
      await api.logMaintenance(state.bikeId, note);
      emit(state.copyWith(saving: false, maintenanceEventCount: state.maintenanceEventCount + 1));
    } catch (e) {
      emit(state.copyWith(saving: false));
    }
  }

  Future<void> clearToService() async {
    if (!state.canClear) return;
    emit(state.copyWith(saving: true));
    try {
      await api.setBikeStatus(state.bikeId, 'in_service');
      emit(state.copyWith(saving: false, cleared: true));
    } catch (e) {
      emit(state.copyWith(saving: false));
    }
  }
}
