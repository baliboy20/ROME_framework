import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/operator_settings.dart';
import '../../domain/usecases/settings_usecases.dart';

// ---- events ----
sealed class SettingsEvent extends Equatable {
  const SettingsEvent();
  @override
  List<Object?> get props => [];
}

class LoadSettingsEvent extends SettingsEvent {
  const LoadSettingsEvent();
}

class SaveSettingsEvent extends SettingsEvent {
  final Map<String, dynamic> patch;
  const SaveSettingsEvent(this.patch);
  @override
  List<Object?> get props => [patch];
}

// ---- states ----
sealed class SettingsState extends Equatable {
  const SettingsState();
  @override
  List<Object?> get props => [];
}

class SettingsInitial extends SettingsState {
  const SettingsInitial();
}

class SettingsLoading extends SettingsState {
  const SettingsLoading();
}

class SettingsLoaded extends SettingsState {
  final OperatorSettings settings;
  final bool saving;
  final String? notice;
  const SettingsLoaded(this.settings, {this.saving = false, this.notice});

  SettingsLoaded copyWith({OperatorSettings? settings, bool? saving, String? notice}) =>
      SettingsLoaded(settings ?? this.settings, saving: saving ?? this.saving, notice: notice);

  @override
  List<Object?> get props => [settings, saving, notice];
}

class SettingsFailure extends SettingsState {
  final String message;
  const SettingsFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// ---- bloc ----
/// DR-16 Owner-configurable operational policy.
class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  final GetSettings getSettings;
  final UpdateSettings updateSettings;

  SettingsBloc({required this.getSettings, required this.updateSettings})
      : super(const SettingsInitial()) {
    on<LoadSettingsEvent>(_onLoad);
    on<SaveSettingsEvent>(_onSave);
  }

  Future<void> _onLoad(LoadSettingsEvent event, Emitter<SettingsState> emit) async {
    emit(const SettingsLoading());
    final result = await getSettings(const NoParams());
    emit(result.fold((f) => SettingsFailure(f.message), (s) => SettingsLoaded(s)));
  }

  Future<void> _onSave(SaveSettingsEvent event, Emitter<SettingsState> emit) async {
    final s = state;
    if (s is! SettingsLoaded) return;
    emit(s.copyWith(saving: true, notice: null));
    final result = await updateSettings(event.patch);
    emit(result.fold(
      (f) => (state as SettingsLoaded).copyWith(saving: false, notice: 'Could not save: ${f.message}'),
      (settings) => SettingsLoaded(settings, saving: false, notice: 'Settings saved.'),
    ));
  }
}
