import '../../../../core/network/api_result.dart';
import '../models/operator_settings_model.dart';

abstract class SettingsRemoteDataSource {
  Future<OperatorSettingsModel> getSettings();
  Future<OperatorSettingsModel> updateSettings(Map<String, dynamic> patch);
}

class SettingsRemoteDataSourceImpl implements SettingsRemoteDataSource {
  final ApiHttp http;
  SettingsRemoteDataSourceImpl(this.http);

  @override
  Future<OperatorSettingsModel> getSettings() async {
    final data = await http.get('/admin/settings');
    return OperatorSettingsModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<OperatorSettingsModel> updateSettings(Map<String, dynamic> patch) async {
    final data = await http.put('/admin/settings', body: patch);
    return OperatorSettingsModel.fromJson((data as Map).cast<String, dynamic>());
  }
}
