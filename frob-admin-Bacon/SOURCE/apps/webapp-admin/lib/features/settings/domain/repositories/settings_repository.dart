import '../../../../core/types/result.dart';
import '../entities/operator_settings.dart';

abstract class SettingsRepository {
  Future<Result<OperatorSettings>> getSettings();
  Future<Result<OperatorSettings>> updateSettings(Map<String, dynamic> patch);
}
