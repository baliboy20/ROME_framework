import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';

/// A18 scheduler form state — capacity guard (UXD-05) + fan-out confirms (UXD-03/04).
class SchedulerState {
  final bool isEdit;
  final int capacity;
  final int currentBooked; // floor in edit mode
  final bool hasGuide;
  final String? capacityError;
  final bool saving;
  final String? saveError;
  final bool saved;

  const SchedulerState({
    this.isEdit = false,
    this.capacity = 10,
    this.currentBooked = 0,
    this.hasGuide = false,
    this.capacityError,
    this.saving = false,
    this.saveError,
    this.saved = false,
  });

  SchedulerState copyWith({
    bool? isEdit,
    int? capacity,
    int? currentBooked,
    bool? hasGuide,
    String? capacityError,
    bool? saving,
    String? saveError,
    bool? saved,
  }) =>
      SchedulerState(
        isEdit: isEdit ?? this.isEdit,
        capacity: capacity ?? this.capacity,
        currentBooked: currentBooked ?? this.currentBooked,
        hasGuide: hasGuide ?? this.hasGuide,
        capacityError: capacityError,
        saving: saving ?? this.saving,
        saveError: saveError,
        saved: saved ?? this.saved,
      );

  bool get canSave => capacityError == null && !saving;
  bool get notReadyToRun => !hasGuide; // UXD-06, non-blocking
}

class SchedulerCubit extends Cubit<SchedulerState> {
  final ApiClient api;
  SchedulerCubit(this.api) : super(const SchedulerState());

  void startCreate() => emit(const SchedulerState(isEdit: false, capacity: 10));

  void startEdit({required int capacity, required int currentBooked, required bool hasGuide}) =>
      emit(SchedulerState(isEdit: true, capacity: capacity, currentBooked: currentBooked, hasGuide: hasGuide));

  /// UXD-05 capacity guard.
  void setCapacity(int value) {
    String? err;
    if (value > 10) {
      err = 'A departure can hold at most 10 riders.';
    } else if (state.isEdit && value < state.currentBooked) {
      err = '${state.currentBooked} riders are already booked — capacity can\'t go below that.';
    }
    emit(state.copyWith(capacity: value, capacityError: err));
  }

  void setHasGuide(bool v) => emit(state.copyWith(hasGuide: v));

  // FINDING-001: createDeparture expects {tourId,date,time,capacity,guideId};
  // updateDeparture takes an editable subset. guideId is a real id or null.
  Future<void> save({
    required String tourId,
    required String date,
    required String time,
    String? guideId,
    String? departureId,
  }) async {
    if (!state.canSave) return;
    emit(state.copyWith(saving: true, saveError: null));
    try {
      if (state.isEdit && departureId != null) {
        await api.updateDeparture(departureId, {
          'capacity': state.capacity,
          'guideId': guideId,
        });
      } else {
        await api.createDeparture({
          'tourId': tourId,
          'date': date,
          'time': time,
          'capacity': state.capacity,
          'guideId': guideId,
        });
      }
      emit(state.copyWith(saving: false, saved: true));
    } catch (e) {
      emit(state.copyWith(saving: false, saveError: 'Save failed — please try again.'));
    }
  }

  Future<void> cancelDeparture(String departureId) async {
    emit(state.copyWith(saving: true, saveError: null));
    try {
      await api.cancelDeparture(departureId);
      emit(state.copyWith(saving: false, saved: true));
    } catch (e) {
      emit(state.copyWith(saving: false, saveError: 'Cancel failed — please try again.'));
    }
  }
}
