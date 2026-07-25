import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/fleet_readiness.dart';
import '../../domain/usecases/fleet_usecases.dart';

class LoadReadiness extends Equatable {
  const LoadReadiness();
  @override
  List<Object?> get props => [];
}

sealed class ReadinessState extends Equatable {
  const ReadinessState();
  @override
  List<Object?> get props => [];
}

class ReadinessInitial extends ReadinessState {
  const ReadinessInitial();
}

class ReadinessLoading extends ReadinessState {
  const ReadinessLoading();
}

class ReadinessLoaded extends ReadinessState {
  final FleetReadiness readiness;
  const ReadinessLoaded(this.readiness);
  @override
  List<Object?> get props => [readiness];
}

class ReadinessFailure extends ReadinessState {
  final String message;
  const ReadinessFailure(this.message);
  @override
  List<Object?> get props => [message];
}

/// A14 / FLEET03 readiness dashboard.
class ReadinessBloc extends Bloc<LoadReadiness, ReadinessState> {
  final GetFleetReadiness getFleetReadiness;

  ReadinessBloc(this.getFleetReadiness) : super(const ReadinessInitial()) {
    on<LoadReadiness>((event, emit) async {
      emit(const ReadinessLoading());
      final result = await getFleetReadiness(const NoParams());
      emit(result.fold((f) => ReadinessFailure(f.message), (r) => ReadinessLoaded(r)));
    });
  }
}
