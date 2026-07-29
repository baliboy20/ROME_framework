import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/email_entities.dart';
import '../../domain/usecases/email_usecases.dart';

sealed class ArchiveEvent extends Equatable {
  const ArchiveEvent();
  @override
  List<Object?> get props => [];
}

class LoadArchiveEvent extends ArchiveEvent {
  final String query;
  const LoadArchiveEvent([this.query = '']);
  @override
  List<Object?> get props => [query];
}

sealed class ArchiveState extends Equatable {
  const ArchiveState();
  @override
  List<Object?> get props => [];
}

class ArchiveInitial extends ArchiveState {
  const ArchiveInitial();
}

class ArchiveLoading extends ArchiveState {
  const ArchiveLoading();
}

class ArchiveLoaded extends ArchiveState {
  final ArchiveResults results;
  final String query;
  const ArchiveLoaded(this.results, {this.query = ''});
  @override
  List<Object?> get props => [results, query];
}

class ArchiveFailure extends ArchiveState {
  final String message;
  const ArchiveFailure(this.message);
  @override
  List<Object?> get props => [message];
}

/// A5b email archive search (REQ-NOTIF06).
class ArchiveBloc extends Bloc<ArchiveEvent, ArchiveState> {
  final SearchArchive searchArchive;
  ArchiveBloc(this.searchArchive) : super(const ArchiveInitial()) {
    on<LoadArchiveEvent>((event, emit) async {
      emit(const ArchiveLoading());
      final result = await searchArchive(event.query);
      emit(result.fold(
        (f) => ArchiveFailure(f.message),
        (r) => ArchiveLoaded(r, query: event.query),
      ));
    });
  }
}
