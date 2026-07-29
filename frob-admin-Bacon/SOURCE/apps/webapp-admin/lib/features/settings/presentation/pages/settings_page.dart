import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../domain/entities/operator_settings.dart';
import '../bloc/settings_bloc.dart';

/// Owner-configurable operational policy (DR-16, EML reintegration) —
/// reorganised into tabs by FR-001 workstream 3.
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

class _SettingsViewState extends State<_SettingsView> with SingleTickerProviderStateMixin {
  // Tabs are deliberately only the two the sponsor asked for (About,
  // Notifications) plus the existing policy settings. No tab is speculated
  // into existence for a setting that has no stated purpose yet; the frame
  // exists so more can be added as they arise.
  late final TabController _tabs = TabController(length: 3, vsync: this);

  final _cutoffCtrl = TextEditingController();
  final _depositCtrl = TextEditingController();
  final _milestones = <String>{};
  final _remediation = <String>{};
  String _replyMode = 'auto';
  bool _hydrated = false;

  @override
  void dispose() {
    _tabs.dispose();
    _cutoffCtrl.dispose();
    _depositCtrl.dispose();
    super.dispose();
  }

  void _hydrate(OperatorSettings s) {
    _cutoffCtrl.text = s.refundCutoffHours.toString();
    // Pence -> pounds for display; the wire stays in pence (TDR-04).
    _depositCtrl.text = s.depositDefaultPence == 0
        ? ''
        : (s.depositDefaultPence / 100).toStringAsFixed(2);
    _replyMode = s.replyMode;
    _milestones
      ..clear()
      ..addAll(s.reminderMilestones);
    _remediation
      ..clear()
      ..addAll(s.cancellationRemediationOptions);
    _hydrated = true;
  }

  /// Pounds text -> pence. Empty means "no default deposit" (0).
  int? _depositPence() {
    final raw = _depositCtrl.text.trim().replaceAll('£', '');
    if (raw.isEmpty) return 0;
    final pounds = double.tryParse(raw);
    if (pounds == null || pounds < 0) return null;
    return (pounds * 100).round();
  }

