import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/payment.dart';
import '../../domain/usecases/get_payments.dart';
import '../../domain/usecases/refund_booking.dart';

part 'payments_event.dart';
part 'payments_state.dart';

/// A8 payments + cumulative-refund state (UXD-01, REQ-BOOK13). Event-driven
/// Bloc consuming `Result` — no network code, no JSON.
class PaymentsBloc extends Bloc<PaymentsEvent, PaymentsState> {
  final GetPayments getPayments;
  final RefundBooking refundBooking;

  PaymentsBloc({required this.getPayments, required this.refundBooking})
      : super(const PaymentsInitial()) {
    on<LoadPaymentsEvent>(_onLoad);
    on<FilterPaymentsEvent>(_onFilter);
    on<ConfirmRefundEvent>(_onRefund);
  }

  /// UXD-01: cumulative refund total — never latest-only.
  static int cumulativeAfter(Payment p, int refundEntryPence) =>
      p.refundedPence + refundEntryPence;

  Future<void> _onLoad(LoadPaymentsEvent event, Emitter<PaymentsState> emit) async {
    emit(const PaymentsLoading());
    final result = await getPayments(const NoParams());
    emit(result.fold(
      (failure) => PaymentsLoadFailure(failure.message),
      (rows) => PaymentsLoaded(rows: rows),
    ));
  }

  void _onFilter(FilterPaymentsEvent event, Emitter<PaymentsState> emit) {
    final s = state;
    if (s is PaymentsLoaded) emit(s.copyWith(filter: event.filter));
  }

  Future<void> _onRefund(ConfirmRefundEvent event, Emitter<PaymentsState> emit) async {
    final s = state;
    if (s is! PaymentsLoaded) return;
    final newTotal = cumulativeAfter(event.payment, event.refundEntryPence);
    final result = await refundBooking(
        RefundParams(bookingId: event.payment.bookingId, cumulativeRefundPence: newTotal));
    result.fold(
      (failure) => emit(s.copyWith(actionError: 'Refund failed — no change was made.')),
      (_) {
        final updated = s.rows
            .map((r) => r.bookingId == event.payment.bookingId
                ? r.copyWith(refundedPence: newTotal, status: PaymentStatus.refunded)
                : r)
            .toList();
        emit(s.copyWith(rows: updated));
      },
    );
  }
}
