import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../types/result.dart';

/// Reusable event-driven Bloc for read-only list screens: dispatch [LoadList],
/// consume a `Result<List<T>>` from an injected loader, emit sealed states.
/// Feature-specific screens with actions get their own bespoke Bloc instead.
class LoadList extends Equatable {
  const LoadList();
  @override
  List<Object?> get props => [];
}

sealed class ListState<T> extends Equatable {
  const ListState();
  @override
  List<Object?> get props => [];
}

class ListInitial<T> extends ListState<T> {
  const ListInitial();
}

class ListLoading<T> extends ListState<T> {
  const ListLoading();
}

class ListLoaded<T> extends ListState<T> {
  final List<T> rows;
  const ListLoaded(this.rows);
  @override
  List<Object?> get props => [rows];
}

class ListFailure<T> extends ListState<T> {
  final String message;
  const ListFailure(this.message);
  @override
  List<Object?> get props => [message];
}

class ListBloc<T> extends Bloc<LoadList, ListState<T>> {
  final Future<Result<List<T>>> Function() loader;

  ListBloc(this.loader) : super(ListInitial<T>()) {
    on<LoadList>((event, emit) async {
      emit(ListLoading<T>());
      final result = await loader();
      emit(result.fold(
        (f) => ListFailure<T>(f.message),
        (rows) => ListLoaded<T>(rows),
      ));
    });
  }
}
