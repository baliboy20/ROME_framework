import '../../../../core/network/api_result.dart';
import '../models/hazard_model.dart';
import '../models/incident_model.dart';

abstract class SafetyRemoteDataSource {
  Future<List<IncidentModel>> getIncidents();
  Future<void> dispatchIncident(String id);
  Future<List<HazardModel>> getHazards();
  Future<void> reviewHazard(String id, String status);
}

class SafetyRemoteDataSourceImpl implements SafetyRemoteDataSource {
  final ApiHttp http;
  SafetyRemoteDataSourceImpl(this.http);

  @override
  Future<List<IncidentModel>> getIncidents() async {
    final data = await http.get('/admin/incidents');
    return ApiHttp.unwrapList(data, 'incidents')
        .map((j) => IncidentModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> dispatchIncident(String id) async {
    await http.patch('/admin/incidents/$id/dispatch');
  }

  @override
  Future<List<HazardModel>> getHazards() async {
    final data = await http.get('/admin/hazards');
    return ApiHttp.unwrapList(data, 'hazards')
        .map((j) => HazardModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> reviewHazard(String id, String status) async {
    await http.patch('/admin/hazards/$id', body: {'status': status});
  }
}
