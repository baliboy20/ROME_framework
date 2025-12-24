import 'package:equatable/equatable.dart';
import '../../../domain/entities/product.dart';

/// BLoC events for Product
sealed class ProductEvent extends Equatable {
  const ProductEvent();

  @override
  List<Object?> get props => [];
}

/// Load all Products
class LoadProductsEvent extends ProductEvent {
  const LoadProductsEvent();
}

/// Load Product by ID
class LoadProductByIdEvent extends ProductEvent {
  final String id;

  const LoadProductByIdEvent(this.id);

  @override
  List<Object?> get props => [id];
}

/// Create new Product
class CreateProductEvent extends ProductEvent {
  final Product product;

  const CreateProductEvent(this.product);

  @override
  List<Object?> get props => [product];
}

/// Update existing Product
class UpdateProductEvent extends ProductEvent {
  final Product product;

  const UpdateProductEvent(this.product);

  @override
  List<Object?> get props => [product];
}

/// Delete Product by ID
class DeleteProductEvent extends ProductEvent {
  final String id;

  const DeleteProductEvent(this.id);

  @override
  List<Object?> get props => [id];
}

/// Search Products
class SearchProductsEvent extends ProductEvent {
  final Map<String, dynamic> query;

  const SearchProductsEvent(this.query);

  @override
  List<Object?> get props => [query];
}
