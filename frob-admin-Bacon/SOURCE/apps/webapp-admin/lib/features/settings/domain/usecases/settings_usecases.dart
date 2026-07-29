import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/operator_settings.dart';
import '../repositories/settings_repository.dart';

class GetSettings extends UseCase<OperatorSettings, NoParams> {
  final SettingsRepository repository;
  GetSettings(this.repository);
  @override
  Future<Result<OperatorSettings>> call(NoParams params) => repository.getSettings();
}

class UpdateSettings extends UseCase<OperatorSettings, Map<String, dynamic>> {
  final SettingsRepository repository;
  UpdateSettings(this.repository);
  @override
  Future<Result<OperatorSettings>> call(Map<String, dynamic> patch) => repository.updateSettings(patch);
}
