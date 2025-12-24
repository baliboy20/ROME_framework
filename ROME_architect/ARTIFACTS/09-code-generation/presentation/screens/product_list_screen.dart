import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../bloc/product/product_bloc.dart';
import '../../bloc/product/product_event.dart';
import '../../bloc/product/product_state.dart';

/// Screen: ProductListScreen
/// Displays list of Products
class ProductListScreen extends StatelessWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
      ),
      body: BlocBuilder<ProductBloc, ProductState>(
        builder: (context, state) {
          return switch (state) {
            ProductInitialState() => _buildInitial(context),
            ProductLoadingState() => _buildLoading(),
            ProductListLoadedState() => _buildList(state.items),
            ProductErrorState() => _buildError(state.message),
            _ => _buildInitial(context),
          };
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create product screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildInitial(BuildContext context) {
    context.read<ProductBloc>().add(const LoadProductsEvent());
    return _buildLoading();
  }

  Widget _buildLoading() {
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildList(List items) {
    if (items.isEmpty) {
      return const Center(
        child: Text('No Products found'),
      );
    }

    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final product = items[index];
        return ListTile(
          title: Text(product.id),
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
