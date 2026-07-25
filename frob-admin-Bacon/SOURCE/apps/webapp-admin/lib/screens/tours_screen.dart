import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/status_pill.dart';

/// A22 — Tour & route catalogue (PROTOTYPE, REQ-TOUR-CAT / DR-B13).
/// Create, edit, and publish/archive the tours (routes) that departures are
/// scheduled against. Previously the `tours` table was seed-only.
class ToursScreen extends StatefulWidget {
  const ToursScreen({super.key});

  @override
  State<ToursScreen> createState() => _ToursScreenState();
}

class _ToursScreenState extends State<ToursScreen> {
  ApiClient get _api => context.read<ApiClient>();

  List<Map<String, dynamic>> _tours = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getAdminTours();
      if (!mounted) return;
      setState(() {
        _tours = data.map((t) => (t as Map).cast<String, dynamic>()).toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openEditor({Map<String, dynamic>? tour}) async {
    await showDialog<bool>(
      context: context,
      builder: (ctx) => _TourEditor(tour: tour),
    );
    // Always refetch after the editor closes — the DB may have changed even
    // if the dialog's return value was lost; a no-op reload on cancel is cheap.
    if (mounted) await _load();
  }

  String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('A22 · CATALOGUE', style: FobText.microLabel),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Tours & routes', style: FobText.pageTitle),
            FilledButton.icon(
              onPressed: () => _openEditor(),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New tour'),
            ),
          ],
        ),
        const SizedBox(height: 6),
        const Text(
          'The routes departures are scheduled against. Draft and archived tours are hidden '
          'from the public catalogue; only published tours are bookable.',
          style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
        ),
        const SizedBox(height: FobSpace.block),
        if (_loading)
          const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
        else if (_tours.isEmpty)
          const Text('No tours yet — create your first route.', style: FobText.body)
        else
          Column(children: [for (final t in _tours) _tourCard(t)]),
      ],
    );
  }

  Widget _tourCard(Map<String, dynamic> t) {
    return InkWell(
      onTap: () => _openEditor(tour: t),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: FobColors.surfaceCard,
          borderRadius: BorderRadius.circular(FobRadius.card),
          border: Border.all(color: FobColors.hairline),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${t['name'] ?? ''}',
                      style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 18, color: FobColors.textStrong)),
                  const SizedBox(height: 2),
                  Text('${t['tagline'] ?? ''}', style: const TextStyle(fontSize: 13, color: FobColors.textBody)),
                  const SizedBox(height: 6),
                  Text('${t['difficulty'] ?? ''} · ${t['duration_min'] ?? '—'} min · ${t['id'] ?? ''}',
                      style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(_money((t['price_pence'] as num?) ?? 0),
                    style: const TextStyle(
                        fontFamily: FobText.serif,
                        fontWeight: FontWeight.w700,
                        color: FobColors.textPrice,
                        fontFeatures: FobText.moneyFontFeatures)),
                const SizedBox(height: 6),
                _statusChip('${t['status'] ?? ''}'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String status) => PillLabel.hue(FobStatusHue.forTour(status), status);
}

const _difficulties = ['Easy', 'Moderate', 'Challenging'];
const _statuses = ['draft', 'published', 'archived'];

class _TourEditor extends StatefulWidget {
  const _TourEditor({this.tour});
  final Map<String, dynamic>? tour;

  @override
  State<_TourEditor> createState() => _TourEditorState();
}

class _TourEditorState extends State<_TourEditor> {
  ApiClient get _api => context.read<ApiClient>();
  bool get _isEdit => widget.tour != null;

