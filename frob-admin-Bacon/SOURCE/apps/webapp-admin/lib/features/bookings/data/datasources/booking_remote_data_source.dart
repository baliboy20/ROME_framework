import '../../../../core/network/api_result.dart';
import '../models/booking_detail_model.dart';
import '../models/booking_summary_model.dart';

/// Owns the booking HTTP reads/writes lifted from `ApiClient`. THROWS on failure.
abstract class BookingRemoteDataSource {
  Future<BookingDetailModel> getBookingDetail(String id);
  Future<List<BookingSummaryModel>> getBookings();
  Future<List<DepartureSlotModel>> getDepartures();
  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> body);
  Future<Map<String, dynamic>> createProvisionalBooking(Map<String, dynamic> body);
  Future<void> updateBooking(String id, Map<String, dynamic> body);
  Future<void> transitionBooking(String id, String transition);
  Future<String> sendBookingEmail(String id, Map<String, dynamic> body);
}

class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final ApiHttp http;
  BookingRemoteDataSourceImpl(this.http);

  @override
  Future<BookingDetailModel> getBookingDetail(String id) async {
    final data = await http.get('/admin/bookings/$id');
    return BookingDetailModel.fromJson((data as Map).cast<String, dynamic>());
  }

  @override
  Future<List<BookingSummaryModel>> getBookings() async {
    final data = await http.get('/admin/bookings');
    return ApiHttp.unwrapList(data, 'bookings')
        .map((j) => BookingSummaryModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<List<DepartureSlotModel>> getDepartures() async {
    final data = await http.get('/admin/departures');
    return ApiHttp.unwrapList(data, 'departures')
        .map((j) => DepartureSlotModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> body) async {
    final data = await http.post('/admin/bookings', body: body);
    return (data as Map?)?.cast<String, dynamic>() ?? const {};
  }

  @override
  Future<Map<String, dynamic>> createProvisionalBooking(Map<String, dynamic> body) async {
    final data = await http.post('/admin/bookings/provisional', body: body);
    return (data as Map?)?.cast<String, dynamic>() ?? const {};
  }

  @override
  Future<void> updateBooking(String id, Map<String, dynamic> body) async {
    await http.patch('/admin/bookings/$id', body: body);
  }

  @override
  Future<void> transitionBooking(String id, String transition) async {
    await http.post('/admin/bookings/$id/transition', body: {'transition': transition});
  }

  // CR-004 (CHG-012, REQ-NOTIF11): owner-initiated booking email — returns the
  // address the worker sent to ({status, sentTo, messageId}).
  @override
  Future<String> sendBookingEmail(String id, Map<String, dynamic> body) async {
    final data = await http.post('/admin/bookings/$id/send-email', body: body);
    return ((data as Map?)?['sentTo'])?.toString() ?? '';
  }
}
