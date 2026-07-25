part of 'payments_bloc.dart';

sealed class PaymentsState extends Equatable {
  const PaymentsState();
  @override
  List<Object?> get props => [];
}

class PaymentsInitial extends PaymentsState {
  const PaymentsInitial();
}

class PaymentsLoading extends PaymentsState {
  const PaymentsLoading();
}

/// The list is loaded. [actionError] carries a transient refund failure while
/// keeping the list on screen (never blanks the table for an action error).
class PaymentsLoaded extends PaymentsState {
  final List<Payment> rows;
  final PayFilter filter;
  final String? actionError;

  const PaymentsLoaded({required this.rows, this.filter = PayFilter.all, this.actionError});

  List<Payment> get filtered {
    switch (filter) {
      case PayFilter.all:
        return rows;
      case PayFilter.requiresPayment:
        return rows.where((r) => r.status == PaymentStatus.requiresPayment).toList();
      case PayFilter.succeeded:
        return rows.where((r) => r.status == PaymentStatus.succeeded).toList();
      case PayFilter.refunded:
        return rows.where((r) => r.status == PaymentStatus.refunded).toList();
      case PayFilter.failed:
        return rows.where((r) => r.status == PaymentStatus.failed).toList();
      case PayFilter.noShow:
        return rows.where((r) => r.status == PaymentStatus.noShow).toList();
    }
  }

  PaymentsLoaded copyWith({List<Payment>? rows, PayFilter? filter, String? actionError}) =>
      PaymentsLoaded(
        rows: rows ?? this.rows,
        filter: filter ?? this.filter,
        actionError: actionError,
      );

  @override
  List<Object?> get props => [rows, filter, actionError];
}

/// Initial load failed — the list could not be shown at all.
class PaymentsLoadFailure extends PaymentsState {
  final String message;
  const PaymentsLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}