  void _save(BuildContext context) {
    final messenger = ScaffoldMessenger.of(context);
    final cutoff = int.tryParse(_cutoffCtrl.text.trim());
    if (cutoff == null || cutoff < 0) {
      messenger.showSnackBar(const SnackBar(content: Text('Enter a valid cutoff (hours).')));
      return;
    }
    final deposit = _depositPence();
    if (deposit == null) {
      messenger.showSnackBar(
          const SnackBar(content: Text('Enter a valid deposit amount, or leave it blank for none.')));
      return;
    }
    if (_milestones.isEmpty || _remediation.isEmpty) {
      messenger.showSnackBar(const SnackBar(
          content: Text('Keep at least one reminder milestone and one remediation option.')));
      return;
    }
    context.read<SettingsBloc>().add(SaveSettingsEvent({
          'refund_cutoff_hours': cutoff,
          'reminder_milestones': _milestones.toList(),
          'cancellation_remediation_options': _remediation.toList(),
          'reply_mode': _replyMode,
          'deposit_default_pence': deposit,
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
            const Text(
              'Changes take effect immediately — no code change needed.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            const SizedBox(height: FobSpace.card),
            TabBar(
              controller: _tabs,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: FobColors.textStrong,
              unselectedLabelColor: FobColors.textMuted,
              indicatorColor: FobColors.pink,
              labelStyle: FobText.cardTitle,
              unselectedLabelStyle: FobText.cardTitle,
              tabs: const [
                Tab(text: 'Notifications'),
                Tab(text: 'Booking policy'),
                Tab(text: 'About'),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  SingleChildScrollView(child: _notificationsTab(context, loaded)),
                  SingleChildScrollView(child: _bookingPolicyTab(context, loaded)),
                  const SingleChildScrollView(child: _AboutTab()),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _saveButton(BuildContext context, SettingsLoaded loaded) => Align(
        alignment: Alignment.centerRight,
        child: AppButton(
          label: 'Save settings',
          kind: AppButtonKind.primary,
          loading: loaded.saving,
          onPressed: () => _save(context),
        ),
      );

  Widget _notificationsTab(BuildContext context, SettingsLoaded loaded) => FobCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FobSectionLabel('BOOKING CONFIRMATION'),
            const Text(
              'When a booking is paid, the customer is sent the confirmation — booking details, '
              'terms, disclaimer and payment arrangements. Choose whether that happens on its own '
              'or waits for you.',
              style: TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.45),
            ),
            const SizedBox(height: 10),
            RadioGroup<String>(
              groupValue: _replyMode,
              onChanged: (v) => setState(() => _replyMode = v ?? 'auto'),
              child: const Column(
                children: [
                  RadioListTile<String>(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    value: 'auto',
                    title: Text('Send automatically', style: FobText.body),
                    subtitle: Text('Goes out the moment payment clears.',
                        style: TextStyle(fontSize: 12, color: FobColors.textMuted)),
                  ),
                  RadioListTile<String>(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    value: 'manual',
                    title: Text('Send manually', style: FobText.body),
                    subtitle: Text(
                        'You send it from the booking screen. Same template, same content.',
                        style: TextStyle(fontSize: 12, color: FobColors.textMuted)),
                  ),
                ],
              ),
            ),
            // This is the constraint made visible rather than hidden. Without
            // saying so, "manual" reads as though the customer might get
            // nothing — and the absence of an "off" option looks like an
            // oversight instead of a deliberate guarantee.
            if (_replyMode == 'manual')
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  color: FobHue.cyan.background,
                  borderRadius: BorderRadius.circular(FobRadius.field),
                ),
                child: const Text(
                  'The confirmation is still always sent — it just waits for you. A customer who '
                  'pays and hears nothing assumes the booking failed, so it cannot be switched off.',
                  style: TextStyle(fontSize: 12, color: FobColors.cyanText, height: 1.45),
                ),
              ),
            const FobDivider(),
            FobSectionLabel('REMINDER MILESTONES'),
            const Text('Which pre-departure reminders send.',
                style: TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
            const SizedBox(height: 4),
            ...kAllReminderMilestones.map((m) => CheckboxListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  value: _milestones.contains(m),
                  title: Text(reminderMilestoneLabel(m), style: FobText.body),
                  onChanged: (v) =>
                      setState(() => v == true ? _milestones.add(m) : _milestones.remove(m)),
                )),
            const SizedBox(height: FobSpace.block),
            _saveButton(context, loaded),
          ],
        ),
      );

  Widget _bookingPolicyTab(BuildContext context, SettingsLoaded loaded) => FobCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FobSectionLabel('DEFAULT DEPOSIT'),
            const Text(
              'Offered by default when you take a booking. Leave blank for none. You can always '
              'set a different amount on an individual booking.',
              style: TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.45),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 160,
              child: TextField(
                controller: _depositCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: FobText.money,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  prefixText: '£',
                  hintText: 'none',
                ),
              ),
            ),
            const FobDivider(),
            FobSectionLabel('CANCELLATION REFUND CUTOFF'),
            const Text(
              'At or above this many hours before departure a full refund is automatic. Below it, '
              'there is no automated calculation — you enter the refund amount manually.',
              style: TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.45),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 160,
              child: TextField(
                controller: _cutoffCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                    border: OutlineInputBorder(), isDense: true, suffixText: 'hours'),
              ),
            ),
            const FobDivider(),
            FobSectionLabel('CANCELLATION REMEDIATION OPTIONS'),
            const Text("Which options you may offer when you cancel on the business's behalf.",
                style: TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
            const SizedBox(height: 4),
            ...kAllRemediationOptions.map((o) => CheckboxListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  value: _remediation.contains(o),
                  title: Text(o[0].toUpperCase() + o.substring(1), style: FobText.body),
                  onChanged: (v) =>
                      setState(() => v == true ? _remediation.add(o) : _remediation.remove(o)),
                )),
            const SizedBox(height: FobSpace.block),
            _saveButton(context, loaded),
          ],
        ),
      );
}

/// App version and build. Read from the bundle at runtime rather than
/// hard-coded, so it cannot drift from what was actually shipped.
class _AboutTab extends StatelessWidget {
  const _AboutTab();

  @override
  Widget build(BuildContext context) {
    return FobCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FobSectionLabel('APPLICATION'),
          const SizedBox(height: 6),
          FutureBuilder<PackageInfo>(
            future: PackageInfo.fromPlatform(),
            builder: (context, snap) {
              if (!snap.hasData) {
                return const Text('Reading version…',
                    style: TextStyle(fontSize: 12.5, color: FobColors.textMuted));
              }
              final i = snap.data!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _row('Name', i.appName),
                  _row('Version', i.version),
                  _row('Build', i.buildNumber.isEmpty ? '—' : i.buildNumber),
                  _row('Package', i.packageName),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  static Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 110, child: Text(label, style: FobText.microLabel)),
            Expanded(child: SelectableText(value, style: FobText.body)),
          ],
        ),
      );
}
