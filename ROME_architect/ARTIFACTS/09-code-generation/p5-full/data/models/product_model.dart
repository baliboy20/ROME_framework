import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import '../../domain/entities/product.dart';

/// Parse model: ProductModel
/// Maps Product domain entity to Parse Server
class ProductModel extends ParseObject implements ParseCloneable {
  ProductModel() : super('Product');
  ProductModel.clone() : this();

  @override
  ProductModel clone(Map<String, dynamic> map) => ProductModel.clone()..fromJson(map);

  String? get id => get<String>('id');
  set id(String? value) => set<String>('id', value);

  String? get name => get<String>('name');
  set name(String? value) => set<String>('name', value);

  double? get price => get<double>('price');
  set price(double? value) => set<double>('price', value);

  String? get description => get<String>('description');
  set description(String? value) => set<String>('description', value);

  /// Convert Parse model to domain entity
  Product toEntity() {
    return Product(
      id: id ?? '',
      name: name ?? '',
      price: price ?? 0.0,
      description: description ?? null,
    );
  }

  /// Create Parse model from domain entity
  static ProductModel fromEntity(Product entity) {
    final model = ProductModel();
    model.id = entity.id;
    model.name = entity.name;
    model.price = entity.price;
    model.description = entity.description;
    return model;
  }
}
