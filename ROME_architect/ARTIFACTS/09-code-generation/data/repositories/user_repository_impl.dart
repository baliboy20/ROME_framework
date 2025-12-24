import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/user_repository.dart';
import '../../domain/value_objects/result.dart';
import '../models/user_model.dart';

/// Repository implementation: UserRepositoryImpl
/// Implements UserRepository using Parse Server SDK
class UserRepositoryImpl implements UserRepository {
  @override
  Future<Result<User>> create(User user) async {
    try {
      final model = UserModel.fromEntity(user);
      final response = await model.save();
      
      if (response.success && response.result != null) {
        final saved = response.result as UserModel;
        return Success(saved.toEntity());
      }
      
      return Error(response.error?.message ?? 'Failed to create User');
    } catch (e) {
      return Error('Exception creating User: $e');
    }
  }

  @override
  Future<Result<User>> getById(String id) async {
    try {
      final query = QueryBuilder<UserModel>(UserModel())
        ..whereEqualTo('objectId', id);
      
      final response = await query.query();
      
      if (response.success && response.results != null && response.results!.isNotEmpty) {
        final model = response.results!.first as UserModel;
        return Success(model.toEntity());
      }
      
      return Error('User not found');
    } catch (e) {
      return Error('Exception getting User: $e');
    }
  }

  @override
  Future<Result<List<User>>> getAll() async {
    try {
      final query = QueryBuilder<UserModel>(UserModel());
      final response = await query.query();
      
      if (response.success && response.results != null) {
        final entities = response.results!
          .cast<UserModel>()
          .map((model) => model.toEntity())
          .toList();
        return Success(entities);
      }
      
      return Error(response.error?.message ?? 'Failed to get Users');
    } catch (e) {
      return Error('Exception getting Users: $e');
    }
  }

  @override
  Future<Result<User>> update(User user) async {
    try {
      final model = UserModel.fromEntity(user);
      final response = await model.save();
      
      if (response.success && response.result != null) {
        final updated = response.result as UserModel;
        return Success(updated.toEntity());
      }
      
      return Error(response.error?.message ?? 'Failed to update User');
    } catch (e) {
      return Error('Exception updating User: $e');
    }
  }

  @override
  Future<Result<void>> delete(String id) async {
    try {
      final model = UserModel()..objectId = id;
      final response = await model.delete();
      
      if (response.success) {
        return const Success(null);
      }
      
      return Error(response.error?.message ?? 'Failed to delete User');
    } catch (e) {
      return Error('Exception deleting User: $e');
    }
  }

  @override
  Future<Result<List<User>>> search(Map<String, dynamic> query) async {
    try {
      final queryBuilder = QueryBuilder<UserModel>(UserModel());
      
      // Apply query parameters
      query.forEach((key, value) {
        queryBuilder.whereEqualTo(key, value);
      });
      
      final response = await queryBuilder.query();
      
      if (response.success && response.results != null) {
        final entities = response.results!
          .cast<UserModel>()
          .map((model) => model.toEntity())
          .toList();
        return Success(entities);
      }
      
      return Error(response.error?.message ?? 'Search failed');
    } catch (e) {
      return Error('Exception searching Users: $e');
    }
  }
}
