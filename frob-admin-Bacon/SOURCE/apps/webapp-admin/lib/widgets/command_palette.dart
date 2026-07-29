import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../screens/admin_shell.dart';
import '../theme/tokens.dart';

/// FR-001 workstream 4 — quick-navigation palette.
///
/// Type a fragment ("pay") and get the matching destinations ("Payments").
/// Opened from the top-bar icon or Cmd-K; closed with the close button or Esc.
///
/// SCOPE: destinations only, not records. The request was "quicklinks to the
/// menu navigation", and record search would pull in every repository plus
/// paging — a materially larger capability. If searching for a booking
/// reference is wanted later, it is an addition, not a rework.
///
/// Single-operator console, so results need no permission filtering — every
/// destination is reachable by the only user.

/// One searchable destination, derived from [kNavGroups] — the same list the
/// sidebar renders. Deriving rather than duplicating is deliberate: a
/// hand-maintained second list would drift from the sidebar the first time a
/// screen was added, and nothing would catch it.
class PaletteEntry {
  final String surfaceId;
  final String label;
  final String route;
  final String group;

  const PaletteEntry(this.surfaceId, this.label, this.route, this.group);

  /// Extra words that should find this entry but do not appear in its label.
  /// Without these, the sponsor's own example works ("pay" → Payments) but the
  /// obvious follow-up does not ("refund" → Payments), which would feel broken.
  static const _synonyms = <String, List<String>>{
    '/payments': ['refund', 'refunds', 'money', 'charge', 'stripe'],
    '/enquiries': ['enquiry', 'inquiry', 'inquiries', 'lead', 'question'],
    '/bookings': ['booking', 'customer', 'reservation'],
    '/new-booking': ['create booking', 'add booking', 'take booking'],
    '/calendar': ['departures', 'schedule', 'diary'],
    '/scheduler': ['departure', 'create departure'],
    '/bike-allocation': ['assign bikes', 'allocate'],
    '/alerts': ['notifications', 'warnings'],
    '/deliverability': ['bounce', 'bounces', 'complaints', 'spam'],
    '/audit': ['history', 'log', 'who did'],
    '/emails-console': ['mail', 'inbox', 'messages'],
    '/email-archive': ['sent mail', 'mail history'],
    '/email-templates': ['template', 'wording', 'confirmation email'],
    '/publish': ['website', 'content', 'seo'],
    '/incidents': ['incident', 'accident', 'injury'],
    '/hazards': ['hazard', 'risk', 'danger'],
    '/fleet-readiness': ['readiness', 'ready', 'clear to service'],
    '/bikes': ['bike', 'cycle', 'cycles'],
    '/add-bike': ['new bike', 'register bike'],
    '/equipment': ['helmet', 'helmets', 'kit', 'gear'],
    '/flagged-bike': ['flagged', 'broken bike', 'faulty'],
    '/compliance': ['insurance', 'certificate', 'expiry', 'expiries'],
    '/settings': ['config', 'configuration', 'preferences', 'options', 'version'],
    '/tours': ['tour', 'route', 'routes', 'catalogue'],
  };

  List<String> get _haystack => [
        label.toLowerCase(),
        group.toLowerCase(),
        surfaceId.toLowerCase(),
        ...?_synonyms[route],
      ];

  /// Rank: lower is better. `null` means no match.
  ///
  /// Ordering matters more than cleverness here. Someone typing "pay" wants
  /// Payments first, not an alphabetical list containing it. So: label prefix
  /// beats label substring, which beats a synonym or group hit.
  int? score(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return 0;
    final lowerLabel = label.toLowerCase();
    if (lowerLabel.startsWith(q)) return 0;
    if (lowerLabel.contains(q)) return 1;
    if (surfaceId.toLowerCase() == q) return 1;
    for (final h in _haystack.skip(1)) {
      if (h.startsWith(q)) return 2;
      if (h.contains(q)) return 3;
    }
    return null;
  }
}

/// Flattened destination list, derived from the sidebar's own definition.
final List<PaletteEntry> kPaletteEntries = [
  for (final g in kNavGroups)
    for (final leaf in g.leaves) PaletteEntry(leaf.code, leaf.label, leaf.route, g.title),
];

List<PaletteEntry> searchDestinations(String query, {List<PaletteEntry>? source}) {
  final entries = source ?? kPaletteEntries;
  final scored = <({PaletteEntry e, int rank})>[];
  for (final e in entries) {
    final s = e.score(query);
    if (s != null) scored.add((e: e, rank: s));
  }
  scored.sort((a, b) {
    final byRank = a.rank.compareTo(b.rank);
    return byRank != 0 ? byRank : a.e.label.compareTo(b.e.label);
  });
  return scored.map((s) => s.e).toList();
}

/// Opens the palette. Returns when it closes.
Future<void> showCommandPalette(BuildContext context) => showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.28),
      builder: (_) => const _CommandPalette(),
    );

class _CommandPalette extends StatefulWidget {
  const _CommandPalette();
  @override
  State<_CommandPalette> createState() => _CommandPaletteState();
}

class _CommandPaletteState extends State<_CommandPalette> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  final _scroll = ScrollController();
  List<PaletteEntry> _results = kPaletteEntries;
  int _selected = 0;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      setState(() {
        _results = searchDestinations(_controller.text);
        _selected = 0;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _go(PaletteEntry e) {
    Navigator.of(context).pop();
    context.go(e.route);
  }

  /// Arrow keys move the selection without taking focus off the field, so
  /// typing never has to be interrupted to choose a result.
  KeyEventResult _onKey(FocusNode _, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.escape) {
      Navigator.of(context).pop();
      return KeyEventResult.handled;
    }
    if (_results.isEmpty) return KeyEventResult.ignored;
    if (key == LogicalKeyboardKey.arrowDown) {
      setState(() => _selected = (_selected + 1) % _results.length);
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.arrowUp) {
      setState(() => _selected = (_selected - 1 + _results.length) % _results.length);
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.numpadEnter) {
      _go(_results[_selected]);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      alignment: Alignment.topCenter,
      insetPadding: const EdgeInsets.only(top: 90, left: 24, right: 24),
      backgroundColor: FobColors.surfaceCard,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(FobRadius.card)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560, maxHeight: 440),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 8, 10),
              child: Row(
                children: [
                  const Icon(Icons.search, size: 18, color: FobColors.textMuted),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Focus(
                      onKeyEvent: _onKey,
                      child: TextField(
                        controller: _controller,
                        focusNode: _focus,
                        autofocus: true,
                        style: FobText.body,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                          hintText: 'Go to…',
                          hintStyle: TextStyle(color: FobColors.textFaint),
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    key: const Key('palette-close'),
                    tooltip: 'Close',
                    icon: const Icon(Icons.close, size: 18, color: FobColors.textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: FobColors.hairline),
            Flexible(
              child: _results.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 28),
                      child: Text('Nothing matches that.',
                          style: TextStyle(fontSize: 13, color: FobColors.textMuted)),
                    )
                  : ListView.builder(
                      controller: _scroll,
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      itemCount: _results.length,
                      itemBuilder: (context, i) {
                        final e = _results[i];
                        final active = i == _selected;
                        return InkWell(
                          onTap: () => _go(e),
                          child: Container(
                            color: active ? FobColors.surfaceBgLo : null,
                            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 9),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 42,
                                  child: Text(e.surfaceId, style: FobText.microLabel),
                                ),
                                Expanded(child: Text(e.label, style: FobText.body)),
                                Text(e.group,
                                    style: const TextStyle(
                                        fontSize: 11.5, color: FobColors.textFaint)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
