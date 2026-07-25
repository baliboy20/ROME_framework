import '../../../../models/models.dart' show StatusPillState;
import '../../domain/entities/payment.dart';

/// Presentation-layer mapping: domain [PaymentStatus] → the UI [StatusPillState]
/// the shared StatusPill widget renders. Keeps the domain free of UI enums.
extension PaymentStatusPill on PaymentStatus {
  StatusPillState get pill => switch (this) {
        PaymentStatus.succeeded => StatusPillState.succeeded,
        PaymentStatus.requiresPayment => StatusPillState.requiresPayment,
        PaymentStatus.refunded => StatusPillState.refunded,
        PaymentStatus.failed => StatusPillState.failed,
        PaymentStatus.noShow => StatusPillState.noShow,
        PaymentStatus.draft => StatusPillState.draft,
      };
}
