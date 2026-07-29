import '../../../../core/network/api_result.dart';
import '../models/payment_model.dart';

/// Owns the HTTP calls lifted from the old `ApiClient` for the payments
/// feature. THROWS `*Exception` on failure (never returns a `Result`).
abstract class PaymentRemoteDataSource {
  Future<List<PaymentModel>> getPayments();
  Future<void> refundBooking(String bookingId, int cumulativeRefundPence);
}

class PaymentRemoteDataSourceImpl implements PaymentRemoteDataSource {
  final ApiHttp http;
  PaymentRemoteDataSourceImpl(this.http);

  @override
  Future<List<PaymentModel>> getPayments() async {
    // A8 payments derive from the bookings list; the admin view filters
    // client-side (contract: BO05).
    final data = await http.get('/admin/bookings');
    final list = ApiHttp.unwrapList(data, 'bookings');
    return list
        .map((j) => PaymentModel.fromJson((j as Map).cast<String, dynamic>()))
        .toList();
  }

  @override
  Future<void> refundBooking(String bookingId, int cumulativeRefundPence) async {
    // FINDING-001: operator-guarded admin refund route (cumulative total).
    await http.post('/admin/bookings/$bookingId/refund',
        body: {'refundAmountPence': cumulativeRefundPence});
  }
}
