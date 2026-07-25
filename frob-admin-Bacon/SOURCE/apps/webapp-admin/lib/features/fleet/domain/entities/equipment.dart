import 'package:equatable/equatable.dart';

/// A13 equipment register item (FLEET02).
class Equipment extends Equatable {
  final String id;
  final String type;
  final String description;
  final String status;
  final String? reviewDueAt;

  const Equipment({
    required this.id,
    required this.type,
    required this.description,
    required this.status,
    this.reviewDueAt,
  });

  @override
  List<Object?> get props => [id, type, description, status, reviewDueAt];
}
