import 'package:equatable/equatable.dart';

class TextResult extends Equatable {
  final String originalText;
  final String reversedText;
  final DateTime timestamp;

  const TextResult({
    required this.originalText,
    required this.reversedText,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [originalText, reversedText, timestamp];
}