  late final TextEditingController _name;
  late final TextEditingController _tagline;
  late final TextEditingController _description;
  late final TextEditingController _duration;
  late final TextEditingController _price;
  late final TextEditingController _highlights;
  late final TextEditingController _badge;
  late String _difficulty;
  late String _status;

  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final t = widget.tour ?? const {};
    _name = TextEditingController(text: '${t['name'] ?? ''}');
    _tagline = TextEditingController(text: '${t['tagline'] ?? ''}');
    _description = TextEditingController(text: t['description'] == null ? '' : '${t['description']}');
    _duration = TextEditingController(text: t['duration_min'] == null ? '' : '${t['duration_min']}');
    _price = TextEditingController(
      text: t['price_pence'] == null ? '' : ((t['price_pence'] as num) / 100).toStringAsFixed(2),
    );
    final hl = (t['route_highlights'] as List?)?.map((e) => '$e').join(', ') ?? '';
    _highlights = TextEditingController(text: hl);
    _badge = TextEditingController(text: t['badge'] == null ? '' : '${t['badge']}');
    _difficulty = _difficulties.contains(t['difficulty']) ? '${t['difficulty']}' : 'Easy';
    _status = _statuses.contains(t['status']) ? '${t['status']}' : 'draft';
  }

  @override
  void dispose() {
    for (final c in [_name, _tagline, _description, _duration, _price, _highlights, _badge]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final tagline = _tagline.text.trim();
    final duration = int.tryParse(_duration.text.trim());
    final pounds = double.tryParse(_price.text.trim());
    if (name.isEmpty || tagline.isEmpty) {
      setState(() => _error = 'Name and tagline are required.');
      return;
    }
    if (duration == null || duration <= 0) {
      setState(() => _error = 'Enter a valid duration in minutes.');
      return;
    }
    if (pounds == null || pounds < 0) {
      setState(() => _error = 'Enter a valid price.');
      return;
    }

    final highlights = _highlights.text
        .split(',')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    final badge = _badge.text.trim();

    final body = <String, dynamic>{
      'name': name,
      'tagline': tagline,
      'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
      'duration_min': duration,
      'difficulty': _difficulty,
      'price_pence': (pounds * 100).round(),
      'badge': badge.isEmpty ? null : badge,
      'route_highlights': highlights,
      'status': _status,
    };

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (_isEdit) {
        await _api.updateTour('${widget.tour!['id']}', body);
      } else {
        await _api.createTour(body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _saving = false;
        _error = 'Could not save: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEdit ? 'Edit tour' : 'New tour'),
      content: SizedBox(
        width: 540,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _field('Name', _name),
              _field('Tagline', _tagline),
              _field('Description', _description, maxLines: 2),
              Row(
                children: [
                  Expanded(child: _field('Duration (min)', _duration, keyboard: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _field('Price (£)', _price, keyboard: TextInputType.number, prefix: '£ ')),
                ],
              ),
              Row(
                children: [
                  Expanded(
                    child: _dropdown('Difficulty', _difficulty, _difficulties, (v) => setState(() => _difficulty = v!)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _dropdown('Status', _status, _statuses, (v) => setState(() => _status = v!)),
                  ),
                ],
              ),
              _field('Route highlights (comma-separated)', _highlights),
              _field('Badge (optional)', _badge),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: FobColors.error, fontSize: 12.5)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        if (_isEdit)
          TextButton(
            onPressed: _saving ? null : _delete,
            style: TextButton.styleFrom(foregroundColor: FobColors.error),
            child: const Text('Delete'),
          ),
        const Spacer(),
        TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(false), child: const Text('Cancel')),
        FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
      ],
      actionsAlignment: MainAxisAlignment.start,
    );
  }

  Future<void> _delete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete tour?'),
        content: Text('Permanently delete "${widget.tour!['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: FobColors.error),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await _api.deleteTour('${widget.tour!['id']}');
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      // A tour with scheduled departures is refused (409) — surface the
      // server's "archive it instead" message rather than a raw error.
      setState(() {
        _saving = false;
        _error = e is ApiException ? e.message : 'Could not delete: $e';
      });
    }
  }

  Widget _field(String label, TextEditingController c, {TextInputType? keyboard, int maxLines = 1, String? prefix}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextField(
        controller: c,
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label, prefixText: prefix, isDense: true, border: const OutlineInputBorder()),
      ),
    );
  }

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(labelText: label, isDense: true, border: const OutlineInputBorder()),
        items: [for (final i in items) DropdownMenuItem(value: i, child: Text(i))],
        onChanged: onChanged,
      ),
    );
  }
}
