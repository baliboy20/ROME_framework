import '../../../../core/network/api_result.dart';
import '../models/fleet_models.dart';

abstract class FleetRemoteDataSource {
  Future<List<BikeSummaryModel>> getFleet();
  Future<BikeRecordModel> getBike(String id);
  Future<void> addBike(String id, String label);
  Future<FleetReadinessModel> getFleetReadiness();
  Future<List<BikeModel>> getAvailableBikes(String departureId);
  Future<void> setBikeAssignments(String departureId, List<String> bikeIds);
  Future<void> logMaintenance(String bikeId, String note);
  Future<void> setBikeStatus(String bikeId, String status);
  Future<List<EquipmentModel>> getEquipment();
  Future<void> addEquipment(String type, String description, String purchaseDate);
  Future<List<ComplianceItemModel>> getCompliance();
  Future<void> renewCompliance(String id, String newExpiry);
  Future<List<DepartureOptionModel>> getDepartureOptions();
}

class FleetRemoteDataSourceImpl implements FleetRemoteDataSource {
  final ApiHttp http;
  FleetRemoteDataSourceImpl(this.http);

  @override
  Future<List<BikeSummaryModel>> getFleet() async {
    final data = await http.get('/admin/bikes');
    return ApiHttp.unwrapList(data, 'bikes')
        .map((j) => BikeSummaryModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<BikeRecordModel> getBike(String id) async {
    final data = await http.get('/admin/bikes/$id');
    return BikeRecordModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<void> addBike(String id, String label) async {
    await http.post('/admin/bikes', body: {'id': id, 'label': label});
  }

  @override
  Future<FleetReadinessModel> getFleetReadiness() async {
    final data = await http.get('/admin/fleet');
    return FleetReadinessModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<List<BikeModel>> getAvailableBikes(String departureId) async {
    final data = await http.get('/admin/bikes', query: {'available_for': departureId});
    return ApiHttp.unwrapList(data, 'bikes')
        .map((j) => BikeModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> setBikeAssignments(String departureId, List<String> bikeIds) async {
    await http.post('/admin/departures/$departureId/bike-assignments', body: {'bike_ids': bikeIds});
  }

  @override
  Future<void> logMaintenance(String bikeId, String note) async {
    await http.post('/admin/bikes/$bikeId/maintenance', body: {'note': note});
  }

  @override
  Future<void> setBikeStatus(String bikeId, String status) async {
    await http.patch('/admin/bikes/$bikeId/status', body: {'status': status});
  }

  @override
  Future<List<EquipmentModel>> getEquipment() async {
    final data = await http.get('/admin/equipment');
    return ApiHttp.unwrapList(data, 'equipment')
        .map((j) => EquipmentModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> addEquipment(String type, String description, String purchaseDate) async {
    await http.post('/admin/equipment',
        body: {'type': type, 'description': description, 'purchase_date': purchaseDate});
  }

  @override
  Future<List<ComplianceItemModel>> getCompliance() async {
    final data = await http.get('/admin/compliance');
    return ApiHttp.unwrapList(data, 'compliance')
        .map((j) => ComplianceItemModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> renewCompliance(String id, String newExpiry) async {
    await http.patch('/admin/compliance/$id/renew', body: {'expiry_or_due_at': newExpiry});
  }

  @override
  Future<List<DepartureOptionModel>> getDepartureOptions() async {
    final data = await http.get('/admin/departures');
    return ApiHttp.unwrapList(data, 'departures')
        .map((j) => DepartureOptionModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }
}
