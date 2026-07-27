import 'package:flutter/material.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/usecases/email_usecases.dart';

/// A5d — Emails console (CR-001 #2). One sortable list of every email (inbound +
/// sent), groupable into chains; selecting a row opens a floating detail card.
/// Several cards can be open at once; they live in this page's tree, so they
/// auto-dismiss when the operator navigates away. Reply opens a compose dialog.
class EmailsConsolePage extends StatefulWidget {
  const EmailsConsolePage({super.key});
  @override
  State<EmailsConsolePage> createState() => _EmailsConsoleState();
}

/// One unified row across inbound (received_emails) and sent (message) sources.
class _Mail {
  final String id, category, sender, subject, date, threadId, body, direction;
  _Mail({
    required this.id,
    required this.category,
    required this.sender,
    required this.subject,
    required this.date,
    required this.threadId,
    required this.body,
    required this.direction,
  });
}

enum _SortKey { category, sender, subject, date }

class _EmailsConsoleState extends State<EmailsConsolePage> {
  late Future<List<_Mail>> _future = _load();
  _SortKey _sort = _SortKey.date;
  bool _asc = false;
  bool _chains = false;
  final List<_Mail> _open = []; // floating detail cards, page-scoped

  Future<List<_Mail>> _load() async {
    final res = await sl<SearchArchive>()('');
    return res.fold((_) => <_Mail>[], (r) {
      final rows = <_Mail>[];
      for (final e in r.received) {
        rows.add(_Mail(
          id: e.id,
          category: e.spam ? 'spam' : e.categorisation,
          sender: e.fromAddress,
          subject: (e.subject == null || e.subject!.isEmpty) ? '(no subject)' : e.subject!,
          date: e.receivedAt,
          threadId: e.threadId,
          body: e.body ?? '',
          direction: 'in',
        ));
      }
      for (final s in r.sent) {
        rows.add(_Mail(
          id: s.id,
          category: 'sent',
          sender: s.recipient,
          subject: s.event,
          date: s.createdAt,
          threadId: '',
          body: 'Status: ${s.status}',
          direction: 'out',
        ));
      }
      return rows;
    });
  }

  List<_Mail> _sorted(List<_Mail> rows) {
    String key(_Mail m) => switch (_sort) {
          _SortKey.category => m.category,
          _SortKey.sender => m.sender.toLowerCase(),
          _SortKey.subject => m.subject.toLowerCase(),
          _SortKey.date => m.date,
        };
    final out = [...rows]..sort((a, b) => key(a).compareTo(key(b)));
    return _asc ? out : out.reversed.toList();
  }

  void _tapHeader(_SortKey k) => setState(() {
        if (_sort == k) {
          _asc = !_asc;
        } else {
          _sort = k;
          _asc = false;
        }
      });

  void _openCard(_Mail m) => setState(() {
        if (!_open.any((o) => o.id == m.id)) _open.add(m);
      });
  void _closeCard(String id) => setState(() => _open.removeWhere((o) => o.id == id));

  @override
  Widget build(BuildContext context) {
    // Every route is wrapped in a SingleChildScrollView (unbounded height), so
    // the page must supply a bounded height itself before using Expanded/Stack.
    final viewH = (MediaQuery.of(context).size.height - 190).clamp(420.0, 4000.0);
    return SizedBox(
      height: viewH,
      child: Stack(
      children: [
        // ---- base: header + controls + list ----
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Emails', style: FobText.pageTitle),
            const SizedBox(height: 6),
            Row(children: [
              const Expanded(
                child: Text('Every inbound and sent email. Sort any column; group into chains; click a row to open it.',
                    style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5)),
              ),
              _ChainToggle(on: _chains, onTap: () => setState(() => _chains = !_chains)),
            ]),
            const SizedBox(height: FobSpace.block),
            Expanded(
              child: FutureBuilder<List<_Mail>>(
                future: _future,
                builder: (context, snap) {
                  if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                  final rows = _sorted(snap.data!);
                  if (rows.isEmpty) return const Text('No emails yet.', style: FobText.body);
                  return Card(child: _table(rows));
                },
              ),
            ),
          ],
        ),
        // ---- floating detail cards (multiple, cascading) ----
        ..._open.asMap().entries.map((e) {
          final i = e.key;
          return Positioned(
            top: 8.0 + i * 34,
            right: 8.0 + i * 34,
            child: _DetailCard(
              mail: e.value,
              onClose: () => _closeCard(e.value.id),
              onReplied: () => setState(() => _future = _load()),
            ),
          );
        }),
      ],
      ),
    );
  }

  Widget _table(List<_Mail> rows) {
    Widget hdr(String label, _SortKey k, {int flex = 1}) => Expanded(
          flex: flex,
          child: InkWell(
            onTap: () => _tapHeader(k),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Text(label.toUpperCase(), style: FobText.microLabel),
                if (_sort == k)
                  Icon(_asc ? Icons.arrow_upward : Icons.arrow_downward, size: 12, color: FobColors.pink),
              ]),
            ),
          ),
        );

    final body = <Widget>[];
    if (_chains) {
      // group by threadId (sent + threadless grouped under '—')
      final groups = <String, List<_Mail>>{};
      for (final m in rows) {
        groups.putIfAbsent(m.threadId.isEmpty ? '—' : m.threadId, () => []).add(m);
      }
      groups.forEach((tid, ms) {
        body.add(Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 2),
          child: Text(tid == '—' ? 'No chain' : 'Chain ${tid.substring(0, tid.length.clamp(0, 8))}',
              style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.pinkText, fontWeight: FontWeight.w600)),
        ));
        body.addAll(ms.map(_row));
      });
    } else {
      body.addAll(rows.map(_row));
    }

    return Padding(
      padding: const EdgeInsets.all(FobSpace.card),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            hdr('Category', _SortKey.category, flex: 2),
            hdr('Sender', _SortKey.sender, flex: 3),
            hdr('Subject', _SortKey.subject, flex: 4),
            hdr('Date', _SortKey.date, flex: 2),
          ]),
          const Divider(height: 12),
          Expanded(child: ListView(children: body)),
        ],
      ),
    );
  }

  Widget _row(_Mail m) => InkWell(
        onTap: () => _openCard(m),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 9),
          child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Expanded(flex: 2, child: PillLabel.forStatus(m.category)),
            Expanded(flex: 3, child: Text(m.sender, style: FobText.body, overflow: TextOverflow.ellipsis)),
            Expanded(flex: 4, child: Text(m.subject, style: FobText.body, overflow: TextOverflow.ellipsis)),
            Expanded(flex: 2, child: Text(_fmt(m.date), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11.5, color: FobColors.textMuted))),
          ]),
        ),
      );
}

