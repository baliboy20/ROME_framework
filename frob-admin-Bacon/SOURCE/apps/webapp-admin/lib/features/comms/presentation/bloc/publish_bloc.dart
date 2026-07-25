import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/content_snapshot.dart';
import '../../domain/usecases/comms_usecases.dart';

// ---- events ----
sealed class PublishEvent extends Equatable {
  const PublishEvent();
  @override
  List<Object?> get props => [];
}

class LoadContentEvent extends PublishEvent {
  const LoadContentEvent();
}

class PublishNowEvent extends PublishEvent {
  const PublishNowEvent();
}

// ---- states ----
sealed class PublishState extends Equatable {
  const PublishState();
  @override
  List<Object?> get props => [];
}

class PublishInitial extends PublishState {
  const PublishInitial();
}

class PublishLoading extends PublishState {
  const PublishLoading();
}

class PublishLoaded extends PublishState {
  final ContentSnapshot snapshot;
  final bool publishing;
  final String? notice; // success or failure message from a publish action
  const PublishLoaded(this.snapshot, {this.publishing = false, this.notice});

  PublishLoaded copyWith({bool? publishing, String? notice}) =>
      PublishLoaded(snapshot, publishing: publishing ?? this.publishing, notice: notice);

  @override
  List<Object?> get props => [snapshot, publishing, notice];
}

class PublishLoadFailure extends PublishState {
  final String message;
  const PublishLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

// ---- bloc ----
class PublishBloc extends Bloc<PublishEvent, PublishState> {
  final GetContent getContent;
  final Publish publish;

  PublishBloc({required this.getContent, required this.publish}) : super(const PublishInitial()) {
    on<LoadContentEvent>(_onLoad);
    on<PublishNowEvent>(_onPublish);
  }

  Future<void> _onLoad(LoadContentEvent event, Emitter<PublishState> emit) async {
    emit(const PublishLoading());
    final result = await getContent(const NoParams());
    emit(result.fold(
      (f) => PublishLoadFailure(f.message),
      (snapshot) => PublishLoaded(snapshot),
    ));
  }

  Future<void> _onPublish(PublishNowEvent event, Emitter<PublishState> emit) async {
    final s = state;
    if (s is! PublishLoaded) return;
    emit(s.copyWith(publishing: true));
    final result = await publish(const NoParams());
    await result.fold(
      (f) async => emit((state as PublishLoaded).copyWith(publishing: false, notice: 'Publish failed: ${f.message}')),
      (_) async {
        emit((state as PublishLoaded).copyWith(publishing: false, notice: 'Published successfully.'));
        add(const LoadContentEvent());
      },
    );
  }
}
