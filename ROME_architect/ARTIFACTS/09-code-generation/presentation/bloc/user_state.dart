import 'package:equatable/equatable.dart';
import '../../../domain/entities/user.dart';

/// BLoC states for User
sealed class UserState extends Equatable {
  const UserState();

  @override
  List<Object?> get props => [];
}

/// Initial state
final class UserInitialState extends UserState {
  const UserInitialState();
}

/// Loading state
final class UserLoadingState extends UserState {
  const UserLoadingState();
}

/// Loaded single User
final class UserLoadedState extends UserState {
  final User user;

  const UserLoadedState(this.user);

  @override
  List<Object?> get props => [user];
}

/// Loaded list of Users
final class UserListLoadedState extends UserState {
  final List<User> items;

  const UserListLoadedState(this.items);

  @override
  List<Object?> get props => [items];
}

/// Operation successful
final class UserSuccessState extends UserState {
  final String message;
  final User? user;

  const UserSuccessState(this.message, {this.user});

  @override
  List<Object?> get props => [message, user];
}

/// Error state
final class UserErrorState extends UserState {
  final String message;

  const UserErrorState(this.message);

  @override
  List<Object?> get props => [message];
}
