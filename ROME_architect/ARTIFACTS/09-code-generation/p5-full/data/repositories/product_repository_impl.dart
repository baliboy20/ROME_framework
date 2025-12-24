import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/product_repository.dart';
import '../../domain/value_objects/result.dart';
import '../models/product_model.dart';

/// Repository implementation: ProductRepositoryImpl
/// Implements ProductRepository using Parse Server SDK
class ProductRepositoryImpl implements ProductRepository {
  @override
  Future<Result<Product>> create(Product product) async {
    try {
      final model = ProductModel.fromEntity(product);
      final response = await model.save();
      
      if (response.success && response.result != null) {
        final saved = response.result as ProductModel;
        return Success(saved.toEntity());
      }
      
      return Error(response.error?.message ?? 'Failed to create Product');
    } catch (e) {
      return Error('Exception creating Product: $e');
    }
  }

  @override
  Future<Result<Product>> getById(String id) async {
    try {
      final query = QueryBuilder<ProductModel>(ProductModel())
        ..whereEqualTo('objectId', id);
      
      final response = await query.query();
      
      if (response.success && response.results != null && response.results!.isNotEmpty) {
        final model = response.results!.first as ProductModel;
        return Success(model.toEntity());
      }
      
      return Error('Product not found');
    } catch (e) {
      return Error('Exception getting Product: $e');
    }
  }

  @override
  Future<Result<List<Product>>> getAll() async {
    try {
      final query = QueryBuilder<ProductModel>(ProductModel());
      final response = await query.query();
      
      if (response.success && response.results != null) {
        final entities = response.results!
          .cast<ProductModel>()
          .map((model) => model.toEntity())
          .toList();
        return Success(entities);
      }
      
      return Error(response.error?.message ?? 'Failed to get Products');
    } catch (e) {
      return Error('Exception getting Products: $e');
    }
  }

  @override
  Future<Result<Product>> update(Product product) async {
    try {
      final model = ProductModel.fromEntity(product);
      final response = await model.save();
      
      if (response.success && response.result != null) {
        final updated = response.result as ProductModel;
        return Success(updated.toEntity());
      }
      
      return Error(response.error?.message ?? 'Failed to update Product');
    } catch (e) {
      return Error('Exception updating Product: $e');
    }
  }

  @override
  Future<Result<void>> delete(String id) async {
    try {
      final model = ProductModel()..objectId = id;
      final response = await model.delete();
      
      if (response.success) {
        return const Success(null);
      }
      
      return Error(response.error?.message ?? 'Failed to delete Product');
    } catch (e) {
      return Error('Exception deleting Product: $e');
    }
  }

  @override
  Future<Result<List<Product>>> search(Map<String, dynamic> query) async {
    try {
      final queryBuilder = QueryBuilder<ProductModel>(ProductModel());
      
      // Apply query parameters
      query.forEach((key, value) {
        queryBuilder.whereEqualTo(key, value);
      });
      
      final response = await queryBuilder.query();
      
      if (response.success && response.results != null) {
        final entities = response.results!
          .cast<ProductModel>()
          .map((model) => model.toEntity())
          .toList();
        return Success(entities);
      }
      
      return Error(response.error?.message ?? 'Search failed');
    } catch (e) {
      return Error('Exception searching Products: $e');
    }
  }
}
