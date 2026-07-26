import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../../../../widgets/app_modal.dart';
import '../bloc/scheduler_bloc.dart';

/// A18 — Scheduler. Capacity guard (UXD-05), fan-out confirms (UXD-03/04),
/// no-guide non-blocking note (UXD-06).
class SchedulerPage extends StatelessWidget {
  const SchedulerPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SchedulerBloc>(
      create: (_) => sl<SchedulerBloc>()..add(const LoadSchedulerEvent()),
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

  @override
  void dispose() {
    dateCtrl.dispose();
    timeCtrl.dispose();
    capacityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SchedulerBloc, SchedulerState>(
      // When an existing departure is picked for edit, sync the text fields.
      listenWhen: (prev, curr) => prev.editingId != curr.editingId,
      listener: (context, state) {
        if (state.isEdit) {
          final dep = state.departures.where((d) => d.id == state.editingId).firstOrNull;
          if (dep != null) {
            dateCtrl.text = dep.date;
            timeCtrl.text = dep.time;
            capacityCtrl.text = dep.capacity.toString();
          }
        } else {
          dateCtrl.clear();
          timeCtrl.text = '09:30';
          capacityCtrl.text = '10';
        }
      },
      builder: (context, state) {
        final bloc = context.read<SchedulerBloc>();
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
                      value: state.editingId,
                      hint: const Text('New departure'),
                      items: [
                        const DropdownMenuItem<String?>(value: null, child: Text('New departure')),
                        ...state.departures.map((d) => DropdownMenuItem<String?>(
                              value: d.id,
                              child: Text('${d.tourId} · ${d.date} ${d.time}'),
                            )),
                      ],
                      onChanged: (v) => bloc.add(SelectDepartureForEditEvent(v)),
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
                      Row(
                        children: [
                          const Text('Tour: ', style: FobText.body),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButton<String?>(
                              key: const Key('scheduler-tour-dropdown'),
                              isExpanded: true,
                              value: state.tourId,
                              hint: const Text('Select a tour'),
                              items: [
                                for (final t in state.publishedTours)
                                  DropdownMenuItem<String?>(value: t.id, child: Text(t.name.isEmpty ? t.id : t.name)),
                              ],
                              onChanged: (v) => bloc.add(SetTourEvent(v)),
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
                      onChanged: (v) => bloc.add(SetCapacityEvent(int.tryParse(v) ?? 0)),
                    ),
                    const SizedBox(height: FobSpace.field),
                    Row(
                      children: [
                        const Text('Guide: ', style: FobText.body),
                        const SizedBox(width: 8),
                        DropdownButton<String?>(
                          value: state.guideId,
                          hint: const Text('None'),
                          items: [
                            const DropdownMenuItem<String?>(value: null, child: Text('None')),
                            ...state.guides.map((g) => DropdownMenuItem<String?>(value: g.id, child: Text(g.name))),
                          ],
                          onChanged: (v) => bloc.add(SetGuideEvent(v)),
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
                          onPressed: state.canSave ? () => _saveWithConfirm(context, bloc, state) : null,
                        ),
                        if (state.isEdit && state.editingId != null) ...[
                          const SizedBox(width: 12),
                          AppButton(
                            key: const Key('cancel-departure-button'),
                            label: 'Cancel departure',
                            kind: AppButtonKind.danger,
                            onPressed: () => _cancelWithConfirm(context, bloc),
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

  Future<void> _saveWithConfirm(BuildContext context, SchedulerBloc bloc, SchedulerState state) async {
    if (!state.isEdit && (state.tourId == null || state.tourId!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a tour to schedule against.')));
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
    bloc.add(SaveDepartureFormEvent(date: dateCtrl.text, time: timeCtrl.text));
  }

  Future<void> _cancelWithConfirm(BuildContext context, SchedulerBloc bloc) async {
    final notice = await showFobModal<Map<String, dynamic>>(
      context: context,
      blocking: true,
      builder: (ctx) => const _CancelNoticeDialog(),
    );
    if (notice != null) bloc.add(CancelDepartureFormEvent(notice: notice));
  }
}

/// REQ-TOUR07 cancellation notice — Explanation Block + settings-gated
/// remediation choice + optional single-use discount code (F3).
class _CancelNoticeDialog extends StatefulWidget {
  const _CancelNoticeDialog();
  @override
  State<_CancelNoticeDialog> createState() => _CancelNoticeDialogState();
}

class _CancelNoticeDialogState extends State<_CancelNoticeDialog> {
  final _explanationCtrl = TextEditingController();
  final _discountCtrl = TextEditingController();
  String? _remediation;

  @override
  void dispose() {
    _explanationCtrl.dispose();
    _discountCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Cancel departure', style: FobText.cardTitle),
        const SizedBox(height: 4),
        const Text(
          'Notifies the party leader and every opted-in co-leader. Add an Explanation Block and, if offered, a remediation and rebook code.',
          style: TextStyle(fontSize: 12, color: FobColors.textMuted),
        ),
        const SizedBox(height: FobSpace.card),
        AppField(label: 'Explanation (shown to customers)', controller: _explanationCtrl),
        const SizedBox(height: FobSpace.field),
        Row(
          children: [
            const Text('Remediation: ', style: FobText.body),
            const SizedBox(width: 8),
            DropdownButton<String?>(
              value: _remediation,
              hint: const Text('None'),
              items: const [
                DropdownMenuItem<String?>(value: null, child: Text('None')),
                DropdownMenuItem<String?>(value: 'refund', child: Text('Refund')),
                DropdownMenuItem<String?>(value: 'rebook', child: Text('Rebook')),
                DropdownMenuItem<String?>(value: 'credit', child: Text('Credit')),
              ],
              onChanged: (v) => setState(() => _remediation = v),
            ),
          ],
        ),
        const SizedBox(height: FobSpace.field),
        AppField(label: 'Discount / voucher code (optional)', controller: _discountCtrl),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(label: 'Back', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop()),
            const SizedBox(width: 8),
            AppButton(
              key: const Key('confirm-dialog-confirm'),
              label: 'Cancel departure',
              kind: AppButtonKind.danger,
              onPressed: () => Navigator.of(context).pop(<String, dynamic>{
                if (_explanationCtrl.text.trim().isNotEmpty) 'explanationBlock': _explanationCtrl.text.trim(),
                if (_remediation != null) 'remediation': _remediation,
                if (_discountCtrl.text.trim().isNotEmpty) 'discountCode': _discountCtrl.text.trim(),
              }),
            ),
          ],
        ),
      ],
    );
  }
}

class _ConfirmDialog extends StatelessWidget {
  final String message;
  final String confirmLabel;
  const _ConfirmDialog({super.key, required this.message, required this.confirmLabel});

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
              kind: AppButtonKind.primary,
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ],
        ),
      ],
    );
  }
}
