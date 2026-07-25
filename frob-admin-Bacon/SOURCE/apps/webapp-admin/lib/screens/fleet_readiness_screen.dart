import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';

/// A14 / FLEET03 — fleet & equipment readiness dashboard.
class FleetReadinessScreen extends StatelessWidget {
  const FleetReadinessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return FutureBuilder<Map<String, dynamic>>(
      future: api.getFleetReadiness(),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final readiness = FleetReadiness.fromJson(snap.data ?? const {});
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Fleet & equipment readiness', style: FobText.pageTitle),
              const SizedBox(height: FobSpace.card),
              Wrap(
                spacing: FobSpace.row,
                runSpacing: FobSpace.row,
                children: readiness.counts.entries
                    .map((e) => Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: FobColors.surfaceCard,
                            border: Border.all(color: FobColors.hairline),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${e.value}', style: FobText.pageTitle),
                              Text(e.key.replaceAll('_', ' '),
                                  style: FobText.microLabel),
                            ],
                          ),
                        ))
                    .toList(),
              ),
              const SizedBox(height: FobSpace.block),
              const Text('Active alerts', style: FobText.cardTitle),
              const SizedBox(height: FobSpace.card),
              if (readiness.alerts.isEmpty)
                const Text('No active alerts.', style: FobText.body)
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: readiness.alerts
                      .map((a) => Padding(
                            padding: const EdgeInsets.only(bottom: FobSpace.row),
                            child: Text(a,
                                style: FobText.body
                                    .copyWith(color: FobColors.orangeText)),
                          ))
                      .toList(),
                ),
            ],
          ),
        );
      },
    );
  }
}
