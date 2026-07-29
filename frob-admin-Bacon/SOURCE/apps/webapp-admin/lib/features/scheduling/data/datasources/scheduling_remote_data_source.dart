import '../../../../core/network/api_result.dart';
import '../models/scheduling_models.dart';

abstract class SchedulingRemoteDataSource {
  Future<List<DepartureModel>> getCalendar();
  Future<DepartureDetailModel> getDeparture(String id);
  Future<List<TourModel>> getTours();
  Future<void> createTour(Map<String, dynamic> body);
  Future<void> updateTour(String id, Map<String, dynamic> body);
  Future<void> deleteTour(String id);
  Future<List<DepartureEditOptionModel>> getDepartures();
  Future<List<GuideOptionModel>> getGuides();
  Future<void> createDeparture(Map<String, dynamic> body);
  Future<void> updateDeparture(String id, Map<String, dynamic> body);
  Future<void> cancelDeparture(String id, {Map<String, dynamic>? notice});
}

class SchedulingRemoteDataSourceImpl implements SchedulingRemoteDataSource {
  final ApiHttp http;
  SchedulingRemoteDataSourceImpl(this.http);

  @override
  Future<List<DepartureModel>> getCalendar() async {
    final data = await http.get('/admin/calendar');
    return ApiHttp.unwrapList(data, 'departures')
        .map((j) => DepartureModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<DepartureDetailModel> getDeparture(String id) async {
    final data = await http.get('/admin/departures/$id');
    return DepartureDetailModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<List<TourModel>> getTours() async {
    // Cache-bust so a refetch after create/edit never shows a stale list.
    final data = await http.get('/admin/tours',
        query: {'_': DateTime.now().millisecondsSinceEpoch.toString()});
    return ApiHttp.unwrapList(data, 'tours')
        .map((j) => TourModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> createTour(Map<String, dynamic> body) async {
    await http.post('/admin/tours', body: body);
  }

  @override
  Future<void> updateTour(String id, Map<String, dynamic> body) async {
    await http.patch('/admin/tours/$id', body: body);
  }

  @override
  Future<void> deleteTour(String id) async {
    await http.delete('/admin/tours/$id');
  }

  @override
  Future<List<DepartureEditOptionModel>> getDepartures() async {
    final data = await http.get('/admin/departures');
    return ApiHttp.unwrapList(data, 'departures')
        .map((j) => DepartureEditOptionModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<List<GuideOptionModel>> getGuides() async {
    final data = await http.get('/admin/guides');
    return ApiHttp.unwrapList(data, 'guides')
        .map((j) => GuideOptionModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> createDeparture(Map<String, dynamic> body) async {
    await http.post('/admin/departures', body: body);
  }

  @override
  Future<void> updateDeparture(String id, Map<String, dynamic> body) async {
    await http.patch('/admin/departures/$id', body: body);
  }

  @override
  Future<void> cancelDeparture(String id, {Map<String, dynamic>? notice}) async {
    await http.post('/admin/departures/$id/cancel', body: notice ?? const {});
  }
}
