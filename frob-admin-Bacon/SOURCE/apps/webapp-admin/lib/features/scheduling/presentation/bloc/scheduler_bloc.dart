import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/lookups.dart';
import '../../domain/entities/tour.dart';
import '../../domain/usecases/scheduling_usecases.dart';

// ---- events ----
sealed class SchedulerEvent extends Equatable {
  const SchedulerEvent();
  @override
  List<Object?> get props => [];
}

class LoadSchedulerEvent extends SchedulerEvent {
  const LoadSchedulerEvent();
}

class SelectDepartureForEditEvent extends SchedulerEvent {
  final String? departureId; // null => new departure
  const SelectDepartureForEditEvent(this.departureId);
  @override
  List<Object?> get props => [departureId];
}

class SetTourEvent extends SchedulerEvent {
  final String? tourId;
  const SetTourEvent(this.tourId);
  @override
  List<Object?> get props => [tourId];
}

class SetGuideEvent extends SchedulerEvent {
  final String? guideId;
  const SetGuideEvent(this.guideId);
  @override
  List<Object?> get props => [guideId];
}

class SetCapacityEvent extends SchedulerEvent {
  final int value;
  const SetCapacityEvent(this.value);
  @override
  List<Object?> get props => [value];
}

class SaveDepartureFormEvent extends SchedulerEvent {
  final String date;
  final String time;
  const SaveDepartureFormEvent({required this.date, required this.time});
  @override
  List<Object?> get props => [date, time];
}

class CancelDepartureFormEvent extends SchedulerEvent {
  const CancelDepartureFormEvent();
}

// ---- state ----
class SchedulerState extends Equatable {
  final List<DepartureEditOption> departures;
  final List<GuideOption> guides;
  final List<Tour> tours;

  final bool isEdit;
  final String? editingId;
  final String? tourId;
  final String? guideId;
  final int capacity;
  final int currentBooked;
  final bool hasGuide;
  final String? capacityError;
  final bool saving;
  final String? saveError;
  final bool saved;

  const SchedulerState({
    this.departures = const [],
    this.guides = const [],
    this.tours = const [],
    this.isEdit = false,
    this.editingId,
    this.tourId,
    this.guideId,
    this.capacity = 10,
    this.currentBooked = 0,
    this.hasGuide = false,
    this.capacityError,
    this.saving = false,
    this.saveError,
    this.saved = false,
  });

  bool get canSave => capacityError == null && !saving;
  bool get notReadyToRun => !hasGuide; // UXD-06, non-blocking
  List<Tour> get publishedTours => tours.where((t) => t.isPublished).toList();

  SchedulerState copyWith({
    List<DepartureEditOption>? departures,
    List<GuideOption>? guides,
    List<Tour>? tours,
    bool? isEdit,
    String? editingId,
    String? tourId,
    String? guideId,
    int? capacity,
    int? currentBooked,
    bool? hasGuide,
    String? capacityError,
    bool? saving,
    String? saveError,
    bool? saved,
    bool clearEditingId = false,
  }) =>
      SchedulerState(
        departures: departures ?? this.departures,
        guides: guides ?? this.guides,
        tours: tours ?? this.tours,
        isEdit: isEdit ?? this.isEdit,
        editingId: clearEditingId ? null : (editingId ?? this.editingId),
        tourId: tourId ?? this.tourId,
        guideId: guideId ?? this.guideId,
        capacity: capacity ?? this.capacity,
        currentBooked: currentBooked ?? this.currentBooked,
        hasGuide: hasGuide ?? this.hasGuide,
        capacityError: capacityError,
        saving: saving ?? this.saving,
        saveError: saveError,
        saved: saved ?? this.saved,
      );

  @override
  List<Object?> get props => [
        departures, guides, tours, isEdit, editingId, tourId, guideId, capacity,
        currentBooked, hasGuide, capacityError, saving, saveError, saved,
      ];
}

