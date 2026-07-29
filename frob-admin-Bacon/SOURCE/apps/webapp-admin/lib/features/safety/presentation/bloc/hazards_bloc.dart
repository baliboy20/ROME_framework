import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/hazard.dart';
import '../../domain/usecases/safety_usecases.dart';

// ---- events ----
sealed class HazardsEvent extends Equatable {
  const HazardsEvent();
  @override
  List<Object?> get props => [];
}

class LoadHazardsEvent extends HazardsEvent {
  const LoadHazardsEvent();
}

class ApproveHazardEvent extends HazardsEvent {
  final String id;
  const ApproveHazardEvent(this.id);
  @override
  List<Object?> get props => [id];
}

// ---- states ----
sealed class HazardsState extends Equatable {
  const HazardsState();
  @override
  List<Object?> get props => [];
}

class HazardsInitial extends HazardsState {
  const HazardsInitial();
}

class HazardsLoading extends HazardsState {
  const HazardsLoading();
}

class HazardsLoaded extends HazardsState {
  final List<Hazard> rows;
  final String? actionError;
  const HazardsLoaded(this.rows, {this.actionError});
  @override
  List<Object?> get props => [rows, actionError];
}

class HazardsLoadFailure extends HazardsState {
  final String message;
  const HazardsLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// ---- bloc ----
class HazardsBloc extends Bloc<HazardsEvent, HazardsState> {
  final GetHazards getHazards;
  final ReviewHazard reviewHazard;

  HazardsBloc({required this.getHazards, required this.reviewHazard})
      : super(const HazardsInitial()) {
    on<LoadHazardsEvent>(_onLoad);
    on<ApproveHazardEvent>(_onApprove);
  }

  Future<void> _onLoad(LoadHazardsEvent event, Emitter<HazardsState> emit) async {
    emit(const HazardsLoading());
    final result = await getHazards(const NoParams());
    emit(result.fold(
      (f) => HazardsLoadFailure(f.message),
      (rows) => HazardsLoaded(rows),
    ));
  }

  Future<void> _onApprove(ApproveHazardEvent event, Emitter<HazardsState> emit) async {
    final result = await reviewHazard(ReviewHazardParams(event.id, 'approved'));
    await result.fold(
      (f) async {
        final s = state;
        if (s is HazardsLoaded) emit(HazardsLoaded(s.rows, actionError: f.message));
      },
      (_) async => add(const LoadHazardsEvent()),
    );
  }
}
