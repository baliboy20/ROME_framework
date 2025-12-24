import '../entities/product.dart';
import '../value_objects/result.dart';

/// Repository interface: ProductRepository
/// Defines data access contract for Product entity
abstract class ProductRepository {
  /// Create a new Product
  Future<Result<Product>> create(Product product);

  /// Get Product by ID
  Future<Result<Product>> getById(String id);

  /// Get all Products
  Future<Result<List<Product>>> getAll();

  /// Update existing Product
  Future<Result<Product>> update(Product product);

  /// Delete Product by ID
  Future<Result<void>> delete(String id);

  /// Search Products by query
  Future<Result<List<Product>>> search(Map<String, dynamic> query);
}
