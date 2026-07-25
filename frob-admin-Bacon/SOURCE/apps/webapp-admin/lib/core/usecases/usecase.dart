import 'package:equatable/equatable.dart';
import '../types/result.dart';

/// One class per operation. Presentation calls `useCase(params)`; the use case
/// delegates to a repository and returns its `Result` unchanged. Never touches
/// a data source directly (expert_flutter §DDD).
abstract class UseCase<T, Params> {
  Future<Result<T>> call(Params params);
}

/// Sentinel for use cases that take no arguments.
class NoParams extends Equatable {
  const NoParams();
  @override
  List<Object?> get props => [];
}
