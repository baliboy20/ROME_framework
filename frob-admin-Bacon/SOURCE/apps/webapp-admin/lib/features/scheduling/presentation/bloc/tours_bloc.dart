import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/tour.dart';
import '../../domain/usecases/scheduling_usecases.dart';

sealed class ToursEvent extends Equatable {
  const ToursEvent();
  @override
  List<Object?> get props => [];
}

class LoadToursEvent extends ToursEvent {
  const LoadToursEvent();
}

sealed class ToursState extends Equatable {
  const ToursState();
  @override
  List<Object?> get props => [];
}

class ToursInitial extends ToursState {
  const ToursInitial();
}

class ToursLoading extends ToursState {
  const ToursLoading();
}

class ToursLoaded extends ToursState {
  final List<Tour> tours;
  const ToursLoaded(this.tours);
  @override
  List<Object?> get props => [tours];
}

class ToursLoadFailure extends ToursState {
  final String message;
  const ToursLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

/// A22 tour catalogue list. Create/edit/delete run through the editor dialog
/// (SaveTour/DeleteTour use cases); this bloc owns the list and reloads.
class ToursBloc extends Bloc<ToursEvent, ToursState> {
  final GetTours getTours;
  ToursBloc(this.getTours) : super(const ToursInitial()) {
    on<LoadToursEvent>((event, emit) async {
      emit(const ToursLoading());
      final result = await getTours(const NoParams());
      emit(result.fold((f) => ToursLoadFailure(f.message), (tours) => ToursLoaded(tours)));
    });
  }
}
