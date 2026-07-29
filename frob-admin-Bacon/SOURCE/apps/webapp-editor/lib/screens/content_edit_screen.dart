import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/auth/auth_cubit.dart';
import '../bloc/content/content_cubit.dart';
import '../models/content_item.dart';
import '../theme/forest_theme.dart';
import '../widgets/side_nav.dart';

/// Stage a page's title/description for publishing. IMPORTANT: the worker
/// has no content store, so edits here are LOCAL ONLY — they are held in
/// cubit state and folded into `POST /publish`. Nothing is persisted
/// server-side. Publish is manual (TDR-14) and pushes every page.
class ContentEditScreen extends StatefulWidget {
  final String contentId;

  const ContentEditScreen({super.key, required this.contentId});

  @override
  State<ContentEditScreen> createState() => _ContentEditScreenState();
}

class _ContentEditScreenState extends State<ContentEditScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  String? _hydratedFor;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
  }

  void _hydrate(ContentItem item) {
    if (_hydratedFor == item.tourId) return;
    _hydratedFor = item.tourId;
    _titleController.text = item.title;
    _descriptionController.text = item.description;
  }

  void _stage(ContentCubit cubit) {
    cubit.stageEdit(
      widget.contentId,
      title: _titleController.text,
      description: _descriptionController.text,
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ContentCubit, ContentState>(
      listenWhen: (prev, curr) =>
          prev.lastPublishResult != curr.lastPublishResult &&
          curr.lastPublishResult != null,
      listener: (context, state) {
        final result = state.lastPublishResult!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Published ${result.publishedCount} page(s); '
                '${result.flaggedIncomplete} flagged incomplete.'),
          ),
        );
      },
      builder: (context, state) {
        final match = state.items.where((i) => i.tourId == widget.contentId);
        if (match.isEmpty) {
          if (state.status == ContentStatus.loading) {
            return const Scaffold(
                body: Center(child: CircularProgressIndicator()));
          }
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Page not found'),
                  TextButton(
                    onPressed: () => context.go('/content'),
                    child: const Text('Back to list'),
                  ),
                ],
              ),
            ),
          );
        }
        final item = match.first;
        _hydrate(item);
        final owner = context.watch<AuthCubit>().state.isOwner;
        final cubit = context.read<ContentCubit>();
        final publishing = state.status == ContentStatus.publishing;

        return Scaffold(
          body: Row(
            children: [
              const SideNav(currentRoute: '/content'),
              const VerticalDivider(width: 1, color: ForestTokens.border),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(ForestTokens.space6),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 720),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back),
                              onPressed: () => context.go('/content'),
                            ),
                            Expanded(
                              child: Text('Stage tour for publish',
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium),
                            ),
                          ],
                        ),
                        const SizedBox(height: ForestTokens.space2),
                        Text(item.path,
                            style: const TextStyle(
                                color: ForestTokens.inkMuted)),
                        const SizedBox(height: ForestTokens.space6),
                        Container(
                          padding: const EdgeInsets.all(ForestTokens.space4),
                          decoration: BoxDecoration(
                            color: ForestTokens.info.withValues(alpha: 0.08),
                            border: Border.all(color: ForestTokens.info),
                            borderRadius:
                                BorderRadius.circular(ForestTokens.radiusSm),
                          ),
                          child: const Text(
                            'Edits are staged locally only — there is no '
                            'server content store. Title and description are '
                            'sent when you publish; they are not saved '
                            'separately.',
                            style: TextStyle(color: ForestTokens.info),
                          ),
                        ),
                        const SizedBox(height: ForestTokens.space6),
                        TextFormField(
                          key: const Key('title-field'),
                          controller: _titleController,
                          decoration: const InputDecoration(labelText: 'Title'),
                          onChanged: (_) => _stage(cubit),
                        ),
                        const SizedBox(height: ForestTokens.space4),
                        TextFormField(
                          key: const Key('description-field'),
                          controller: _descriptionController,
                          decoration: const InputDecoration(
                              labelText: 'Description (staged for publish)'),
                          maxLines: 5,
                          onChanged: (_) => _stage(cubit),
                        ),
                        const SizedBox(height: ForestTokens.space6),
                        if (!item.isComplete)
                          Container(
                            padding: const EdgeInsets.all(ForestTokens.space4),
                            decoration: BoxDecoration(
                              color:
                                  ForestTokens.warning.withValues(alpha: 0.1),
                              border: Border.all(color: ForestTokens.warning),
                              borderRadius:
                                  BorderRadius.circular(ForestTokens.radiusSm),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                    'Flagged incomplete — the worker may '
                                    'exclude it from the sitemap',
                                    style: TextStyle(
                                        color: ForestTokens.warning,
                                        fontWeight: FontWeight.w600)),
                                for (final reason in item.incompleteReasons)
                                  Text('• $reason'),
                              ],
                            ),
                          ),
                        if (!owner)
                          const Padding(
                            padding: EdgeInsets.only(top: ForestTokens.space4),
                            child: Text(
                              'Only the owner may publish content.',
                              style: TextStyle(color: ForestTokens.error),
                            ),
                          ),
                        if (state.lastPublishError != null)
                          Padding(
                            padding:
                                const EdgeInsets.only(top: ForestTokens.space4),
                            child: Text(state.lastPublishError!,
                                style: const TextStyle(
                                    color: ForestTokens.error)),
                          ),
                        const SizedBox(height: ForestTokens.space6),
                        Row(
                          children: [
                            ElevatedButton(
                              key: const Key('publish-button'),
                              onPressed: (!publishing && owner)
                                  ? () => cubit.publishAll()
                                  : null,
                              child: Text(publishing
                                  ? 'Publishing…'
                                  : 'Publish all pages'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
