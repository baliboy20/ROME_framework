import 'package:equatable/equatable.dart';

/// Domain entity: Product
/// Product domain entity
class Product extends Equatable {
  final String id;
  final String name;
  final double price;
  final String? description;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.description,
  });

  @override
  List<Object?> get props => [id, name, price, description];

  Product copyWith({
    String? id,
    String? name,
    double? price,
    String? description,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      description: description ?? this.description,
    );
  }
}
