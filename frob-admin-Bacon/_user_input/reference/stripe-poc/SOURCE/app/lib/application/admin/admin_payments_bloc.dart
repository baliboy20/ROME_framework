import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/admin/admin_entities.dart';
import '../../domain/admin/admin_repository.dart';

// --- Events ---------------------------------------------------------------

sealed class AdminPaymentsEvent extends Equatable {
  const AdminPaymentsEvent();

  @override
  List<Object?> get props => [];
}

/// Dispatched on screen load (and pull-to-refresh) to fetch the payment
/// list from `GET /api/admin/payments`.
class AdminPaymentsLoadRequested extends AdminPaymentsEvent {
  const AdminPaymentsLoadRequested();
}

/// Dispatched when the user confirms a refund from the dialog. Omit
/// [amountPence] for a full refund.
class AdminPaymentsRefundRequested extends AdminPaymentsEvent {
  final String sessionId;
  final int? amountPence;

  const AdminPaymentsRefundRequested({
    required this.sessionId,
    this.amountPence,
  });

  @override
  List<Object?> get props => [sessionId, amountPence];
}

// --- States ----------------------------------------------------------------

sealed class AdminPaymentsState extends Equatable {
  const AdminPaymentsState();

  @override
  List<Object?> get props => [];
}

class AdminPaymentsInitial extends AdminPaymentsState {
  const AdminPaymentsInitial();
}

class AdminPaymentsLoading extends AdminPaymentsState {
  const AdminPaymentsLoading();
}

class AdminPaymentsLoaded extends AdminPaymentsState {
  final List<AdminPaymentRow> payments;

  /// Session id currently being refunded, if any — lets the UI disable
  /// just that row's action and show an inline spinner.
  final String? refundingSessionId;

  const AdminPaymentsLoaded(this.payments, {this.refundingSessionId});

  @override
  List<Object?> get props => [payments, refundingSessionId];
}

/// Emitted transiently after a successful refund, before the list reload
/// re-emits [AdminPaymentsLoaded]. The presentation layer can watch for
/// this to show a success snackbar.
class AdminPaymentsRefundSucceeded extends AdminPaymentsState {
  final List<AdminPaymentRow> payments;
  final RefundResult result;

  const AdminPaymentsRefundSucceeded(this.payments, this.result);

  @override
  List<Object?> get props => [payments, result];
}

class AdminPaymentsError extends AdminPaymentsState {
  final String message;

  const AdminPaymentsError(this.message);

  @override
  List<Object?> get props => [message];
}

/// A refund attempt failed; the previously loaded list is preserved so the
/// table stays visible behind the error.
class AdminPaymentsRefundError extends AdminPaymentsState {
  final List<AdminPaymentRow> payments;
  final String message;

  const AdminPaymentsRefundError(this.payments, this.message);

  @override
  List<Object?> get props => [payments, message];
}

// --- Bloc --------------------------------------------------------------

/// Drives the admin payments list and per-row refunds against
/// [AdminRepository]. Reloads the list after every refund attempt (success
/// or failure) so displayed statuses/refund amounts stay in sync with the
/// server.
class AdminPaymentsBloc extends Bloc<AdminPaymentsEvent, AdminPaymentsState> {
  final AdminRepository _repository;

  AdminPaymentsBloc({required AdminRepository repository})
    // ignore: prefer_initializing_formals
    : _repository = repository,
      super(const AdminPaymentsInitial()) {
    on<AdminPaymentsLoadRequested>(_onLoadRequested);
    on<AdminPaymentsRefundRequested>(_onRefundRequested);
  }

  Future<void> _onLoadRequested(
    AdminPaymentsLoadRequested event,
    Emitter<AdminPaymentsState> emit,
  ) async {
    emit(const AdminPaymentsLoading());
    try {
      final payments = await _repository.listPayments();
      emit(AdminPaymentsLoaded(payments));
    } catch (e) {
      emit(AdminPaymentsError('Could not load payments: $e'));
    }
  }

  Future<void> _onRefundRequested(
    AdminPaymentsRefundRequested event,
    Emitter<AdminPaymentsState> emit,
  ) async {
    final currentPayments = switch (state) {
      AdminPaymentsLoaded(:final payments) => payments,
      AdminPaymentsRefundSucceeded(:final payments) => payments,
      AdminPaymentsRefundError(:final payments) => payments,
      _ => <AdminPaymentRow>[],
    };

    emit(
      AdminPaymentsLoaded(
        currentPayments,
        refundingSessionId: event.sessionId,
      ),
    );

    try {
      final result = await _repository.refund(
        sessionId: event.sessionId,
        amountPence: event.amountPence,
      );
      final refreshed = await _repository.listPayments();
      emit(AdminPaymentsRefundSucceeded(refreshed, result));
    } catch (e) {
      // Best-effort refresh so the list reflects reality even if the
      // refund itself failed (e.g. someone else already refunded it).
      List<AdminPaymentRow> refreshed = currentPayments;
      try {
        refreshed = await _repository.listPayments();
      } catch (_) {
        // Ignore — fall back to the pre-refund list.
      }
      emit(AdminPaymentsRefundError(refreshed, 'Refund failed: $e'));
    }
  }
}
