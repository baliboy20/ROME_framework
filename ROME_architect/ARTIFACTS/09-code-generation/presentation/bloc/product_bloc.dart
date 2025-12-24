import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/product_repository.dart';
import 'product_event.dart';
import 'product_state.dart';

/// BLoC: ProductBloc
/// Manages Product business logic and state
class ProductBloc extends Bloc<ProductEvent, ProductState> {
  final ProductRepository _repository;

  ProductBloc(this._repository) : super(const ProductInitialState()) {
    on<LoadProductsEvent>(_onLoadProducts);
    on<LoadProductByIdEvent>(_onLoadProductById);
    on<CreateProductEvent>(_onCreateProduct);
    on<UpdateProductEvent>(_onUpdateProduct);
    on<DeleteProductEvent>(_onDeleteProduct);
    on<SearchProductsEvent>(_onSearchProducts);
  }

  Future<void> _onLoadProducts(
    LoadProductsEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.getAll();
    
    result.fold(
      (items) => emit(ProductListLoadedState(items)),
      (error) => emit(ProductErrorState(error)),
    );
  }

  Future<void> _onLoadProductById(
    LoadProductByIdEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.getById(event.id);
    
    result.fold(
      (product) => emit(ProductLoadedState(product)),
      (error) => emit(ProductErrorState(error)),
    );
  }

  Future<void> _onCreateProduct(
    CreateProductEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.create(event.product);
    
    result.fold(
      (product) => emit(ProductSuccessState(
        'Product created successfully',
        product: product,
      )),
      (error) => emit(ProductErrorState(error)),
    );
  }

  Future<void> _onUpdateProduct(
    UpdateProductEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.update(event.product);
    
    result.fold(
      (product) => emit(ProductSuccessState(
        'Product updated successfully',
        product: product,
      )),
      (error) => emit(ProductErrorState(error)),
    );
  }

  Future<void> _onDeleteProduct(
    DeleteProductEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.delete(event.id);
    
    result.fold(
      (_) => emit(const ProductSuccessState('Product deleted successfully')),
      (error) => emit(ProductErrorState(error)),
    );
  }

  Future<void> _onSearchProducts(
    SearchProductsEvent event,
    Emitter<ProductState> emit,
  ) async {
    emit(const ProductLoadingState());
    
    final result = await _repository.search(event.query);
    
    result.fold(
      (items) => emit(ProductListLoadedState(items)),
      (error) => emit(ProductErrorState(error)),
    );
  }
}
