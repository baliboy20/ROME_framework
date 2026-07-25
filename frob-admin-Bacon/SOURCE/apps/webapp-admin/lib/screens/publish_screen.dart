import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';
import '../theme/tokens.dart';
import '../widgets/fob_data_table.dart';

/// A6 / SEO03 — publish & content quality.
class PublishScreen extends StatefulWidget {
  const PublishScreen({super.key});
  @override
  State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  late Future<Map<String, dynamic>> _future;
  ApiClient get _api => context.read<ApiClient>();

  @override
  void initState() {
    super.initState();
    _future = _api.getContent();
  }

  void _refresh() => setState(() {
        _future = _api.getContent();
      });

  Future<void> _publish() async {
    try {
      await _api.publish();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Published successfully.')));
      }
      _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Publish failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        final loading = snap.connectionState == ConnectionState.waiting;
        final data = snap.data ?? const {};
        final pages = ((data['pages'] as List?) ?? const [])
            .map((j) => ContentPage.fromJson(j as Map<String, dynamic>))
            .toList();
        final quality = ((data['quality'] as List?) ?? const [])
            .map((j) => QualityItem.fromJson(j as Map<String, dynamic>))
            .toList();
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Publish & content quality', style: FobText.pageTitle),
              const SizedBox(height: FobSpace.card),
              Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(FobSpace.card),
                      child: Text('Pages', style: FobText.cardTitle),
                    ),
                    FobDataTable<ContentPage>(
                      loading: loading,
                      emptyText: 'No pages to show.',
                      rows: pages,
                      columns: [
                        FobColumn(
                            label: 'Title',
                            flex: 3,
                            render: (r) => Text(r.title, style: FobText.body)),
                        FobColumn(
                            label: 'Path',
                            flex: 3,
                            render: (r) => Text(r.path, style: FobText.body)),
                        FobColumn(
                            label: 'Published',
                            render: (r) =>
                                Text(r.published ? 'Yes' : 'No', style: FobText.body)),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.all(FobSpace.card),
                      child: Text(
                        'No automatic publish — William triggers each one.',
                        style: FobText.microLabel,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: FobSpace.card),
              ElevatedButton(
                onPressed: loading ? null : _publish,
                child: const Text('Publish now'),
              ),
              const SizedBox(height: FobSpace.block),
              Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(FobSpace.card),
                      child: Text('Content quality', style: FobText.cardTitle),
                    ),
                    if (quality.isEmpty)
                      const Padding(
                        padding: EdgeInsets.fromLTRB(
                            FobSpace.card, 0, FobSpace.card, FobSpace.card),
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
          ),
        );
      },
    );
  }
}
