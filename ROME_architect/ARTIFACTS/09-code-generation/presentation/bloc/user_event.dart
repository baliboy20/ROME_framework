import 'package:equatable/equatable.dart';
import '../../../domain/entities/user.dart';

/// BLoC events for User
sealed class UserEvent extends Equatable {
  const UserEvent();

  @override
  List<Object?> get props => [];
}

/// Load all Users
class LoadUsersEvent extends UserEvent {
  const LoadUsersEvent();
}

/// Load User by ID
class LoadUserByIdEvent extends UserEvent {
  final String id;

  const LoadUserByIdEvent(this.id);

  @override
  List<Object?> get props => [id];
}

/// Create new User
class CreateUserEvent extends UserEvent {
  final User user;

  const CreateUserEvent(this.user);

  @override
  List<Object?> get props => [user];
}

/// Update existing User
class UpdateUserEvent extends UserEvent {
  final User user;

  const UpdateUserEvent(this.user);

  @override
  List<Object?> get props => [user];
}

/// Delete User by ID
class DeleteUserEvent extends UserEvent {
  final String id;

  const DeleteUserEvent(this.id);

  @override
  List<Object?> get props => [id];
}

/// Search Users
class SearchUsersEvent extends UserEvent {
  final Map<String, dynamic> query;

  const SearchUsersEvent(this.query);

  @override
  List<Object?> get props => [query];
}
