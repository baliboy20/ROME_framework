import 'package:parse_server_sdk_flutter/parse_server_sdk_flutter.dart';
import '../../domain/entities/user.dart';

/// Parse model: UserModel
/// Maps User domain entity to Parse Server
class UserModel extends ParseObject implements ParseCloneable {
  UserModel() : super('User');
  UserModel.clone() : this();

  @override
  UserModel clone(Map<String, dynamic> map) => UserModel.clone()..fromJson(map);

  String? get id => get<String>('id');
  set id(String? value) => set<String>('id', value);

  String? get email => get<String>('email');
  set email(String? value) => set<String>('email', value);

  String? get username => get<String>('username');
  set username(String? value) => set<String>('username', value);

  DateTime? get createdAt => get<DateTime>('createdAt');
  set createdAt(DateTime? value) => set<DateTime>('createdAt', value);

  /// Convert Parse model to domain entity
  User toEntity() {
    return User(
      id: id ?? '',
      email: email ?? '',
      username: username ?? '',
      createdAt: createdAt ?? DateTime.now(),
    );
  }

  /// Create Parse model from domain entity
  static UserModel fromEntity(User entity) {
    final model = UserModel();
    model.id = entity.id;
    model.email = entity.email;
    model.username = entity.username;
    model.createdAt = entity.createdAt;
    return model;
  }
}
