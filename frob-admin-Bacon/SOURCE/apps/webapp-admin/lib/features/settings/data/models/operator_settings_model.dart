import '../../domain/entities/operator_settings.dart';

class OperatorSettingsModel extends OperatorSettings {
  const OperatorSettingsModel({
    required super.refundCutoffHours,
    required super.reminderMilestones,
    required super.cancellationRemediationOptions,
  });

  factory OperatorSettingsModel.fromJson(Map<String, dynamic> j) => OperatorSettingsModel(
        refundCutoffHours: (j['refund_cutoff_hours'] as num?)?.toInt() ?? 48,
        reminderMilestones:
            ((j['reminder_milestones'] as List?) ?? const ['t_minus_1']).map((e) => '$e').toList(),
        cancellationRemediationOptions:
            ((j['cancellation_remediation_options'] as List?) ?? const ['refund', 'rebook', 'credit'])
                .map((e) => '$e')
                .toList(),
      );
}
