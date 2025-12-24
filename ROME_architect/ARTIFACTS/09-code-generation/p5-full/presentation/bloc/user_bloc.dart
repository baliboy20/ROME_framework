import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/user_repository.dart';
import 'user_event.dart';
import 'user_state.dart';

/// BLoC: UserBloc
/// Manages User business logic and state
class UserBloc extends Bloc<UserEvent, UserState> {
  final UserRepository _repository;

  UserBloc(this._repository) : super(const UserInitialState()) {
    on<LoadUsersEvent>(_onLoadUsers);
    on<LoadUserByIdEvent>(_onLoadUserById);
    on<CreateUserEvent>(_onCreateUser);
    on<UpdateUserEvent>(_onUpdateUser);
    on<DeleteUserEvent>(_onDeleteUser);
    on<SearchUsersEvent>(_onSearchUsers);
  }

  Future<void> _onLoadUsers(
    LoadUsersEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.getAll();
    
    result.fold(
      (items) => emit(UserListLoadedState(items)),
      (error) => emit(UserErrorState(error)),
    );
  }

  Future<void> _onLoadUserById(
    LoadUserByIdEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.getById(event.id);
    
    result.fold(
      (user) => emit(UserLoadedState(user)),
      (error) => emit(UserErrorState(error)),
    );
  }

  Future<void> _onCreateUser(
    CreateUserEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.create(event.user);
    
    result.fold(
      (user) => emit(UserSuccessState(
        'User created successfully',
        user: user,
      )),
      (error) => emit(UserErrorState(error)),
    );
  }

  Future<void> _onUpdateUser(
    UpdateUserEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.update(event.user);
    
    result.fold(
      (user) => emit(UserSuccessState(
        'User updated successfully',
        user: user,
      )),
      (error) => emit(UserErrorState(error)),
    );
  }

  Future<void> _onDeleteUser(
    DeleteUserEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.delete(event.id);
    
    result.fold(
      (_) => emit(const UserSuccessState('User deleted successfully')),
      (error) => emit(UserErrorState(error)),
    );
  }

  Future<void> _onSearchUsers(
    SearchUsersEvent event,
    Emitter<UserState> emit,
  ) async {
    emit(const UserLoadingState());
    
    final result = await _repository.search(event.query);
    
    result.fold(
      (items) => emit(UserListLoadedState(items)),
      (error) => emit(UserErrorState(error)),
    );
  }
}
