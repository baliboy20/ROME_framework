import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';

/// A12 add-bike — duplicate guard (UXD-10).
class AddBikeState {
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

  bool get canAdd => duplicateError == null && !saving;
}

class AddBikeCubit extends Cubit<AddBikeState> {
  final ApiClient api;
  AddBikeCubit(this.api) : super(const AddBikeState());

  /// Test/debug hook to seed known ids without a network round-trip.
  void seedExisting(List<String> ids) => emit(state.copyWith(existingIds: ids));

  Future<void> loadExisting() async {
    try {
      final data = await api.getFleet();
      final ids = data.map((j) => (j as Map<String, dynamic>)['id']?.toString() ?? '').toList();
      emit(state.copyWith(existingIds: ids));
    } catch (_) {
      // fleet listing failure shouldn't block the add-bike form itself
    }
  }

  /// UXD-10: duplicate identifier blocks Add and suggests the next sequential id.
  void checkId(String id) {
    if (id.isEmpty) {
      emit(state.copyWith(duplicateError: null, suggestion: null));
      return;
    }
    if (state.existingIds.contains(id)) {
      emit(state.copyWith(duplicateError: '$id is already in use — next available is ${_nextSuggestion(id)}.', suggestion: _nextSuggestion(id)));
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

  Future<void> addBike(String id, String label) async {
    if (!state.canAdd) return;
    emit(state.copyWith(saving: true));
    try {
      await api.addBike({'id': id, 'label': label});
      emit(state.copyWith(saving: false, added: true, existingIds: [...state.existingIds, id]));
    } catch (e) {
      emit(state.copyWith(saving: false));
    }
  }
}
