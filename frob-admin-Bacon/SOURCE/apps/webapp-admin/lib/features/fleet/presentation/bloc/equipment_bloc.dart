import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/equipment.dart';
import '../../domain/usecases/fleet_usecases.dart';

sealed class EquipmentEvent extends Equatable {
  const EquipmentEvent();
  @override
  List<Object?> get props => [];
}

class LoadEquipmentEvent extends EquipmentEvent {
  const LoadEquipmentEvent();
}

class AddEquipmentEvent extends EquipmentEvent {
  final String type;
  final String description;
  const AddEquipmentEvent(this.type, this.description);
  @override
  List<Object?> get props => [type, description];
}

sealed class EquipmentState extends Equatable {
  const EquipmentState();
  @override
  List<Object?> get props => [];
}

class EquipmentInitial extends EquipmentState {
  const EquipmentInitial();
}

class EquipmentLoading extends EquipmentState {
  const EquipmentLoading();
}

class EquipmentLoaded extends EquipmentState {
  final List<Equipment> rows;
  final String? actionError;
  const EquipmentLoaded(this.rows, {this.actionError});
  @override
  List<Object?> get props => [rows, actionError];
}

class EquipmentLoadFailure extends EquipmentState {
  final String message;
  const EquipmentLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

class EquipmentBloc extends Bloc<EquipmentEvent, EquipmentState> {
  final GetEquipment getEquipment;
  final AddEquipment addEquipment;

  EquipmentBloc({required this.getEquipment, required this.addEquipment})
      : super(const EquipmentInitial()) {
    on<LoadEquipmentEvent>(_onLoad);
    on<AddEquipmentEvent>(_onAdd);
  }

  Future<void> _onLoad(LoadEquipmentEvent event, Emitter<EquipmentState> emit) async {
    emit(const EquipmentLoading());
    final result = await getEquipment(const NoParams());
    emit(result.fold((f) => EquipmentLoadFailure(f.message), (rows) => EquipmentLoaded(rows)));
  }

  Future<void> _onAdd(AddEquipmentEvent event, Emitter<EquipmentState> emit) async {
    final desc = event.description.trim();
    if (desc.isEmpty) return;
    final today = DateTime.now().toUtc().toIso8601String().substring(0, 10);
    final result = await addEquipment(AddEquipmentParams(event.type, desc, today));
    await result.fold(
      (f) async {
        final s = state;
        if (s is EquipmentLoaded) emit(EquipmentLoaded(s.rows, actionError: f.message));
      },
      (_) async => add(const LoadEquipmentEvent()),
    );
  }
}
