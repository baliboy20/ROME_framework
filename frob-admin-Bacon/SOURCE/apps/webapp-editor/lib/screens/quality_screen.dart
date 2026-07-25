import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/content/content_cubit.dart';
import '../theme/forest_theme.dart';
import '../widgets/side_nav.dart';

/// Sitemap / content-quality view — summarises which tour content is live
/// vs. flagged incomplete (REQ-SEO01/02). Read-only; publish happens from
/// the edit screen.
class QualityScreen extends StatefulWidget {
  const QualityScreen({super.key});

  @override
  State<QualityScreen> createState() => _QualityScreenState();
}

class _QualityScreenState extends State<QualityScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ContentCubit>().loadContent();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          const SideNav(currentRoute: '/quality'),
          const VerticalDivider(width: 1, color: ForestTokens.border),
          Expanded(
            child: BlocBuilder<ContentCubit, ContentState>(
              builder: (context, state) {
                final items = state.items;
                final quality = state.quality;
                final published = items.where((i) => i.published).length;
                return Padding(
                  padding: const EdgeInsets.all(ForestTokens.space6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Sitemap & quality',
                          style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: ForestTokens.space6),
                      Row(
                        children: [
                          _StatCard(
                            label: 'Published to sitemap',
                            value: '$published',
                            tone: ForestTokens.success,
                          ),
                          const SizedBox(width: ForestTokens.space4),
                          _StatCard(
                            label: 'Quality flags',
                            value: '${quality.length}',
                            tone: ForestTokens.warning,
                          ),
                          const SizedBox(width: ForestTokens.space4),
                          _StatCard(
                            label: 'Total pages',
                            value: '${items.length}',
                            tone: ForestTokens.info,
                          ),
                        ],
                      ),
                      const SizedBox(height: ForestTokens.space6),
                      Text('Quality advisories',
                          style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: ForestTokens.space4),
                      if (quality.isEmpty)
                        const Text(
                          'No quality issues reported.',
                          style: TextStyle(color: ForestTokens.inkMuted),
                        )
                      else
                        Expanded(
                          child: ListView.separated(
                            itemCount: quality.length,
                            separatorBuilder: (_, __) => const Divider(
                                height: 1, color: ForestTokens.border),
                            itemBuilder: (context, index) {
                              final q = quality[index];
                              return ListTile(
                                leading: const Icon(Icons.warning_amber_rounded,
                                    color: ForestTokens.warning),
                                title: Text(q.title),
                                subtitle: Text(q.detail),
                              );
                            },
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color tone;

  const _StatCard({required this.label, required this.value, required this.tone});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(ForestTokens.space4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(color: tone, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: ForestTokens.space2),
                  Text(label, style: const TextStyle(color: ForestTokens.inkMuted)),
                ],
              ),
              const SizedBox(height: ForestTokens.space2),
              Text(value, style: Theme.of(context).textTheme.headlineMedium),
            ],
          ),
        ),
      ),
    );
  }
}
