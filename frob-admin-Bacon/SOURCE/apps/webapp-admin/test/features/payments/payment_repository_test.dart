import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/exceptions.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/payments/data/datasources/payment_remote_data_source.dart';
import 'package:fob_webapp_admin/features/payments/data/models/payment_model.dart';
import 'package:fob_webapp_admin/features/payments/data/repositories/payment_repository_impl.dart';
import 'package:fob_webapp_admin/features/payments/domain/entities/payment.dart';

class _ThrowingSource implements PaymentRemoteDataSource {
  final Object error;
  _ThrowingSource(this.error);
  @override
  Future<List<PaymentModel>> getPayments() async => throw error;
  @override
  Future<void> refundBooking(String bookingId, int cumulativeRefundPence) async => throw error;
}

class _OkSource implements PaymentRemoteDataSource {
  @override
  Future<List<PaymentModel>> getPayments() async => const [];
  @override
  Future<void> refundBooking(String bookingId, int cumulativeRefundPence) async {}
}

void main() {
  group('PaymentModel.fromJson', () {
    test('maps payment_status and pence fields', () {
      final m = PaymentModel.fromJson({
        'booking_id': 'b1',
        'booking_ref': 'FOB-9',
        'customer_name': 'Jo',
        'paid_pence': 5000,
        'refunded_pence': 1000,
        'payment_status': 'succeeded',
        'provider_ref': 'pi_9',
      });
      expect(m.status, PaymentStatus.succeeded);
      expect(m.paidPence, 5000);
    });
    test('unknown status falls back to draft', () {
      expect(paymentStatusFromString('mystery'), PaymentStatus.draft);
    });
  });

  group('PaymentRepositoryImpl maps exceptions to failures', () {
    test('AuthException -> AuthFailure', () async {
      final repo = PaymentRepositoryImpl(_ThrowingSource(const AuthException('x')));
      final r = await repo.getPayments();
      expect(r, isA<Error<List<Payment>>>());
      expect((r as Error).failure, isA<AuthFailure>());
    });
    test('ServerException -> ServerFailure with status code', () async {
      final repo = PaymentRepositoryImpl(_ThrowingSource(const ServerException(500, 'boom')));
      final r = await repo.refundBooking('b1', 100);
      expect((r as Error).failure, isA<ServerFailure>());
      expect((r.failure as ServerFailure).statusCode, 500);
    });
    test('success wraps the value', () async {
      final repo = PaymentRepositoryImpl(_OkSource());
      final r = await repo.getPayments();
      expect(r, isA<Success<List<Payment>>>());
    });
  });
}
