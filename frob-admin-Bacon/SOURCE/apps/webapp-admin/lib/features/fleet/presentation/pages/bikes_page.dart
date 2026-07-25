import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/bike_record.dart';
import '../bloc/bikes_bloc.dart';

/// Fleet — Bikes register (master-detail): a list of individual bikes on the
/// left, the selected bike's full record on the right (A21).
class BikesPage extends StatelessWidget {
  const BikesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BikesBloc>(
      create: (_) => sl<BikesBloc>()..add(const LoadBikesEvent()),
      child: const _BikesView(),
    );
  }
}

class _BikesView extends StatefulWidget {
  const _BikesView();
  @override
  State<_BikesView> createState() => _BikesViewState();
}

class _BikesViewState extends State<_BikesView> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BikesBloc, BikesState>(
      builder: (context, state) {
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
              final list = _listColumn(context, state);
              final detail = _recordColumn(state);
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
      },
    );
  }

  Widget _listColumn(BuildContext context, BikesState state) {
    final rows = state.rows;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SEARCH FLEET', style: FobText.microLabel),
        const SizedBox(height: 6),
        TextField(
          controller: _searchCtrl,
          onChanged: (v) => context.read<BikesBloc>().add(SearchBikesEvent(v)),
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
        FobCard(
          padding: EdgeInsets.zero,
          child: state.loading
              ? const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
              : rows.isEmpty
                  ? const Padding(padding: EdgeInsets.all(24), child: Text('No bikes match.', style: FobText.body))
                  : Column(children: [for (var i = 0; i < rows.length; i++) _listRow(context, rows[i], state.selectedId, i == rows.length - 1)]),
        ),
      ],
    );
  }

  Widget _listRow(BuildContext context, BikeSummary b, String? selectedId, bool last) {
    final active = b.id == selectedId;
    return InkWell(
      onTap: () => context.read<BikesBloc>().add(SelectBikeEvent(b.id)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: active ? FobColors.surfaceBgLo : null,
          border: last ? null : const Border(bottom: BorderSide(color: FobColors.hairlineWarm)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${b.make} ${b.model}',
                      style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 15, color: FobColors.textStrong)),
                  const SizedBox(height: 2),
                  Text('${b.id} · ${b.frameSize} · ${b.colour}',
                      style: const TextStyle(fontFamily: FobText.mono, fontSize: 10.5, color: FobColors.textMuted)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _bikePill(b.status),
          ],
        ),
      ),
    );
  }

  Widget _recordColumn(BikesState state) {
    if (state.detailLoading || state.detail == null) {
      return FobCard(
        child: SizedBox(
          height: 240,
          child: Center(
            child: state.detailLoading ? const CircularProgressIndicator() : const Text('Select a bike to view its record.', style: FobText.body),
          ),
        ),
      );
    }
    final b = state.detail!;
    return FobCard(
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
                    Text('${b.make} ${b.model}',
                        style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 22, color: FobColors.textStrong)),
                    const SizedBox(height: 3),
                    Text('${b.id} · ${b.frameSize} · ${b.colour}',
                        style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted)),
                  ],
                ),
              ),
              _bikePill(b.status),
            ],
          ),
          const FobDivider(),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: FobKeyValue('SERIAL', b.serialNumber ?? '—')),
              Expanded(child: FobKeyValue('PURCHASED', b.purchaseDate ?? '—')),
              Expanded(child: FobKeyValue('SPARE', b.spare ? 'Yes' : 'No')),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: FobKeyValue('LAST INSPECTED', _ts(b.lastInspectedAt))),
              Expanded(child: FobKeyValue('NOTES', b.notes ?? '—')),
            ],
          ),
          const SizedBox(height: FobSpace.card),
          FobSectionLabel('ROUTE ELIGIBILITY'),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: b.routeEligibility.isEmpty
                ? [const Text('—', style: FobText.body)]
                : b.routeEligibility.map((r) => PillLabel(text: r, background: FobColors.surfaceBgLo, foreground: FobColors.textMuted)).toList(),
          ),
          const FobDivider(),
          FobSectionLabel('MAINTENANCE HISTORY'),
          if (b.maintenance.isEmpty)
            const Text('No maintenance events logged.', style: FobText.body)
          else
            ...b.maintenance.map((e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: 150, child: Text(_ts(e.createdAt), style: const TextStyle(fontFamily: FobText.mono, fontSize: 11, color: FobColors.textMuted))),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.workPerformed, style: FobText.body),
                            if (e.partsReplaced != null)
                              Text('Parts: ${e.partsReplaced}', style: const TextStyle(fontSize: 11.5, color: FobColors.textMuted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                )),
          const FobDivider(),
          FobSectionLabel('ASSIGNMENT HISTORY'),
          if (b.assignments.isEmpty)
            const Text('Not assigned to any departure.', style: FobText.body)
          else
            ...b.assignments.map((e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Expanded(child: Text('${e.tourId} · ${e.date} ${e.time}', style: FobText.body)),
                      PillLabel(
                        text: e.active ? 'assigned' : 'removed',
                        background: e.active ? FobColors.lime : FobColors.surfaceBgLo,
                        foreground: e.active ? FobColors.pillInk : FobColors.textMuted,
                      ),
                    ],
                  ),
                )),
        ],
      ),
    );
  }

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

  String _ts(String? iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
