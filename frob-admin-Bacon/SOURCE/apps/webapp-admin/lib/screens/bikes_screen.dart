import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/status_pill.dart';

/// Fleet — Bikes register (master-detail): a list of individual bikes on the
/// left, the selected bike's full record (spec, maintenance history, assignment
/// history) on the right. Parchment composition, matching the A19 pattern.
class BikesScreen extends StatefulWidget {
  const BikesScreen({super.key});
  @override
  State<BikesScreen> createState() => _BikesScreenState();
}

class _BikesScreenState extends State<BikesScreen> {
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _all = [];
  String _query = '';
  bool _loading = true;
  String? _selectedId;
  Map<String, dynamic>? _detail;
  bool _detailLoading = false;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final data = await _api.getFleet();
      final rows = data.cast<Map<String, dynamic>>();
      setState(() {
        _all = rows;
        _loading = false;
      });
      _applyFilter(_query);
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<Map<String, dynamic>> get _rows {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return _all;
    return _all.where((b) {
      return '${b['id']}'.toLowerCase().contains(q) ||
          '${b['make']} ${b['model']}'.toLowerCase().contains(q) ||
          '${b['status']}'.toLowerCase().contains(q) ||
          '${b['colour']}'.toLowerCase().contains(q);
    }).toList();
  }

  void _applyFilter(String q) {
    setState(() => _query = q);
    final rows = _rows;
    if (rows.isEmpty) {
      setState(() {
        _selectedId = null;
        _detail = null;
        _detailLoading = false;
      });
    } else if (_selectedId == null || !rows.any((r) => '${r['id']}' == _selectedId)) {
      _select('${rows.first['id']}');
    }
  }

