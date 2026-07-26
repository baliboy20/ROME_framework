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

  const OperatorSettings({
    required this.refundCutoffHours,
    required this.reminderMilestones,
    required this.cancellationRemediationOptions,
  });

  OperatorSettings copyWith({
    int? refundCutoffHours,
    List<String>? reminderMilestones,
    List<String>? cancellationRemediationOptions,
  }) =>
      OperatorSettings(
        refundCutoffHours: refundCutoffHours ?? this.refundCutoffHours,
        reminderMilestones: reminderMilestones ?? this.reminderMilestones,
        cancellationRemediationOptions:
            cancellationRemediationOptions ?? this.cancellationRemediationOptions,
      );

  @override
  List<Object?> get props => [refundCutoffHours, reminderMilestones, cancellationRemediationOptions];
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
