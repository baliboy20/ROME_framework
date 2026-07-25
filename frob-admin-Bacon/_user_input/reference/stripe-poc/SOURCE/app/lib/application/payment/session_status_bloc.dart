import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/payment/payment_entities.dart';
import '../../domain/payment/payment_repository.dart';

// --- Events ---------------------------------------------------------------

sealed class SessionStatusEvent extends Equatable {
  const SessionStatusEvent();

  @override
  List<Object?> get props => [];
}

/// Dispatched by the return screen once it has parsed `session_id` from
/// the URL. Kicks off polling.
class SessionStatusCheckRequested extends SessionStatusEvent {
  final String sessionId;

  const SessionStatusCheckRequested(this.sessionId);

  @override
  List<Object?> get props => [sessionId];
}

/// Internal event fed by the poll timer; not dispatched by the UI.
class _SessionStatusPollTicked extends SessionStatusEvent {
  const _SessionStatusPollTicked();
}

// --- States ----------------------------------------------------------------

sealed class SessionStatusState extends Equatable {
  const SessionStatusState();

  @override
  List<Object?> get props => [];
}

class SessionStatusInitial extends SessionStatusState {
  const SessionStatusInitial();
}

class SessionStatusLoading extends SessionStatusState {
  const SessionStatusLoading();
}

class SessionStatusPaid extends SessionStatusState {
  const SessionStatusPaid();
}

class SessionStatusFailed extends SessionStatusState {
  final String message;
  const SessionStatusFailed(this.message);

  @override
  List<Object?> get props => [message];
}

/// Session is still `open` (customer hasn't finished, or webhook/status
/// hasn't caught up yet) and we've exhausted our polling attempts. This is
/// purely informational for the user — the source of truth for fulfilment
/// is the server-side webhook, not this page.
class SessionStatusStillProcessing extends SessionStatusState {
  const SessionStatusStillProcessing();
}

class SessionStatusError extends SessionStatusState {
  final String message;
  const SessionStatusError(this.message);

  @override
  List<Object?> get props => [message];
}

// --- Bloc --------------------------------------------------------------

/// Polls `GET /api/session-status` every [pollInterval] while the session
/// remains `open`, up to [maxAttempts] times, then gives up with
/// [SessionStatusStillProcessing].
///
/// IMPORTANT: this bloc (and the return screen that uses it) is purely
/// informational. Order/booking fulfilment must be driven server-side by
/// the Stripe webhook — never by this page loading or polling succeeding.
class SessionStatusBloc extends Bloc<SessionStatusEvent, SessionStatusState> {
  final PaymentRepository _repository;
  final Duration pollInterval;
  final int maxAttempts;

  Timer? _pollTimer;
  String? _sessionId;
  int _attempts = 0;

  SessionStatusBloc({
    required PaymentRepository repository,
    this.pollInterval = const Duration(seconds: 2),
    this.maxAttempts = 5,
  })
    // ignore: prefer_initializing_formals
    : _repository = repository,
       super(const SessionStatusInitial()) {
    on<SessionStatusCheckRequested>(_onCheckRequested);
    on<_SessionStatusPollTicked>(_onPollTicked);
  }

  Future<void> _onCheckRequested(
    SessionStatusCheckRequested event,
    Emitter<SessionStatusState> emit,
  ) async {
    _sessionId = event.sessionId;
    _attempts = 0;
    await _poll(emit);
  }

  Future<void> _onPollTicked(
    _SessionStatusPollTicked event,
    Emitter<SessionStatusState> emit,
  ) async {
    await _poll(emit);
  }

  Future<void> _poll(Emitter<SessionStatusState> emit) async {
    final sessionId = _sessionId;
    if (sessionId == null) return;

    emit(const SessionStatusLoading());
    _attempts++;

    try {
      final result = await _repository.getSessionStatus(sessionId);
      switch (result.status) {
        case CheckoutSessionStatus.succeeded:
          emit(const SessionStatusPaid());
        case CheckoutSessionStatus.failed:
          emit(SessionStatusFailed(_describePaymentStatus(result)));
        case CheckoutSessionStatus.open:
          if (_attempts >= maxAttempts) {
            emit(const SessionStatusStillProcessing());
          } else {
            _schedulePoll();
          }
        case CheckoutSessionStatus.pending:
          // Not expected from the wire, but treat like "open" defensively.
          if (_attempts >= maxAttempts) {
            emit(const SessionStatusStillProcessing());
          } else {
            _schedulePoll();
          }
      }
    } catch (e) {
      emit(SessionStatusError('Could not check payment status: $e'));
    }
  }

  String _describePaymentStatus(SessionStatus result) {
    if (result.paymentStatus == PaymentStatus.unpaid) {
      return 'The checkout session expired without payment.';
    }
    return 'The checkout session did not complete successfully.';
  }

  void _schedulePoll() {
    _pollTimer?.cancel();
    _pollTimer = Timer(pollInterval, () {
      if (!isClosed) add(const _SessionStatusPollTicked());
    });
  }

  @override
  Future<void> close() {
    _pollTimer?.cancel();
    return super.close();
  }
}