// ---- bloc ----
/// A18 scheduler — capacity guard (UXD-05), fan-out confirms (UXD-03/04),
/// no-guide non-blocking note (UXD-06).
class SchedulerBloc extends Bloc<SchedulerEvent, SchedulerState> {
  final GetDepartures getDepartures;
  final GetGuides getGuides;
  final GetTours getTours;
  final SaveDeparture saveDeparture;
  final CancelDeparture cancelDeparture;

  SchedulerBloc({
    required this.getDepartures,
    required this.getGuides,
    required this.getTours,
    required this.saveDeparture,
    required this.cancelDeparture,
  }) : super(const SchedulerState()) {
    on<LoadSchedulerEvent>(_onLoad);
    on<SelectDepartureForEditEvent>(_onSelect);
    on<SetTourEvent>((e, emit) => emit(state.copyWith(tourId: e.tourId)));
    on<SetGuideEvent>((e, emit) => emit(state.copyWith(guideId: e.guideId, hasGuide: e.guideId != null)));
    on<SetCapacityEvent>(_onCapacity);
    on<SaveDepartureFormEvent>(_onSave);
    on<CancelDepartureFormEvent>(_onCancel);
  }

  Future<void> _onLoad(LoadSchedulerEvent event, Emitter<SchedulerState> emit) async {
    final deps = await getDepartures(const NoParams());
    final guides = await getGuides(const NoParams());
    final tours = await getTours(const NoParams());
    emit(state.copyWith(
      departures: deps.valueOrNull ?? const [],
      guides: guides.valueOrNull ?? const [],
      tours: tours.valueOrNull ?? const [],
    ));
  }

  void _onSelect(SelectDepartureForEditEvent event, Emitter<SchedulerState> emit) {
    if (event.departureId == null) {
      emit(state.copyWith(
        isEdit: false, clearEditingId: true, capacity: 10, currentBooked: 0,
        hasGuide: false, guideId: null, saved: false, capacityError: null,
      ));
      return;
    }
    final dep = state.departures.where((d) => d.id == event.departureId).firstOrNull;
    if (dep == null) return;
    emit(state.copyWith(
      isEdit: true,
      editingId: dep.id,
      tourId: dep.tourId,
      guideId: dep.guideId,
      capacity: dep.capacity,
      currentBooked: dep.confirmedCount,
      hasGuide: dep.guideId != null,
      capacityError: null,
      saved: false,
    ));
  }

  void _onCapacity(SetCapacityEvent event, Emitter<SchedulerState> emit) {
    // UXD-05 capacity guard.
    String? err;
    if (event.value > 10) {
      err = 'A departure can hold at most 10 riders.';
    } else if (state.isEdit && event.value < state.currentBooked) {
      err = "${state.currentBooked} riders are already booked — capacity can't go below that.";
    }
    emit(state.copyWith(capacity: event.value, capacityError: err));
  }

  Future<void> _onSave(SaveDepartureFormEvent event, Emitter<SchedulerState> emit) async {
    if (!state.canSave) return;
    emit(state.copyWith(saving: true, saveError: null, saved: false));
    final Map<String, dynamic> body = state.isEdit
        ? {'capacity': state.capacity, 'guideId': state.guideId}
        : {
            'tourId': state.tourId ?? '',
            'date': event.date,
            'time': event.time,
            'capacity': state.capacity,
            'guideId': state.guideId,
          };
    final result = await saveDeparture(SaveDepartureParams(departureId: state.isEdit ? state.editingId : null, body: body));
    emit(result.fold(
      (f) => state.copyWith(saving: false, saveError: 'Save failed — please try again.'),
      (_) => state.copyWith(saving: false, saved: true),
    ));
  }

  Future<void> _onCancel(CancelDepartureFormEvent event, Emitter<SchedulerState> emit) async {
    final id = state.editingId;
    if (id == null) return;
    emit(state.copyWith(saving: true, saveError: null));
    final result = await cancelDeparture(id);
    emit(result.fold(
      (f) => state.copyWith(saving: false, saveError: 'Cancel failed — please try again.'),
      (_) => state.copyWith(saving: false, saved: true),
    ));
  }
}
