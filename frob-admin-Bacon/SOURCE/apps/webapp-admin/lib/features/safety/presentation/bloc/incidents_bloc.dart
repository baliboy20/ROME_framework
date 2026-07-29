import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/incident.dart';
import '../../domain/usecases/safety_usecases.dart';

// ---- events ----
sealed class IncidentsEvent extends Equatable {
  const IncidentsEvent();
  @override
  List<Object?> get props => [];
}

class LoadIncidentsEvent extends IncidentsEvent {
  const LoadIncidentsEvent();
}

class DispatchIncidentEvent extends IncidentsEvent {
  final String id;
  const DispatchIncidentEvent(this.id);
  @override
  List<Object?> get props => [id];
}

// ---- states ----
sealed class IncidentsState extends Equatable {
  const IncidentsState();
  @override
  List<Object?> get props => [];
}

class IncidentsInitial extends IncidentsState {
  const IncidentsInitial();
}

class IncidentsLoading extends IncidentsState {
  const IncidentsLoading();
}

class IncidentsLoaded extends IncidentsState {
  final List<Incident> rows;
  final String? actionError;
  const IncidentsLoaded(this.rows, {this.actionError});
  @override
  List<Object?> get props => [rows, actionError];
}

class IncidentsLoadFailure extends IncidentsState {
  final String message;
  const IncidentsLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// ---- bloc ----
class IncidentsBloc extends Bloc<IncidentsEvent, IncidentsState> {
  final GetIncidents getIncidents;
  final DispatchIncident dispatchIncident;

  IncidentsBloc({required this.getIncidents, required this.dispatchIncident})
      : super(const IncidentsInitial()) {
    on<LoadIncidentsEvent>(_onLoad);
    on<DispatchIncidentEvent>(_onDispatch);
  }

  Future<void> _onLoad(LoadIncidentsEvent event, Emitter<IncidentsState> emit) async {
    emit(const IncidentsLoading());
    final result = await getIncidents(const NoParams());
    emit(result.fold(
      (f) => IncidentsLoadFailure(f.message),
      (rows) => IncidentsLoaded(rows),
    ));
  }

  Future<void> _onDispatch(DispatchIncidentEvent event, Emitter<IncidentsState> emit) async {
    final result = await dispatchIncident(event.id);
    await result.fold(
      (f) async {
        final s = state;
        if (s is IncidentsLoaded) emit(IncidentsLoaded(s.rows, actionError: f.message));
      },
      (_) async => add(const LoadIncidentsEvent()),
    );
  }
}
