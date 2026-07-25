/// Exceptions thrown by data sources only. Repositories catch these and map
/// them to [Failure]s wrapped in a `Result` (expert_flutter §error-handling).
library;

/// Non-2xx HTTP response from the api-worker.
class ServerException implements Exception {
  final int statusCode;
  final String message;
  const ServerException(this.statusCode, this.message);
  @override
  String toString() => 'ServerException($statusCode, $message)';
}

/// Transport failure — socket, DNS, timeout, malformed body.
class NetworkException implements Exception {
  final String message;
  const NetworkException([this.message = 'Network unavailable']);
  @override
  String toString() => 'NetworkException($message)';
}

/// 401/403 — session missing or insufficient privilege.
class AuthException implements Exception {
  final String message;
  const AuthException([this.message = 'Not authorised']);
  @override
  String toString() => 'AuthException($message)';
}

/// 422/400 — request rejected by server-side validation.
class ValidationException implements Exception {
  final String message;
  const ValidationException(this.message);
  @override
  String toString() => 'ValidationException($message)';
}

/// Local cache read/write failure (KV/localStorage). Reserved for future use.
class CacheException implements Exception {
  final String message;
  const CacheException([this.message = 'Cache error']);
  @override
  String toString() => 'CacheException($message)';
}
