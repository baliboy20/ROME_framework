import '../../../../core/network/api_result.dart';
import '../models/booking_detail_model.dart';

/// Owns the booking HTTP reads lifted from `ApiClient`. THROWS on failure.
abstract class BookingRemoteDataSource {
  Future<BookingDetailModel> getBookingDetail(String id);
}

class BookingRemoteDataSourceImpl implements BookingRemoteDataSource {
  final ApiHttp http;
  BookingRemoteDataSourceImpl(this.http);

  @override
  Future<BookingDetailModel> getBookingDetail(String id) async {
    final data = await http.get('/admin/bookings/$id');
    return BookingDetailModel.fromJson((data as Map).cast<String, dynamic>());
  }
}
