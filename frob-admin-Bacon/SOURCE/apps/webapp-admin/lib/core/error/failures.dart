import 'package:equatable/equatable.dart';

/// Domain-layer failures. Pure Dart, Equatable — the presentation layer
/// switches on these to choose a message. Repositories create them by
/// catching data-source exceptions (expert_flutter §error-handling).
sealed class Failure extends Equatable {
  /// Operator-facing message, safe to render directly.
  final String message;
  const Failure(this.message);

  @override
  List<Object?> get props => [message];
}

/// Server returned a non-2xx status (business rule, 500, etc.).
class ServerFailure extends Failure {
  final int? statusCode;
  const ServerFailure(super.message, {this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

/// Transport failed — no reachable server.
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Network unavailable. Check your connection.']);
}

/// Session missing or insufficient privilege (401/403).
class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Your session has expired. Sign in again.']);
}

/// Server-side validation rejected the request (422/400).
class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}

/// Local cache failure.
class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Could not read local data.']);
}
