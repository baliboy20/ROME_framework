import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../state/tour_cubit.dart';
import '../theme/parchment_tokens.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

/// REQ-OPS09 incident `type` enum, keyed by its guide-facing label.
const _incidentTypes = {'Injury': 'injury', 'RTC': 'rtc', 'Medical': 'medical'};

/// G10 — Emergency / incident logger (UXD-G-06). Primary action explicitly
/// states it alerts the owner immediately; destructive/urgent styling. No
/// photo capture (UXC-CMP-4).
class G10EmergencyScreen extends StatefulWidget {
  const G10EmergencyScreen({super.key});

  @override
  State<G10EmergencyScreen> createState() => _G10EmergencyScreenState();
}

class _G10EmergencyScreenState extends State<G10EmergencyScreen> {
  final _natureController = TextEditingController();
  final _locationController = TextEditingController();
  final _accountController = TextEditingController();
  String? _type;
  bool _submitted = false;

  bool get _valid =>
      _type != null &&
      _natureController.text.trim().isNotEmpty &&
      _locationController.text.trim().isNotEmpty &&
      _accountController.text.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return GuideScaffold(
      eyebrow: 'G10 · EMERGENCY',
      title: 'Emergency logger',
      body: _submitted
          ? Card(
              color: FobColors.accentLime.withValues(alpha: 0.12),
              child: const Padding(
                padding: EdgeInsets.all(FobSpacing.card),
                child: Text('Logged. William has been alerted.',
                    style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Incident type'),
                const SizedBox(height: 8),
                CategoryChips(
                  options: _incidentTypes.keys.toList(),
                  value: _type,
                  onChanged: (v) => setState(() => _type = v),
                ),
                const SizedBox(height: FobSpacing.field),
                TextField(
                  controller: _natureController,
                  decoration: const InputDecoration(labelText: 'Nature of emergency'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: FobSpacing.field),
                TextField(
                  controller: _locationController,
                  decoration: const InputDecoration(labelText: 'Location'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: FobSpacing.field),
                TextField(
                  controller: _accountController,
                  decoration: const InputDecoration(labelText: 'Account'),
                  minLines: 3,
                  maxLines: 6,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),
                FobButton(
                  label: 'Log emergency & alert William',
                  variant: FobButtonVariant.danger,
                  onPressed: _valid
                      ? () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final outcome = await cubit.logEmergency(
                            nature: _natureController.text.trim(),
                            location: _locationController.text.trim(),
                            type: _incidentTypes[_type]!,
                            account: _accountController.text.trim(),
                          );
                          if (!mounted) return;
                          if (outcome.synced) {
                            setState(() => _submitted = true);
                          } else {
                            messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                          }
                        }
                      : null,
                  disabledReason: _valid ? null : 'Choose a type and fill in nature, location and account',
                ),
              ],
            ),
    );
  }
}
