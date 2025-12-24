import 'package:equatable/equatable.dart';
import '../../../domain/entities/product.dart';

/// BLoC states for Product
sealed class ProductState extends Equatable {
  const ProductState();

  @override
  List<Object?> get props => [];
}

/// Initial state
final class ProductInitialState extends ProductState {
  const ProductInitialState();
}

/// Loading state
final class ProductLoadingState extends ProductState {
  const ProductLoadingState();
}

/// Loaded single Product
final class ProductLoadedState extends ProductState {
  final Product product;

  const ProductLoadedState(this.product);

  @override
  List<Object?> get props => [product];
}

/// Loaded list of Products
final class ProductListLoadedState extends ProductState {
  final List<Product> items;

  const ProductListLoadedState(this.items);

  @override
  List<Object?> get props => [items];
}

/// Operation successful
final class ProductSuccessState extends ProductState {
  final String message;
  final Product? product;

  const ProductSuccessState(this.message, {this.product});

  @override
  List<Object?> get props => [message, product];
}

/// Error state
final class ProductErrorState extends ProductState {
  final String message;

  const ProductErrorState(this.message);

  @override
  List<Object?> get props => [message];
}
