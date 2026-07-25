import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/payments/domain/entities/payment.dart';
import 'package:fob_webapp_admin/features/payments/domain/repositories/payment_repository.dart';
import 'package:fob_webapp_admin/features/payments/domain/usecases/get_payments.dart';
import 'package:fob_webapp_admin/features/payments/domain/usecases/refund_booking.dart';
import 'package:fob_webapp_admin/features/payments/presentation/bloc/payments_bloc.dart';

/// In-memory fake repository — the DDD seam makes the bloc testable with no
/// HTTP, no mock framework.
class _FakeRepo implements PaymentRepository {
  List<Payment> rows;
  Failure? failGet;
  Failure? failRefund;
  int? lastRefundTotal;

  _FakeRepo(this.rows);

  @override
  Future<Result<List<Payment>>> getPayments() async =>
      failGet != null ? Error(failGet!) : Success(rows);

  @override
  Future<Result<void>> refundBooking(String bookingId, int cumulativeRefundPence) async {
    if (failRefund != null) return Error(failRefund!);
    lastRefundTotal = cumulativeRefundPence;
    return const Success(null);
  }
}

Payment _p({int refunded = 2000, PaymentStatus status = PaymentStatus.succeeded}) => Payment(
      bookingId: 'b1',
      bookingRef: 'FOB-100',
      customerName: 'Alex Rider',
      paidPence: 9000,
      refundedPence: refunded,
      status: status,
      providerRef: 'pi_123',
    );

void main() {
  group('cumulativeAfter (UXD-01, REQ-BOOK13)', () {
    test('adds the new entry to refunded-so-far, never replaces it', () {
      expect(PaymentsBloc.cumulativeAfter(_p(), 1500), 3500);
    });
    test('zero-refunded booking: cumulative equals the entry itself', () {
      expect(PaymentsBloc.cumulativeAfter(_p(refunded: 0), 500), 500);
    });
  });

  group('PaymentsBloc', () {
    late _FakeRepo repo;
    PaymentsBloc build() =>
        PaymentsBloc(getPayments: GetPayments(repo), refundBooking: RefundBooking(repo));

    setUp(() => repo = _FakeRepo([_p()]));

    test('load emits Loading then Loaded', () async {
      final bloc = build();
      final states = <PaymentsState>[];
      bloc.stream.listen(states.add);
      bloc.add(const LoadPaymentsEvent());
      await Future.delayed(Duration.zero);
      expect(states.first, isA<PaymentsLoading>());
      expect(states.last, isA<PaymentsLoaded>());
      expect((states.last as PaymentsLoaded).rows.length, 1);
    });

    test('load failure emits PaymentsLoadFailure with the failure message', () async {
      repo.failGet = const NetworkFailure('offline');
      final bloc = build();
      final states = <PaymentsState>[];
      bloc.stream.listen(states.add);
      bloc.add(const LoadPaymentsEvent());
      await Future.delayed(Duration.zero);
      expect(states.last, isA<PaymentsLoadFailure>());
      expect((states.last as PaymentsLoadFailure).message, 'offline');
    });

    test('confirm refund sends the cumulative total and marks the row refunded', () async {
      final bloc = build();
      bloc.add(const LoadPaymentsEvent());
      await Future.delayed(Duration.zero);
      bloc.add(ConfirmRefundEvent(_p(), 1500));
      await Future.delayed(Duration.zero);
      expect(repo.lastRefundTotal, 3500); // 2000 + 1500 cumulative
      final loaded = bloc.state as PaymentsLoaded;
      expect(loaded.rows.first.status, PaymentStatus.refunded);
      expect(loaded.rows.first.refundedPence, 3500);
    });

    test('refund failure keeps the list and surfaces an action error', () async {
      repo.failRefund = const ServerFailure('nope');
      final bloc = build();
      bloc.add(const LoadPaymentsEvent());
      await Future.delayed(Duration.zero);
      bloc.add(ConfirmRefundEvent(_p(), 1500));
      await Future.delayed(Duration.zero);
      final loaded = bloc.state as PaymentsLoaded;
      expect(loaded.actionError, isNotNull);
      expect(loaded.rows.first.status, PaymentStatus.succeeded); // unchanged
    });

    test('filter narrows the visible rows', () async {
      repo.rows = [_p(), _p(status: PaymentStatus.failed)];
      final bloc = build();
      bloc.add(const LoadPaymentsEvent());
      await Future.delayed(Duration.zero);
      bloc.add(const FilterPaymentsEvent(PayFilter.failed));
      await Future.delayed(Duration.zero);
      expect((bloc.state as PaymentsLoaded).filtered.length, 1);
    });
  });
}
