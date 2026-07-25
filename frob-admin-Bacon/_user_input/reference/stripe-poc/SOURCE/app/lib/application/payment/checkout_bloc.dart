import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/payment/payment_entities.dart';
import '../../domain/payment/payment_repository.dart';

// --- Events ---------------------------------------------------------------

sealed class CheckoutEvent extends Equatable {
  const CheckoutEvent();

  @override
  List<Object?> get props => [];
}

/// Dispatched when the user submits the payment form. Creates a Checkout
/// Session server-side via [PaymentRepository.createCheckoutSession].
class CheckoutSubmitted extends CheckoutEvent {
  final int amountPence;
  final String reference;
  final String? customerEmail;

  const CheckoutSubmitted({
    required this.amountPence,
    required this.reference,
    this.customerEmail,
  });

  @override
  List<Object?> get props => [amountPence, reference, customerEmail];
}

/// Resets the bloc back to its initial state, e.g. so the user can start
/// over after an error or after completing a checkout.
class CheckoutReset extends CheckoutEvent {
  const CheckoutReset();
}

// --- States ----------------------------------------------------------------

sealed class CheckoutState extends Equatable {
  const CheckoutState();

  @override
  List<Object?> get props => [];
}

class CheckoutInitial extends CheckoutState {
  const CheckoutInitial();
}

class CheckoutLoading extends CheckoutState {
  const CheckoutLoading();
}

/// The Checkout Session was created successfully; `clientSecret` is ready
/// to be handed to the Embedded Checkout JS interop for mounting.
class CheckoutReady extends CheckoutState {
  final String clientSecret;
  final String sessionId;

  const CheckoutReady({required this.clientSecret, required this.sessionId});

  @override
  List<Object?> get props => [clientSecret, sessionId];
}

class CheckoutError extends CheckoutState {
  final String message;

  const CheckoutError(this.message);

  @override
  List<Object?> get props => [message];
}

// --- Bloc --------------------------------------------------------------

/// Drives creation of a Stripe Checkout Session from the payment form.
///
/// This bloc only ever creates the session — it does not know anything
/// about Stripe.js or the DOM. Once it reaches [CheckoutReady], the
/// presentation layer is responsible for mounting Embedded Checkout with
/// the returned `clientSecret`.
class CheckoutBloc extends Bloc<CheckoutEvent, CheckoutState> {
  final PaymentRepository _repository;

  CheckoutBloc({required PaymentRepository repository})
    // ignore: prefer_initializing_formals
    : _repository = repository,
      super(const CheckoutInitial()) {
    on<CheckoutSubmitted>(_onSubmitted);
    on<CheckoutReset>((event, emit) => emit(const CheckoutInitial()));
  }

  Future<void> _onSubmitted(
    CheckoutSubmitted event,
    Emitter<CheckoutState> emit,
  ) async {
    final amount = AmountPence(event.amountPence);
    final reference = PaymentReference(event.reference);

    if (!amount.isValid) {
      emit(const CheckoutError('Amount must be greater than zero.'));
      return;
    }
    if (!reference.isValid) {
      emit(const CheckoutError('Reference must not be empty.'));
      return;
    }

    emit(const CheckoutLoading());
    try {
      final created = await _repository.createCheckoutSession(
        amountPence: amount.value,
        reference: reference.value,
        customerEmail: event.customerEmail,
      );
      emit(
        CheckoutReady(
          clientSecret: created.clientSecret,
          sessionId: created.sessionId,
        ),
      );
    } catch (e) {
      emit(CheckoutError('Could not start checkout: $e'));
    }
  }
}
