import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/api/api_client.dart';
import 'package:fob_webapp_admin/bloc/payments_cubit.dart';
import 'package:fob_webapp_admin/models/models.dart';

void main() {
  group('PaymentsCubit cumulative refund (UXD-01, REQ-BOOK13)', () {
    late PaymentsCubit cubit;
    late PaymentRow row;

    setUp(() {
      cubit = PaymentsCubit(ApiClient());
      row = PaymentRow(
        bookingId: 'b1',
        bookingRef: 'FOB-100',
        customerName: 'Alex Rider',
        paidPence: 9000,
        refundedPence: 2000,
        status: StatusPillState.succeeded,
        providerRef: 'pi_123',
      );
    });

    test('cumulative total adds the new entry to refunded-so-far, never replaces it', () {
      final cumulative = cubit.cumulativeAfter(row, 1500);
      expect(cumulative, 3500); // 2000 already refunded + 1500 new entry
    });

    test('cumulative total is never a latest-only figure', () {
      final first = cubit.cumulativeAfter(row, 1000);
      expect(first, isNot(1000));
      expect(first, 3000);
    });

    test('zero-refunded booking: cumulative equals the entry itself', () {
      final fresh = row.copyWith(refundedPence: 0);
      expect(cubit.cumulativeAfter(fresh, 500), 500);
    });
  });
}
