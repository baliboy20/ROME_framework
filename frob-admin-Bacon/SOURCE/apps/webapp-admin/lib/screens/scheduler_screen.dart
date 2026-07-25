import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../bloc/scheduler_cubit.dart';
import '../theme/tokens.dart';
import '../widgets/app_button.dart';
import '../widgets/app_field.dart';
import '../widgets/app_modal.dart';

/// A18 — Scheduler. Capacity guard (UXD-05), fan-out confirms (UXD-03/04),
/// no-guide non-blocking note (UXD-06). FINDING-001: real date/time/guide
/// inputs + an "edit existing departure" picker (was hard-coded create-only).
class SchedulerScreen extends StatelessWidget {
  const SchedulerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => SchedulerCubit(context.read())..startCreate(),
      child: const _SchedulerView(),
    );
  }
}

class _SchedulerView extends StatefulWidget {
  const _SchedulerView();
  @override
  State<_SchedulerView> createState() => _SchedulerViewState();
}

class _SchedulerViewState extends State<_SchedulerView> {
  final dateCtrl = TextEditingController();
  final timeCtrl = TextEditingController(text: '09:30');
  final capacityCtrl = TextEditingController(text: '10');

  List<Map<String, dynamic>> _departures = [];
  List<Map<String, dynamic>> _guides = [];
  List<Map<String, dynamic>> _tours = [];
  String? _editingId;
  String? _guideId;
  String? _tourId;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _loadLookups();
  }

  Future<void> _loadLookups() async {
    try {
      final d = await _api.getDepartures();
      final g = await _api.getGuides();
      final t = await _api.getAdminTours();
      if (!mounted) return;
      setState(() {
        _departures = d.cast<Map<String, dynamic>>();
        _guides = g.cast<Map<String, dynamic>>();
        _tours = t.cast<Map<String, dynamic>>();
      });
    } catch (_) {}
  }

  void _selectForEdit(String? id) {
    final cubit = context.read<SchedulerCubit>();
    if (id == null) {
      cubit.startCreate();
      setState(() {
        _editingId = null;
        _guideId = null;
      });
      return;
    }
    final dep = _departures.firstWhere((d) => d['id'].toString() == id, orElse: () => {});
    if (dep.isEmpty) return;
    final booked = (dep['confirmed_count'] as num?)?.toInt() ?? 0;
    final cap = (dep['capacity'] as num?)?.toInt() ?? 10;
    final gid = dep['guide_id']?.toString();
    cubit.startEdit(capacity: cap, currentBooked: booked, hasGuide: gid != null);
    setState(() {
      _editingId = id;
      _guideId = gid;
      capacityCtrl.text = cap.toString();
      _tourId = dep['tour_id']?.toString();
      dateCtrl.text = dep['date']?.toString() ?? '';
      timeCtrl.text = dep['time']?.toString() ?? '';
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SchedulerCubit, SchedulerState>(
      builder: (context, state) {
        final cubit = context.read<SchedulerCubit>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(state.isEdit ? 'Edit departure' : 'New departure', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Row(
                  children: [
                    const Text('Edit existing: ', style: FobText.body),
                    const SizedBox(width: 8),
                    DropdownButton<String?>(
                      value: _editingId,
                      hint: const Text('New departure'),
                      items: [
                        const DropdownMenuItem<String?>(value: null, child: Text('New departure')),
                        ..._departures.map((d) => DropdownMenuItem<String?>(
                              value: d['id'].toString(),
                              child: Text('${d['tour_id']} · ${d['date']} ${d['time']}'),
                            )),
                      ],
                      onChanged: _selectForEdit,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!state.isEdit) ...[
                      // Real tour dropdown (was free-text — could schedule
                      // against a non-existent tour_id). Only bookable
                      // (published) tours are offered for scheduling.
                      Row(
                        children: [
                          const Text('Tour: ', style: FobText.body),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButton<String?>(
                              key: const Key('scheduler-tour-dropdown'),
                              isExpanded: true,
                              value: _tourId,
                              hint: const Text('Select a tour'),
                              items: [
                                for (final t in _tours.where((t) => t['status'] == 'published'))
                                  DropdownMenuItem<String?>(
                                    value: t['id'].toString(),
                                    child: Text('${t['name'] ?? t['id']}'),
                                  ),
                              ],
                              onChanged: (v) => setState(() => _tourId = v),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: FobSpace.field),
                      AppField(label: 'Date (YYYY-MM-DD)', controller: dateCtrl, hint: '2026-08-15'),
                      const SizedBox(height: FobSpace.field),
                      AppField(label: 'Time (HH:MM)', controller: timeCtrl, hint: '09:30'),
                      const SizedBox(height: FobSpace.field),
                    ],
                    AppField(
                      key: const Key('capacity-field'),
                      label: 'Capacity',
                      controller: capacityCtrl,
                      keyboardType: TextInputType.number,
                      errorText: state.capacityError,
                      onChanged: (v) => cubit.setCapacity(int.tryParse(v) ?? 0),
                    ),
                    const SizedBox(height: FobSpace.field),
                    Row(
                      children: [
                        const Text('Guide: ', style: FobText.body),
                        const SizedBox(width: 8),
                        DropdownButton<String?>(
                          value: _guideId,
                          hint: const Text('None'),
                          items: [
                            const DropdownMenuItem<String?>(value: null, child: Text('None')),
                            ..._guides.map((g) => DropdownMenuItem<String?>(
                                  value: g['id'].toString(),
                                  child: Text(g['name']?.toString() ?? g['id'].toString()),
                                )),
                          ],
                          onChanged: (v) {
                            setState(() => _guideId = v);
                            cubit.setHasGuide(v != null);
                          },
                        ),
                      ],
                    ),
                    if (state.notReadyToRun)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Text('marked not ready to run', key: Key('not-ready-note'),
                            style: TextStyle(color: FobColors.orangeText, fontSize: 12)),
                      ),
                    if (state.saveError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(state.saveError!, style: const TextStyle(color: FobColors.pinkText, fontSize: 12.5)),
                      ),
                    const SizedBox(height: FobSpace.block),
                    Row(
                      children: [
                        AppButton(
                          key: const Key('save-departure-button'),
                          label: 'Save',
                          kind: AppButtonKind.primary,
                          loading: state.saving,
                          onPressed: state.canSave ? () => _saveWithFanOutConfirm(context, cubit, state) : null,
                        ),
                        if (state.isEdit && _editingId != null) ...[
                          const SizedBox(width: 12),
                          AppButton(
                            key: const Key('cancel-departure-button'),
                            label: 'Cancel departure',
                            kind: AppButtonKind.danger,
                            onPressed: () => _cancelWithConfirm(context, cubit),
                          ),
                        ],
                      ],
                    ),
                    if (state.saved)
                      const Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Text('Saved.', style: TextStyle(color: FobColors.limeText)),
                      ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _saveWithFanOutConfirm(BuildContext context, SchedulerCubit cubit, SchedulerState state) async {
    if (!state.isEdit && (_tourId == null || _tourId!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a tour to schedule against.')),
      );
      return;
    }
    if (state.isEdit && state.currentBooked > 0) {
      final proceed = await showFobModal<bool>(
        context: context,
        blocking: true,
        builder: (ctx) => _ConfirmDialog(
          key: const Key('notify-confirm-dialog'),
          message: 'This will notify ${state.currentBooked} customers of the change. Continue?',
          confirmLabel: 'Continue',
        ),
      );
      if (proceed != true) return;
    }
    await cubit.save(
      tourId: _tourId ?? '',
      date: dateCtrl.text,
      time: timeCtrl.text,
      guideId: _guideId,
      departureId: _editingId,
    );
  }

  Future<void> _cancelWithConfirm(BuildContext context, SchedulerCubit cubit) async {
    final proceed = await showFobModal<bool>(
      context: context,
      blocking: true,
      builder: (ctx) => _ConfirmDialog(
        key: const Key('cancel-confirm-dialog'),
        message: 'This will offer refund / rebook / credit to the customers already booked. Continue?',
        confirmLabel: 'Cancel departure',
        danger: true,
      ),
    );
    if (proceed == true && _editingId != null) {
      await cubit.cancelDeparture(_editingId!);
    }
  }
}

class _ConfirmDialog extends StatelessWidget {
  final String message;
  final String confirmLabel;
  final bool danger;
  const _ConfirmDialog({super.key, required this.message, required this.confirmLabel, this.danger = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(message, style: FobText.body),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(label: 'Back', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop(false)),
            const SizedBox(width: 8),
            AppButton(
              key: const Key('confirm-dialog-confirm'),
              label: confirmLabel,
              kind: danger ? AppButtonKind.danger : AppButtonKind.primary,
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ],
        ),
      ],
    );
  }
}
