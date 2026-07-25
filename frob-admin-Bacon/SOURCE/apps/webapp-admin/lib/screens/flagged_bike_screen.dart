import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../bloc/flagged_bike_cubit.dart';
import '../theme/tokens.dart';
import '../widgets/app_button.dart';
import '../widgets/app_field.dart';

/// A15 — Flagged-bike clear-to-service gate (UXD-11). FINDING-001: real
/// flagged-bike picker (was hard-coded to 'FOB-004').
class FlaggedBikeScreen extends StatelessWidget {
  const FlaggedBikeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (ctx) => FlaggedBikeCubit(context.read()),
      child: const _FlaggedBikeView(),
    );
  }
}

class _FlaggedBikeView extends StatefulWidget {
  const _FlaggedBikeView();
  @override
  State<_FlaggedBikeView> createState() => _FlaggedBikeViewState();
}

class _FlaggedBikeViewState extends State<_FlaggedBikeView> {
  final noteCtrl = TextEditingController();
  List<Map<String, dynamic>> _flagged = [];
  String? _bikeId;

  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final all = await _api.getFleet();
      if (!mounted) return;
      setState(() => _flagged = all
          .cast<Map<String, dynamic>>()
          .where((b) => b['status'] == 'flagged_for_service' || b['status'] == 'in_maintenance')
          .toList());
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FlaggedBikeCubit, FlaggedBikeState>(
      builder: (context, state) {
        final cubit = context.read<FlaggedBikeCubit>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Flagged-bike maintenance', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Row(
                  children: [
                    const Text('Bike: ', style: FobText.body),
                    const SizedBox(width: 8),
                    DropdownButton<String?>(
                      value: _bikeId,
                      hint: const Text('Select a flagged bike'),
                      items: _flagged
                          .map((b) => DropdownMenuItem<String?>(
                                value: b['id'].toString(),
                                child: Text('${b['id']} — ${b['make']} ${b['model']} (${b['status']})'),
                              ))
                          .toList(),
                      onChanged: (v) {
                        setState(() => _bikeId = v);
                        if (v != null) cubit.openBike(v);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: FobSpace.card),
            if (_bikeId == null)
              const Text('Select a flagged bike to log maintenance.', style: FobText.body)
            else
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(FobSpace.card),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Bike ${state.bikeId} — maintenance events logged: ${state.maintenanceEventCount}',
                          style: FobText.body),
                      const SizedBox(height: FobSpace.field),
                      AppField(label: 'Maintenance note', controller: noteCtrl, key: const Key('maintenance-note-field')),
                      const SizedBox(height: FobSpace.row),
                      AppButton(
                        key: const Key('log-maintenance-button'),
                        label: 'Log maintenance event',
                        kind: AppButtonKind.secondary,
                        loading: state.saving,
                        onPressed: () => cubit.logMaintenance(noteCtrl.text),
                      ),
                      const SizedBox(height: FobSpace.block),
                      if (!state.canClear && !state.cleared)
                        const Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Text('Log at least one maintenance event before clearing to service.',
                              key: Key('clear-blocked-reason'), style: TextStyle(color: FobColors.orangeText, fontSize: 12)),
                        ),
                      AppButton(
                        key: const Key('clear-to-service-button'),
                        label: 'Clear to service',
                        kind: AppButtonKind.primary,
                        loading: state.saving,
                        onPressed: state.canClear ? () => cubit.clearToService() : null,
                      ),
                      if (state.cleared)
                        const Padding(
                          padding: EdgeInsets.only(top: 12),
                          child: Text('Cleared to service.', style: TextStyle(color: FobColors.limeText)),
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
}
