import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../domain/entities/operator_settings.dart';
import '../bloc/settings_bloc.dart';

/// Owner-configurable operational policy (DR-16, EML reintegration).
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SettingsBloc>(
      create: (_) => sl<SettingsBloc>()..add(const LoadSettingsEvent()),
      child: const _SettingsView(),
    );
  }
}

class _SettingsView extends StatefulWidget {
  const _SettingsView();
  @override
  State<_SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<_SettingsView> {
  final _cutoffCtrl = TextEditingController();
  final _milestones = <String>{};
  final _remediation = <String>{};
  bool _hydrated = false;

  @override
  void dispose() {
    _cutoffCtrl.dispose();
    super.dispose();
  }

  void _hydrate(OperatorSettings s) {
    _cutoffCtrl.text = s.refundCutoffHours.toString();
    _milestones
      ..clear()
      ..addAll(s.reminderMilestones);
    _remediation
      ..clear()
      ..addAll(s.cancellationRemediationOptions);
    _hydrated = true;
  }

  void _save(BuildContext context) {
    final cutoff = int.tryParse(_cutoffCtrl.text.trim());
    if (cutoff == null || cutoff < 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid cutoff (hours).')));
      return;
    }
    if (_milestones.isEmpty || _remediation.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Keep at least one reminder milestone and one remediation option.')));
      return;
    }
    context.read<SettingsBloc>().add(SaveSettingsEvent({
          'refund_cutoff_hours': cutoff,
          'reminder_milestones': _milestones.toList(),
          'cancellation_remediation_options': _remediation.toList(),
        }));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SettingsBloc, SettingsState>(
      listenWhen: (p, c) => c is SettingsLoaded && c.notice != null,
      listener: (context, state) {
        if (state is SettingsLoaded && state.notice != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!)));
        }
      },
      builder: (context, state) {
        if (state is SettingsLoading || state is SettingsInitial) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is SettingsFailure) {
          return Text(state.message, style: FobText.body);
        }
        final loaded = state as SettingsLoaded;
        if (!_hydrated) _hydrate(loaded.settings);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Settings', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text('Owner-configurable operational policy. Changes take effect immediately — no code change needed.',
                style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5)),
            const SizedBox(height: FobSpace.block),
            FobCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FobSectionLabel('CANCELLATION REFUND CUTOFF'),
                  const Text(
                    'At or above this many hours before departure a full refund is automatic. Below it, there is no automated calculation — you enter the refund amount manually.',
                    style: TextStyle(fontSize: 12.5, color: FobColors.textMuted),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: 160,
                    child: TextField(
                      controller: _cutoffCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, suffixText: 'hours'),
                    ),
                  ),
                  const FobDivider(),
                  FobSectionLabel('REMINDER MILESTONES'),
                  const Text('Which pre-departure reminders send.', style: TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
                  const SizedBox(height: 4),
                  ...kAllReminderMilestones.map((m) => CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        controlAffinity: ListTileControlAffinity.leading,
                        value: _milestones.contains(m),
                        title: Text(reminderMilestoneLabel(m), style: FobText.body),
                        onChanged: (v) => setState(() => v == true ? _milestones.add(m) : _milestones.remove(m)),
                      )),
                  const FobDivider(),
                  FobSectionLabel('CANCELLATION REMEDIATION OPTIONS'),
                  const Text('Which options you may offer when you cancel on the business\'s behalf.',
                      style: TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
                  const SizedBox(height: 4),
                  ...kAllRemediationOptions.map((o) => CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        controlAffinity: ListTileControlAffinity.leading,
                        value: _remediation.contains(o),
                        title: Text(o[0].toUpperCase() + o.substring(1), style: FobText.body),
                        onChanged: (v) => setState(() => v == true ? _remediation.add(o) : _remediation.remove(o)),
                      )),
                  const SizedBox(height: FobSpace.block),
                  Align(
                    alignment: Alignment.centerRight,
                    child: AppButton(
                      label: 'Save settings',
                      kind: AppButtonKind.primary,
                      loading: loaded.saving,
                      onPressed: () => _save(context),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
