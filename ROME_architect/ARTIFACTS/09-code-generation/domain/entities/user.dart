import 'package:equatable/equatable.dart';

/// Domain entity: User
/// User domain entity
class User extends Equatable {
  final String id;
  final String email;
  final String username;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.username,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, email, username, createdAt];

  User copyWith({
    String? id,
    String? email,
    String? username,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