  Future<void> _select(String id) async {
    setState(() {
      _selectedId = id;
      _detailLoading = true;
    });
    try {
      final d = await _api.getBike(id);
      setState(() {
        _detail = d;
        _detailLoading = false;
      });
    } catch (_) {
      setState(() => _detailLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('FLEET & EQUIPMENT', style: FobText.microLabel),
        const SizedBox(height: 4),
        const Text('Bikes register', style: FobText.pageTitle),
        const SizedBox(height: 6),
        const Text('Every bike in the fleet and its full record — spec, service status, maintenance history and assignments.',
            style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5)),
        const SizedBox(height: FobSpace.block),
        LayoutBuilder(builder: (context, c) {
          final wide = c.maxWidth > 820;
          final list = _listColumn();
          final detail = _recordColumn();
          if (!wide) return Column(children: [list, const SizedBox(height: FobSpace.card), detail]);
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 320, child: list),
              const SizedBox(width: 24),
              Expanded(child: detail),
            ],
          );
        }),
      ],
    );
  }

  Widget _listColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SEARCH FLEET', style: FobText.microLabel),
        const SizedBox(height: 6),
        TextField(
          controller: _searchCtrl,
          onChanged: _applyFilter,
          decoration: InputDecoration(
            hintText: 'ID, make, colour or status',
            prefixIcon: const Icon(Icons.search, size: 18),
            isDense: true,
            filled: true,
            fillColor: FobColors.surfaceBgLo,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(FobRadius.field), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: FobSpace.card),
        _card(
          padding: EdgeInsets.zero,
          child: _loading
              ? const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
              : _rows.isEmpty
                  ? const Padding(padding: EdgeInsets.all(24), child: Text('No bikes match.', style: FobText.body))
                  : Column(children: [for (var i = 0; i < _rows.length; i++) _listRow(_rows[i], i == _rows.length - 1)]),
        ),
      ],
    );
  }

  Widget _listRow(Map<String, dynamic> b, bool last) {
    final id = '${b['id']}';
    final active = id == _selectedId;
    return InkWell(
      onTap: () => _select(id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: active ? FobColors.surfaceBgLo : null,
          border: last ? null : const Border(bottom: BorderSide(color: Color(0xFFF2EDDF))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${b['make']} ${b['model']}',
                      style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                  const SizedBox(height: 2),
                  Text('$id · ${b['frame_size']} · ${b['colour']}',
                      style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _bikePill('${b['status']}'),
          ],
        ),
      ),
    );
  }

  Widget _recordColumn() {
    if (_detailLoading || _detail == null) {
      return _card(
        child: SizedBox(
          height: 240,
          child: Center(
            child: _detailLoading ? const CircularProgressIndicator() : const Text('Select a bike to view its record.', style: FobText.body),
          ),
        ),
      );
    }
    final b = (_detail!['bike'] as Map).cast<String, dynamic>();
    final maintenance = (_detail!['maintenance'] as List?) ?? const [];
    final assignments = (_detail!['assignments'] as List?) ?? const [];
    final routes = _routeList(b['route_eligibility']);

    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('BIKE RECORD', style: FobText.microLabel),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${b['make']} ${b['model']}',
                        style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 22, color: FobColors.textStrong)),
                    const SizedBox(height: 3),
                    Text('${b['id']} · ${b['frame_size']} · ${b['colour']}',
                        style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                  ],
                ),
              ),
              _bikePill('${b['status']}'),
            ],
          ),
          _divider(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('SERIAL', '${b['serial_number'] ?? '—'}')),
              Expanded(child: _kv('PURCHASED', '${b['purchase_date'] ?? '—'}')),
              Expanded(child: _kv('SPARE', (b['spare'] == 1) ? 'Yes' : 'No')),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _kv('LAST INSPECTED', _ts(b['last_inspected_at']))),
              Expanded(child: _kv('NOTES', '${b['notes'] ?? '—'}')),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          _sectionLabel('ROUTE ELIGIBILITY'),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: routes.isEmpty
                ? [const Text('—', style: FobText.body)]
                : routes.map((r) => PillLabel(text: r, background: FobColors.surfaceBgLo, foreground: FobColors.textMuted)).toList(),
          ),
          _divider(),
          _sectionLabel('MAINTENANCE HISTORY'),
          if (maintenance.isEmpty)
            const Text('No maintenance events logged.', style: FobText.body)
          else
            ...maintenance.map((m) {
              final e = (m as Map).cast<String, dynamic>();
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 150, child: Text(_ts(e['created_at']), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted))),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${e['work_performed'] ?? ''}', style: FobText.body),
                          if (e['parts_replaced'] != null)
                            Text('Parts: ${e['parts_replaced']}', style: const TextStyle(fontSize: 11.5, color: FobColors.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          _divider(),
          _sectionLabel('ASSIGNMENT HISTORY'),
          if (assignments.isEmpty)
            const Text('Not assigned to any departure.', style: FobText.body)
          else
            ...assignments.map((a) {
              final e = (a as Map).cast<String, dynamic>();
              final active = e['removed_at'] == null;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  children: [
                    Expanded(child: Text('${e['tour_id'] ?? '—'} · ${e['date'] ?? ''} ${e['time'] ?? ''}', style: FobText.body)),
                    PillLabel(
                      text: active ? 'assigned' : 'removed',
                      background: active ? FobColors.lime : FobColors.surfaceBgLo,
                      foreground: active ? FobColors.pillInk : FobColors.textMuted,
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ---- helpers ----
  Widget _bikePill(String status) {
    Color bg;
    Color fg;
    switch (status) {
      case 'in_service':
        bg = FobColors.lime;
        fg = FobColors.pillInk;
        break;
      case 'flagged_for_service':
        bg = FobColors.orange;
        fg = Colors.white;
        break;
      case 'in_maintenance':
      case 'awaiting_external_service':
        bg = FobColors.cyan;
        fg = FobColors.pillInk;
        break;
      case 'out_of_service':
      case 'retired':
        bg = FobColors.pink;
        fg = Colors.white;
        break;
      default:
        bg = FobColors.surfaceBgLo;
        fg = FobColors.textMuted;
    }
    return PillLabel(text: status.replaceAll('_', ' '), background: bg, foreground: fg);
  }

  List<String> _routeList(dynamic raw) {
    if (raw == null) return [];
    try {
      final v = raw is String ? jsonDecode(raw) : raw;
      if (v is List) return v.map((e) => '$e').toList();
    } catch (_) {}
    return [];
  }

  Widget _card({required Widget child, EdgeInsets padding = const EdgeInsets.all(24)}) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: FobColors.surfaceCard,
          borderRadius: BorderRadius.circular(FobRadius.card),
          border: Border.all(color: FobColors.hairline),
        ),
        child: child,
      );

  Widget _divider() => const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(height: 1, color: Color(0xFFF2EDDF)));

  Widget _sectionLabel(String s) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(s, style: FobText.microLabel));

  Widget _kv(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: FobText.microLabel),
          const SizedBox(height: 5),
          Text(value, style: FobText.body),
        ],
      );

  String _ts(dynamic iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse('$iso');
    if (dt == null) return '$iso';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
