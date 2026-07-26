import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../../../../widgets/app_modal.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/enquiry.dart';
import '../../domain/usecases/send_enquiry_reply.dart';
import '../bloc/enquiries_bloc.dart';

/// A9 — Enquiries. Open/Overdue/Spam tabs (UXD-12).
class EnquiriesPage extends StatelessWidget {
  const EnquiriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<EnquiriesBloc>(
      create: (_) => sl<EnquiriesBloc>()..add(const LoadEnquiriesEvent()),
      child: const _EnquiriesView(),
    );
  }
}

class _EnquiriesView extends StatelessWidget {
  const _EnquiriesView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EnquiriesBloc, EnquiriesState>(
      builder: (context, state) {
        final tab = state is EnquiriesLoaded ? state.tab : EnquiryTab.open;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enquiries', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Row(
              children: [
                _tab(context, 'Open', EnquiryTab.open, tab),
                _tab(context, 'Overdue', EnquiryTab.overdue, tab),
                _tab(context, 'Spam', EnquiryTab.spam, tab),
              ],
            ),
            const SizedBox(height: FobSpace.card),
            if (state is EnquiriesLoadFailure)
              Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body)))
            else
              Card(
                child: FobDataTable<Enquiry>(
                  loading: state is EnquiriesLoading || state is EnquiriesInitial,
                  emptyText: 'No enquiries to show.',
                  rows: state is EnquiriesLoaded ? state.filtered : const [],
                  columns: [
                    FobColumn(label: 'Prospect', flex: 2, render: (e) => Text(e.prospectName, style: FobText.body)),
                    FobColumn(label: 'Tour', flex: 2, render: (e) => Text(e.tourName, style: FobText.body)),
                    FobColumn(
                      label: 'Status',
                      render: (e) => Text(
                        e.overdue ? 'Overdue' : (e.spam ? 'Spam' : 'Open'),
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: e.overdue ? FobColors.orangeText : FobColors.textMuted,
                        ),
                      ),
                    ),
                    FobColumn(
                      label: '',
                      render: (e) => AppButton(
                        kind: AppButtonKind.row,
                        label: 'Reply',
                        onPressed: () => _openReply(context, e),
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

  Widget _tab(BuildContext context, String label, EnquiryTab t, EnquiryTab active) {
    final isActive = t == active;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: TextButton(
        onPressed: () => context.read<EnquiriesBloc>().add(SetEnquiryTabEvent(t)),
        style: TextButton.styleFrom(
          backgroundColor: isActive ? FobColors.surfaceCard : null,
          foregroundColor: isActive ? FobColors.textStrong : FobColors.textMuted,
        ),
        child: Text(label, style: TextStyle(fontWeight: isActive ? FontWeight.w700 : FontWeight.w500)),
      ),
    );
  }

  void _openReply(BuildContext context, Enquiry e) {
    final bloc = context.read<EnquiriesBloc>();
    showFobModal(
      context: context,
      blocking: false,
      builder: (_) => _ReplyModal(
        enquiry: e,
        onSent: () => bloc.add(const LoadEnquiriesEvent()),
      ),
    );
  }
}

/// DR-17 — compose and send an in-tool email reply to an enquiry.
class _ReplyModal extends StatefulWidget {
  const _ReplyModal({required this.enquiry, required this.onSent});
  final Enquiry enquiry;
  final VoidCallback onSent;

  @override
  State<_ReplyModal> createState() => _ReplyModalState();
}

class _ReplyModalState extends State<_ReplyModal> {
  final _ctrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final body = _ctrl.text.trim();
    if (body.isEmpty) {
      setState(() => _error = 'Add a reply before sending.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final r = await sl<SendEnquiryReply>()(SendReplyParams(widget.enquiry.id, body));
    if (!mounted) return;
    r.fold(
      (f) => setState(() {
        _busy = false;
        _error = f.message;
      }),
      (_) {
        widget.onSent();
        Navigator.of(context).pop();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Reply — ${widget.enquiry.prospectName}', style: FobText.cardTitle),
        const SizedBox(height: 4),
        const Text(
          'Sent by email from bookings@friendsonbikes.uk and marks the enquiry responded (DR-17). Phone/WhatsApp enquiries are handled off-system.',
          style: TextStyle(fontSize: 12, color: FobColors.textMuted),
        ),
        const SizedBox(height: FobSpace.card),
        AppField(label: 'Your reply', controller: _ctrl),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_error!, style: const TextStyle(fontSize: 12, color: FobColors.error)),
          ),
        const SizedBox(height: FobSpace.block),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            AppButton(label: 'Cancel', kind: AppButtonKind.ghost, onPressed: () => Navigator.of(context).pop()),
            const SizedBox(width: 8),
            AppButton(label: 'Send reply', kind: AppButtonKind.primary, loading: _busy, onPressed: _send),
          ],
        ),
      ],
    );
  }
}
