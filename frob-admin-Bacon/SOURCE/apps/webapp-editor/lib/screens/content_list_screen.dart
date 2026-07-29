import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/auth/auth_cubit.dart';
import '../bloc/content/content_cubit.dart';
import '../theme/forest_theme.dart';
import '../widgets/side_nav.dart';

/// Content list — [SPA] dense data table (design-system.md §5.5).
/// Flagged (incomplete) rows get a warning left-edge bar, never hidden.
class ContentListScreen extends StatefulWidget {
  const ContentListScreen({super.key});

  @override
  State<ContentListScreen> createState() => _ContentListScreenState();
}

class _ContentListScreenState extends State<ContentListScreen> {
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
          const SideNav(currentRoute: '/content'),
          const VerticalDivider(width: 1, color: ForestTokens.border),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.all(ForestTokens.space6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text('Tour content',
                            style: Theme.of(context).textTheme.headlineMedium),
                      ),
                      TextButton(
                        onPressed: () => context.read<AuthCubit>().logout(),
                        child: const Text('Sign out'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: BlocBuilder<ContentCubit, ContentState>(
                    builder: (context, state) {
                      if (state.status == ContentStatus.loading ||
                          state.status == ContentStatus.initial) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (state.status == ContentStatus.error &&
                          state.items.isEmpty) {
                        return Center(
                          child: Text(state.errorMessage ?? 'Something went wrong',
                              style: const TextStyle(color: ForestTokens.error)),
                        );
                      }
                      if (state.items.isEmpty) {
                        return const Center(child: Text('No tour content yet.'));
                      }
                      return ListView.separated(
                        padding: const EdgeInsets.symmetric(
                            horizontal: ForestTokens.space6),
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) =>
                            const Divider(height: 1, color: ForestTokens.border),
                        itemBuilder: (context, index) {
                          final item = state.items[index];
                          final flagged = !item.isComplete;
                          return Container(
                            constraints: const BoxConstraints(minHeight: 44),
                            decoration: BoxDecoration(
                              border: Border(
                                left: BorderSide(
                                  color: flagged
                                      ? ForestTokens.warning
                                      : Colors.transparent,
                                  width: 4,
                                ),
                              ),
                            ),
                            child: ListTile(
                              title: Text(item.title.isEmpty
                                  ? '(untitled)'
                                  : item.title),
                              subtitle: Text(
                                '${item.path}  ·  '
                                '${item.published ? 'Published' : 'Draft'}',
                                style: TextStyle(
                                  color: item.published
                                      ? ForestTokens.success
                                      : ForestTokens.inkMuted,
                                ),
                              ),
                              trailing: flagged
                                  ? const Chip(
                                      label: Text('Incomplete'),
                                      backgroundColor: ForestTokens.forest50,
                                      labelStyle:
                                          TextStyle(color: ForestTokens.warning),
                                    )
                                  : null,
                              onTap: () => context.go('/content/${item.tourId}'),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