String _fmt(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final l = dt.toLocal();
  return '${l.day} ${mo[l.month - 1]}, ${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
}

class _ChainToggle extends StatelessWidget {
  final bool on;
  final VoidCallback onTap;
  const _ChainToggle({required this.on, required this.onTap});
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: on ? FobHue.pink.background : FobColors.surfaceCard,
            border: Border.all(color: on ? FobColors.pink : FobColors.hairline),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(on ? Icons.account_tree : Icons.account_tree_outlined, size: 14, color: on ? FobColors.pink : FobColors.textMuted),
            const SizedBox(width: 6),
            Text('Chains', style: TextStyle(fontSize: 12.5, color: on ? FobColors.pinkText : FobColors.textMuted, fontWeight: FontWeight.w600)),
          ]),
        ),
      );
}

/// A floating, dismissible detail card. Reply opens a compose dialog.
class _DetailCard extends StatelessWidget {
  final _Mail mail;
  final VoidCallback onClose;
  final VoidCallback onReplied;
  const _DetailCard({required this.mail, required this.onClose, required this.onReplied});

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 10,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 420,
        constraints: const BoxConstraints(maxHeight: 460),
        decoration: BoxDecoration(
          color: FobColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: FobColors.hairline),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 10, 8),
              child: Row(children: [
                Expanded(child: Text(mail.subject, style: FobText.cardTitle, maxLines: 2, overflow: TextOverflow.ellipsis)),
                IconButton(icon: const Icon(Icons.close, size: 18), onPressed: onClose, tooltip: 'Close'),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              child: Row(children: [
                PillLabel.forStatus(mail.category),
                const SizedBox(width: 10),
                Expanded(child: Text('${mail.direction == 'in' ? 'From' : 'To'} ${mail.sender}',
                    style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted), overflow: TextOverflow.ellipsis)),
                Text(_fmt(mail.date), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
              ]),
            ),
            const Divider(height: 20),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Text(mail.body.isEmpty ? '(no content)' : mail.body, style: FobText.body),
              ),
            ),
            if (mail.direction == 'in' && mail.threadId.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(14),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.icon(
                    icon: const Icon(Icons.reply, size: 16),
                    label: const Text('Reply'),
                    onPressed: () => _reply(context),
                  ),
                ),
              )
            else
              const SizedBox(height: 14),
          ],
        ),
      ),
    );
  }

  Future<void> _reply(BuildContext context) async {
    final ctrl = TextEditingController();
    final send = await showDialog<bool>(
      context: context,
      builder: (dctx) => AlertDialog(
        title: Text('Reply to ${mail.sender}'),
        content: SizedBox(
          width: 460,
          child: TextField(
            controller: ctrl,
            maxLines: 7,
            autofocus: true,
            decoration: const InputDecoration(hintText: 'Type your reply…', border: OutlineInputBorder()),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(dctx, true), child: const Text('Send reply')),
        ],
      ),
    );
    final text = ctrl.text.trim();
    ctrl.dispose();
    if (send != true || text.isEmpty || !context.mounted) return;
    final r = await sl<ReplyToThread>()(ReplyParams(mail.threadId, text));
    if (!context.mounted) return;
    r.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message), backgroundColor: FobColors.error)),
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reply sent.')));
        onReplied();
      },
    );
  }
}
