import 'package:equatable/equatable.dart';

/// Owner-configurable operational policy (DR-16, EML reintegration).
class OperatorSettings extends Equatable {
  /// Hours before departure at/above which a full refund is automatic; below
  /// it, no automated calculation — the Owner enters the amount manually.
  final int refundCutoffHours;

  /// Which reminder milestones fire — subset of `t_minus_7`/`t_minus_24h`/`t_minus_1`.
  final List<String> reminderMilestones;

  /// Which remediation options the Owner may offer on a business cancellation.
  final List<String> cancellationRemediationOptions;

  /// FR-001 — WHEN the booking confirmation goes out, never WHETHER.
  /// `auto`   : sent the moment payment outcome is known.
  /// `manual` : William sends it from the booking screen; same template, same
  ///            content. There is deliberately no "off" — a customer who pays
  ///            and hears nothing assumes the booking failed (REQ-NOTIF11).
  final String replyMode;

  /// FR-001 — default deposit offered on a new booking, in PENCE (TDR-04).
  /// 0 means no default; the Owner enters an amount per booking. Individual
  /// bookings may always differ from this.
  final int depositDefaultPence;

  const OperatorSettings({
    required this.refundCutoffHours,
    required this.reminderMilestones,
    required this.cancellationRemediationOptions,
    this.replyMode = 'auto',
    this.depositDefaultPence = 0,
  });

  bool get isManualReply => replyMode == 'manual';

  OperatorSettings copyWith({
    int? refundCutoffHours,
    List<String>? reminderMilestones,
    List<String>? cancellationRemediationOptions,
    String? replyMode,
    int? depositDefaultPence,
  }) =>
      OperatorSettings(
        refundCutoffHours: refundCutoffHours ?? this.refundCutoffHours,
        reminderMilestones: reminderMilestones ?? this.reminderMilestones,
        cancellationRemediationOptions:
            cancellationRemediationOptions ?? this.cancellationRemediationOptions,
        replyMode: replyMode ?? this.replyMode,
        depositDefaultPence: depositDefaultPence ?? this.depositDefaultPence,
      );

  @override
  List<Object?> get props => [
        refundCutoffHours,
        reminderMilestones,
        cancellationRemediationOptions,
        replyMode,
        depositDefaultPence,
      ];
}

/// The full option sets the Settings screen renders as toggles.
const kAllReminderMilestones = ['t_minus_7', 't_minus_24h', 't_minus_1'];
const kAllRemediationOptions = ['refund', 'rebook', 'credit'];

String reminderMilestoneLabel(String m) => switch (m) {
      't_minus_7' => 'T-7 days',
      't_minus_24h' => 'T-24 hours',
      't_minus_1' => 'T-1 day',
      _ => m,
    };
