import 'package:equatable/equatable.dart';
import '../../../domain/entities/text_result.dart';

abstract class TextState extends Equatable {
  const TextState();

  @override
  List<Object?> get props => [];
}

class TextInitial extends TextState {
  final List<TextResult> results;
  final bool isInputEmpty;
  final int characterCount;

  const TextInitial({
    this.results = const [],
    this.isInputEmpty = true,
    this.characterCount = 0,
  });

  @override
  List<Object?> get props => [results, isInputEmpty, characterCount];
}

class TextLoading extends TextState {
  final List<TextResult> results;

  const TextLoading({required this.results});

  @override
  List<Object?> get props => [results];
}

class TextSuccess extends TextState {
  final List<TextResult> results;

  const TextSuccess({required this.results});

  @override
  List<Object?> get props => [results];
}

class TextFailure extends TextState {
  final String errorMessage;
  final List<TextResult> results;

  const TextFailure({
    required this.errorMessage,
    required this.results,
  });

  @override
  List<Object?> get props => [errorMessage, results];
}

class TextValidation extends TextState {
  final String validationMessage;
  final List<TextResult> results;
  final int characterCount;

  const TextValidation({
    required this.validationMessage,
    required this.results,
    required this.characterCount,
  });

  @override
  List<Object?> get props => [validationMessage, results, characterCount];
}