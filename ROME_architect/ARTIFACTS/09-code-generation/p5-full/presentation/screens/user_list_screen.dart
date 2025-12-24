import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/user/user_bloc.dart';
import '../../bloc/user/user_event.dart';
import '../../bloc/user/user_state.dart';

/// Screen: UserListScreen
/// Displays list of Users
class UserListScreen extends StatelessWidget {
  const UserListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Users'),
      ),
      body: BlocBuilder<UserBloc, UserState>(
        builder: (context, state) {
          return switch (state) {
            UserInitialState() => _buildInitial(context),
            UserLoadingState() => _buildLoading(),
            UserListLoadedState() => _buildList(state.items),
            UserErrorState() => _buildError(state.message),
            _ => _buildInitial(context),
          };
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create user screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildInitial(BuildContext context) {
    context.read<UserBloc>().add(const LoadUsersEvent());
    return _buildLoading();
  }

  Widget _buildLoading() {
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildList(List items) {
    if (items.isEmpty) {
      return const Center(
        child: Text('No Users found'),
      );
    }

    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final user = items[index];
        return ListTile(
          title: Text(user.id),
          onTap: () {
            // TODO: Navigate to detail screen
          },
        );
      },
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Error: $message'),
          ElevatedButton(
            onPressed: () {},
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
