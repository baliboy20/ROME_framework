import '../entities/user.dart';
import '../value_objects/result.dart';

/// Repository interface: UserRepository
/// Defines data access contract for User entity
abstract class UserRepository {
  /// Create a new User
  Future<Result<User>> create(User user);

  /// Get User by ID
  Future<Result<User>> getById(String id);

  /// Get all Users
  Future<Result<List<User>>> getAll();

  /// Update existing User
  Future<Result<User>> update(User user);

  /// Delete User by ID
  Future<Result<void>> delete(String id);

  /// Search Users by query
  Future<Result<List<User>>> search(Map<String, dynamic> query);
}
