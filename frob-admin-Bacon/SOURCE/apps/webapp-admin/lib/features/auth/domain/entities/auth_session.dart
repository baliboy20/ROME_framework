import 'package:equatable/equatable.dart';

/// The signed-in owner/operator session (AUTH01).
class AuthSession extends Equatable {
  final String token;
  final String operatorName;
  const AuthSession({required this.token, required this.operatorName});

  @override
  List<Object?> get props => [token, operatorName];
}
