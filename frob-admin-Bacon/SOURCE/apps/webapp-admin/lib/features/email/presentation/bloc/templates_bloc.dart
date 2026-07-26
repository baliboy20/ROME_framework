import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/email_entities.dart';
import '../../domain/usecases/email_usecases.dart';

sealed class TemplatesEvent extends Equatable {
  const TemplatesEvent();
  @override
  List<Object?> get props => [];
}

class LoadTemplatesEvent extends TemplatesEvent {
  const LoadTemplatesEvent();
}

sealed class TemplatesState extends Equatable {
  const TemplatesState();
  @override
  List<Object?> get props => [];
}

class TemplatesInitial extends TemplatesState {
  const TemplatesInitial();
}

class TemplatesLoading extends TemplatesState {
  const TemplatesLoading();
}

class TemplatesLoaded extends TemplatesState {
  final List<EmailTemplate> templates;
  const TemplatesLoaded(this.templates);
  @override
  List<Object?> get props => [templates];
}

class TemplatesFailure extends TemplatesState {
  final String message;
  const TemplatesFailure(this.message);
  @override
  List<Object?> get props => [message];
}

/// REQ-NOTIF10 template catalogue.
class TemplatesBloc extends Bloc<TemplatesEvent, TemplatesState> {
  final GetTemplates getTemplates;
  TemplatesBloc(this.getTemplates) : super(const TemplatesInitial()) {
    on<LoadTemplatesEvent>((event, emit) async {
      emit(const TemplatesLoading());
      final result = await getTemplates(const NoParams());
      emit(result.fold((f) => TemplatesFailure(f.message), (t) => TemplatesLoaded(t)));
    });
  }
}
