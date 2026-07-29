part of 'payments_bloc.dart';

/// Client-side filter over the loaded payments list (A8).
enum PayFilter { all, requiresPayment, succeeded, refunded, failed, noShow }

sealed class PaymentsEvent extends Equatable {
  const PaymentsEvent();
  @override
  List<Object?> get props => [];
}

/// Load (or reload) the A8 list.
class LoadPaymentsEvent extends PaymentsEvent {
  const LoadPaymentsEvent();
}

/// Change the active filter chip.
class FilterPaymentsEvent extends PaymentsEvent {
  final PayFilter filter;
  const FilterPaymentsEvent(this.filter);
  @override
  List<Object?> get props => [filter];
}

/// UXD-01 — confirm a cumulative refund. [refundEntryPence] is the amount the
/// operator typed for THIS refund; the bloc adds it to what's already refunded.
class ConfirmRefundEvent extends PaymentsEvent {
  final Payment payment;
  final int refundEntryPence;
  const ConfirmRefundEvent(this.payment, this.refundEntryPence);
  @override
  List<Object?> get props => [payment, refundEntryPence];
}
