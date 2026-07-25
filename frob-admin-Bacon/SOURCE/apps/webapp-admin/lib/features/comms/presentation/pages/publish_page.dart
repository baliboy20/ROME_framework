import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_data_table.dart';
import '../../domain/entities/content_snapshot.dart';
import '../bloc/publish_bloc.dart';

/// A6 / SEO03 — publish & content quality.
class PublishPage extends StatelessWidget {
  const PublishPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<PublishBloc>(
      create: (_) => sl<PublishBloc>()..add(const LoadContentEvent()),
      child: const _PublishView(),
    );
  }
}

class _PublishView extends StatelessWidget {
  const _PublishView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PublishBloc, PublishState>(
      listenWhen: (prev, curr) => curr is PublishLoaded && curr.notice != null,
      listener: (context, state) {
        if (state is PublishLoaded && state.notice != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!)));
        }
      },
      builder: (context, state) {
        if (state is PublishLoadFailure) {
          return _titled(Card(child: Padding(padding: const EdgeInsets.all(24), child: Text(state.message, style: FobText.body))));
        }
        final loading = state is PublishLoading || state is PublishInitial;
        final loaded = state is PublishLoaded ? state : null;
        final pages = loaded?.snapshot.pages ?? const <ContentPage>[];
        final quality = loaded?.snapshot.quality ?? const <QualityItem>[];
        // Scrolling is provided by the route scaffold (see app_router).
        return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Publish & content quality', style: FobText.pageTitle),
              const SizedBox(height: FobSpace.card),
              Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(padding: EdgeInsets.all(FobSpace.card), child: Text('Pages', style: FobText.cardTitle)),
                    FobDataTable<ContentPage>(
                      loading: loading,
                      emptyText: 'No pages to show.',
                      rows: pages,
                      columns: [
                        FobColumn(label: 'Title', flex: 3, render: (r) => Text(r.title, style: FobText.body)),
                        FobColumn(label: 'Path', flex: 3, render: (r) => Text(r.path, style: FobText.body)),
                        FobColumn(label: 'Published', render: (r) => Text(r.published ? 'Yes' : 'No', style: FobText.body)),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.all(FobSpace.card),
                      child: Text('No automatic publish — William triggers each one.', style: FobText.microLabel),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: FobSpace.card),
              ElevatedButton(
                onPressed: (loaded == null || loaded.publishing)
                    ? null
                    : () => context.read<PublishBloc>().add(const PublishNowEvent()),
                child: Text(loaded?.publishing == true ? 'Publishing…' : 'Publish now'),
              ),
              const SizedBox(height: FobSpace.block),
              Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(padding: EdgeInsets.all(FobSpace.card), child: Text('Content quality', style: FobText.cardTitle)),
                    if (quality.isEmpty)
                      const Padding(
                        padding: EdgeInsets.fromLTRB(FobSpace.card, 0, FobSpace.card, FobSpace.card),
                        child: Text('All content looks good.', style: FobText.body),
                      )
                    else
                      ...quality.map((q) => ListTile(
                            title: Text(q.title, style: FobText.body),
                            subtitle: Text(q.detail, style: FobText.microLabel),
                          )),
                  ],
                ),
              ),
            ],
        );
      },
    );
  }

  Widget _titled(Widget child) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Publish & content quality', style: FobText.pageTitle),
          const SizedBox(height: FobSpace.card),
          child,
        ],
      );
}
