import 'package:equatable/equatable.dart';

abstract class TextEvent extends Equatable {
  const TextEvent();

  @override
  List<Object?> get props => [];
}

class TextSubmitted extends TextEvent {
  final String text;

  const TextSubmitted(this.text);

  @override
  List<Object?> get props => [text];
}

class TextChanged extends TextEvent {
  final String text;

  const TextChanged(this.text);

  @override
  List<Object?> get props => [text];
}