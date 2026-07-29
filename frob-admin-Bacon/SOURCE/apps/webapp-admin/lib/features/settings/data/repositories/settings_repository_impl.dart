import '../../../../core/data/repository_guard.dart';
import '../../../../core/types/result.dart';
import '../../domain/entities/operator_settings.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_remote_data_source.dart';

class SettingsRepositoryImpl with RepositoryGuard implements SettingsRepository {
  final SettingsRemoteDataSource remote;
  SettingsRepositoryImpl(this.remote);

  @override
  Future<Result<OperatorSettings>> getSettings() => guard(() async => await remote.getSettings());

  @override
  Future<Result<OperatorSettings>> updateSettings(Map<String, dynamic> patch) =>
      guard(() async => await remote.updateSettings(patch));
}
