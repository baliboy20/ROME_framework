import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../../../../widgets/app_modal.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/email_entities.dart';
import '../../domain/usecases/email_usecases.dart';
import '../bloc/archive_bloc.dart';

/// A5b — Email archive (REQ-NOTIF06). Inbound messages captured + categorised
/// (REQ-NOTIF05); tap a row to view the thread, link it (NOTIF07), or reply
/// in-tool (NOTIF09).
class EmailArchivePage extends StatelessWidget {
  const EmailArchivePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ArchiveBloc>(
      create: (_) => sl<ArchiveBloc>()..add(const LoadArchiveEvent()),
      child: const _ArchiveView(),
    );
  }
}

class _ArchiveView extends StatefulWidget {
  const _ArchiveView();
  @override
  State<_ArchiveView> createState() => _ArchiveViewState();
}

class _ArchiveViewState extends State<_ArchiveView> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  FobHue _hueFor(String categorisation) => switch (categorisation) {
        'linked' => FobHue.lime,
        'ambiguous' => FobHue.orange,
        _ => FobHue.cyan,
      };

  Future<void> _openThread(BuildContext context, ArchivedEmail e) async {
    final bloc = context.read<ArchiveBloc>();
    await showFobModal(
      context: context,
      blocking: false,
      builder: (_) => _ThreadModal(threadId: e.threadId),
    );
    // Refresh after a link/reply may have changed the thread.
    bloc.add(LoadArchiveEvent(_searchCtrl.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Email archive', style: FobText.pageTitle),
        const SizedBox(height: 6),
        const Text(
          'Every inbound message, captured and threaded. Unlinked or ambiguous messages need attention — open one to link it to a booking or enquiry, or reply in-tool.',
          style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
        ),
        const SizedBox(height: FobSpace.block),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _searchCtrl,
                onSubmitted: (v) => context.read<ArchiveBloc>().add(LoadArchiveEvent(v.trim())),
                decoration: InputDecoration(
                  hintText: 'Sender, keyword, booking or enquiry reference',
                  prefixIcon: const Icon(Icons.search, size: 18),
                  isDense: true,
                  filled: true,
                  fillColor: FobColors.surfaceBgLo,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(FobRadius.field), borderSide: BorderSide.none),
                ),
              ),
            ),
            const SizedBox(width: 8),
            AppButton(
              label: 'Search',
              kind: AppButtonKind.secondary,
              onPressed: () => context.read<ArchiveBloc>().add(LoadArchiveEvent(_searchCtrl.text.trim())),
            ),
          ],
        ),
        const SizedBox(height: FobSpace.card),
        BlocBuilder<ArchiveBloc, ArchiveState>(
          builder: (context, state) {
            if (state is ArchiveLoading || state is ArchiveInitial) {
              return const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()));
            }
            if (state is ArchiveFailure) {
              return Text(state.message, style: FobText.body);
            }
            final received = (state as ArchiveLoaded).results.received;
            if (received.isEmpty) {
              return const Padding(padding: EdgeInsets.all(24), child: Text('No emails match.', style: FobText.body));
            }
            return FobCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  for (var i = 0; i < received.length; i++) _row(context, received[i], i == received.length - 1),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _row(BuildContext context, ArchivedEmail e, bool last) {
    return InkWell(
      onTap: () => _openThread(context, e),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: last ? null : const Border(bottom: BorderSide(color: FobColors.hairlineWarm)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(e.fromAddress,
                            style: const TextStyle(fontFamily: FobText.sans, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                      ),
                      if (e.spam)
                        const Padding(
                          padding: EdgeInsets.only(left: 6),
                          child: PillLabel(text: 'SPAM', background: FobColors.pink, foreground: Colors.white),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(e.subject == null || e.subject!.isEmpty ? '(no subject)' : e.subject!,
                      style: const TextStyle(fontSize: 12.5, color: FobColors.textBody)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                PillLabel.hue(_hueFor(e.categorisation), e.categorisation),
                const SizedBox(height: 4),
                Text(e.receivedAt.length >= 10 ? e.receivedAt.substring(0, 10) : e.receivedAt,
                    style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Thread drill-down — messages, link (NOTIF07), reply (NOTIF09).
class _ThreadModal extends StatefulWidget {
  const _ThreadModal({required this.threadId});
  final String threadId;

  @override
  State<_ThreadModal> createState() => _ThreadModalState();
}

class _ThreadModalState extends State<_ThreadModal> {
  late Future<EmailThread?> _future = _load();
  final _bookingCtrl = TextEditingController();
  final _replyCtrl = TextEditingController();
  bool _busy = false;
  String? _notice;

  Future<EmailThread?> _load() async => (await sl<GetThread>()(widget.threadId)).valueOrNull;

  @override
  void dispose() {
    _bookingCtrl.dispose();
    _replyCtrl.dispose();
    super.dispose();
  }

  Future<void> _link() async {
    final id = _bookingCtrl.text.trim();
    if (id.isEmpty) {
      setState(() => _notice = 'Enter a booking id to link this thread.');
      return;
    }
    setState(() => _busy = true);
    final r = await sl<LinkThread>()(LinkThreadParams(widget.threadId, bookingId: id));
    setState(() {
      _busy = false;
      _notice = r.isSuccess ? null : 'Could not link.';
      if (r.isSuccess) _future = _load();
    });
  }

  Future<void> _reply() async {
    final body = _replyCtrl.text.trim();
    if (body.isEmpty) {
      setState(() => _notice = 'Add a reply before sending.');
      return;
    }
    setState(() => _busy = true);
    final r = await sl<ReplyToThread>()(ReplyParams(widget.threadId, body));
    setState(() {
      _busy = false;
      _notice = r.fold((f) => 'Reply failed.', (status) => 'Reply $status.');
      if (r.isSuccess) {
        _replyCtrl.clear();
        _future = _load();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 480, maxHeight: 560),
      child: FutureBuilder<EmailThread?>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()));
          }
          final t = snap.data;
          if (t == null) return const Text('Could not load the thread.', style: FobText.body);
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('THREAD', style: FobText.microLabel),
                  const Spacer(),
                  PillLabel.forStatus(t.categorisation),
                ],
              ),
              const SizedBox(height: 8),
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final m in t.received) _message(m),
                    ],
                  ),
                ),
              ),
              const FobDivider(),
              if (!t.isLinked) ...[
                const Text('Link this thread to a booking to reply.', style: TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(child: AppField(label: 'Booking id', controller: _bookingCtrl)),
                    const SizedBox(width: 8),
                    AppButton(label: 'Link', kind: AppButtonKind.primary, loading: _busy, onPressed: _link),
                  ],
                ),
              ] else ...[
                AppField(label: 'Reply', controller: _replyCtrl),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: AppButton(label: 'Send reply', kind: AppButtonKind.primary, loading: _busy, onPressed: _reply),
                ),
              ],
              if (_notice != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_notice!, style: const TextStyle(fontSize: 12, color: FobColors.orangeText)),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _message(ArchivedEmail m) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: FobColors.surfaceRaised,
          borderRadius: BorderRadius.circular(FobRadius.field),
          border: Border.all(color: FobColors.hairlineWarm),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(m.fromAddress, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: FobColors.textStrong)),
            const SizedBox(height: 2),
            Text(m.subject ?? '(no subject)', style: const TextStyle(fontSize: 12.5, color: FobColors.textBody)),
            if (m.body != null && m.body!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(m.body!, style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
            ],
          ],
        ),
      );
}
