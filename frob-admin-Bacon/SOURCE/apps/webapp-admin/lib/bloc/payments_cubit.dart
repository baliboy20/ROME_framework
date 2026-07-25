import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';

enum PayFilter { all, requiresPayment, succeeded, refunded, failed, noShow }

class PaymentsState {
  final bool loading;
  final List<PaymentRow> rows;
  final PayFilter filter;
  final String? error;

  const PaymentsState({this.loading = false, this.rows = const [], this.filter = PayFilter.all, this.error});

  List<PaymentRow> get filtered {
    switch (filter) {
      case PayFilter.all:
        return rows;
      case PayFilter.requiresPayment:
        return rows.where((r) => r.status == StatusPillState.requiresPayment).toList();
      case PayFilter.succeeded:
        return rows.where((r) => r.status == StatusPillState.succeeded).toList();
      case PayFilter.refunded:
        return rows.where((r) => r.status == StatusPillState.refunded).toList();
      case PayFilter.failed:
        return rows.where((r) => r.status == StatusPillState.failed).toList();
      case PayFilter.noShow:
        return rows.where((r) => r.status == StatusPillState.noShow).toList();
    }
  }

  PaymentsState copyWith({bool? loading, List<PaymentRow>? rows, PayFilter? filter, String? error}) =>
      PaymentsState(loading: loading ?? this.loading, rows: rows ?? this.rows, filter: filter ?? this.filter, error: error);
}

/// A8 payments + cumulative-refund modal state (UXD-01, REQ-BOOK13).
class PaymentsCubit extends Cubit<PaymentsState> {
  final ApiClient api;
  PaymentsCubit(this.api) : super(const PaymentsState());

  Future<void> load() async {
    emit(state.copyWith(loading: true));
    try {
      final data = await api.getPayments();
      final rows = data.map((j) => PaymentRow.fromJson(j as Map<String, dynamic>)).toList();
      emit(state.copyWith(loading: false, rows: rows));
    } catch (e) {
      emit(state.copyWith(loading: false, error: 'Could not load payments.'));
    }
  }

  void setFilter(PayFilter f) => emit(state.copyWith(filter: f));

  /// UXD-01: cumulative refund total — never latest-only.
  int cumulativeAfter(PaymentRow row, int refundEntryPence) => row.refundedPence + refundEntryPence;

  Future<void> confirmRefund(PaymentRow row, int refundEntryPence) async {
    final newTotal = cumulativeAfter(row, refundEntryPence);
    try {
      await api.refundBooking(row.bookingId, newTotal);
      final updated = state.rows
          .map((r) => r.bookingId == row.bookingId
              ? r.copyWith(refundedPence: newTotal, status: StatusPillState.refunded)
              : r)
          .toList();
      emit(state.copyWith(rows: updated));
    } catch (e) {
      emit(state.copyWith(error: 'Refund failed — no change was made.'));
    }
  }
}
