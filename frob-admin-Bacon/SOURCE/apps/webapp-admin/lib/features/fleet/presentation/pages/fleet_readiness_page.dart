import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../bloc/readiness_bloc.dart';

/// A14 / FLEET03 — fleet & equipment readiness dashboard.
class FleetReadinessPage extends StatelessWidget {
  const FleetReadinessPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ReadinessBloc>(
      create: (_) => sl<ReadinessBloc>()..add(const LoadReadiness()),
      child: const _ReadinessView(),
    );
  }
}

class _ReadinessView extends StatelessWidget {
  const _ReadinessView();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ReadinessBloc, ReadinessState>(
      builder: (context, state) {
        if (state is ReadinessLoading || state is ReadinessInitial) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is ReadinessFailure) {
          return Text(state.message, style: FobText.body);
        }
        final readiness = (state as ReadinessLoaded).readiness;
        // Scrolling is provided by the route scaffold (see app_router).
        return Column(
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
                              Text(e.key.replaceAll('_', ' '), style: FobText.microLabel),
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
                            child: Text(a, style: FobText.body.copyWith(color: FobColors.orangeText)),
                          ))
                      .toList(),
                ),
            ],
        );
      },
    );
  }
}
