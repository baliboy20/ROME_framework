import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/usecases/fleet_usecases.dart';

// ---- events ----
sealed class AddBikeEvent extends Equatable {
  const AddBikeEvent();
  @override
  List<Object?> get props => [];
}

class LoadExistingBikesEvent extends AddBikeEvent {
  const LoadExistingBikesEvent();
}

class CheckBikeIdEvent extends AddBikeEvent {
  final String id;
  const CheckBikeIdEvent(this.id);
  @override
  List<Object?> get props => [id];
}

class SubmitBikeEvent extends AddBikeEvent {
  final String id;
  final String label;
  const SubmitBikeEvent(this.id, this.label);
  @override
  List<Object?> get props => [id, label];
}

// ---- state ----
class AddBikeState extends Equatable {
  final List<String> existingIds;
  final String? duplicateError;
  final String? suggestion;
  final bool saving;
  final bool added;

  const AddBikeState({
    this.existingIds = const [],
    this.duplicateError,
    this.suggestion,
    this.saving = false,
    this.added = false,
  });

  bool get canAdd => duplicateError == null && !saving;

  AddBikeState copyWith({
    List<String>? existingIds,
    String? duplicateError,
    String? suggestion,
    bool? saving,
    bool? added,
  }) =>
      AddBikeState(
        existingIds: existingIds ?? this.existingIds,
        duplicateError: duplicateError,
        suggestion: suggestion,
        saving: saving ?? this.saving,
        added: added ?? this.added,
      );

  @override
  List<Object?> get props => [existingIds, duplicateError, suggestion, saving, added];
}

// ---- bloc ----
/// A12 add-bike — duplicate guard (UXD-10).
class AddBikeBloc extends Bloc<AddBikeEvent, AddBikeState> {
  final GetFleet getFleet;
  final AddBike addBike;

  AddBikeBloc({required this.getFleet, required this.addBike}) : super(const AddBikeState()) {
    on<LoadExistingBikesEvent>(_onLoadExisting);
    on<CheckBikeIdEvent>(_onCheck);
    on<SubmitBikeEvent>(_onSubmit);
  }

  Future<void> _onLoadExisting(LoadExistingBikesEvent event, Emitter<AddBikeState> emit) async {
    final result = await getFleet(const NoParams());
    result.fold(
      (_) {}, // fleet listing failure shouldn't block the form itself
      (rows) => emit(state.copyWith(existingIds: rows.map((b) => b.id).toList())),
    );
  }

  void _onCheck(CheckBikeIdEvent event, Emitter<AddBikeState> emit) {
    final id = event.id;
    if (id.isEmpty) {
      emit(state.copyWith(duplicateError: null, suggestion: null));
      return;
    }
    if (state.existingIds.contains(id)) {
      final next = _nextSuggestion(id);
      emit(state.copyWith(duplicateError: '$id is already in use — next available is $next.', suggestion: next));
    } else {
      emit(state.copyWith(duplicateError: null, suggestion: null));
    }
  }

  String _nextSuggestion(String id) {
    final match = RegExp(r'^(.*?)(\d+)$').firstMatch(id);
    if (match == null) return '$id-2';
    final prefix = match.group(1)!;
    final numStr = match.group(2)!;
    var n = int.parse(numStr) + 1;
    var candidate = '$prefix${n.toString().padLeft(numStr.length, '0')}';
    while (state.existingIds.contains(candidate)) {
      n++;
      candidate = '$prefix${n.toString().padLeft(numStr.length, '0')}';
    }
    return candidate;
  }

  Future<void> _onSubmit(SubmitBikeEvent event, Emitter<AddBikeState> emit) async {
    if (!state.canAdd) return;
    emit(state.copyWith(saving: true));
    final result = await addBike(AddBikeParams(event.id, event.label));
    result.fold(
      (_) => emit(state.copyWith(saving: false)),
      (_) => emit(state.copyWith(saving: false, added: true, existingIds: [...state.existingIds, event.id])),
    );
  }
}
