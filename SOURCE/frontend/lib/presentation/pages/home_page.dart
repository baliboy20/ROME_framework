import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/email_filter_form.dart';
import 'package:medium_flutter_extractor/presentation/widgets/article_table.dart';
import 'package:medium_flutter_extractor/presentation/widgets/email_list_widget.dart';
import 'package:medium_flutter_extractor/presentation/widgets/progress_indicator_widget.dart';
import 'package:medium_flutter_extractor/presentation/widgets/links_view.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final progressMap = ref.watch(scrapingProgressProvider);
    final hasActiveProgress = progressMap.isNotEmpty;
    final emailState = ref.watch(emailNotifierProvider);
    final emailCount = emailState.valueOrNull?.length ?? 0;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Medium Flutter Link Extractor',
          style: TextStyle(
            fontFamily: 'Comic Sans MS',
            fontWeight: FontWeight.w600,
            letterSpacing: -0.2,
          ),
        ),
        actions: [
          CupertinoButton(
            padding: const EdgeInsets.all(8),
            onPressed: () => _showInfoDialog(context),
            child: const Icon(
              CupertinoIcons.info_circle,
              size: 22,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress indicator (when active)
          if (hasActiveProgress) ...[
            const ProgressIndicatorWidget(showDetails: false),
            const SizedBox(height: 16),
          ],
          
          // Main content
          Expanded(
            child: Row(
              children: [
                // Left panel - Email filter
                Expanded(
                  flex: 3,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: EmailFilterForm(),
                    ),
                  ),
                ),
                // Right panel - Tabbed view for Emails and Articles
                Expanded(
                  flex: 7,
                  child: Card(
                    child: Column(
                      children: [
                        // Tab Bar
                        Container(
                          color: Theme.of(context).colorScheme.surfaceVariant,
                          child: TabBar(
                            controller: _tabController,
                            tabs: [
                              Tab(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(CupertinoIcons.mail),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Emails',
                                      style: TextStyle(
                                        fontFamily: 'Comic Sans MS',
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (emailCount > 0) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.primary,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          emailCount.toString(),
                                          style: TextStyle(
                                            color: Theme.of(context).colorScheme.onPrimary,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const Tab(
                                icon: Icon(CupertinoIcons.doc_text),
                                child: Text(
                                  'Articles',
                                  style: TextStyle(
                                    fontFamily: 'Comic Sans MS',
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const Tab(
                                icon: Icon(CupertinoIcons.link),
                                child: Text(
                                  'Links',
                                  style: TextStyle(
                                    fontFamily: 'Comic Sans MS',
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Tab Content
                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildEmailTabContent(),
                              const ArticleTable(),
                              _buildLinksTabContent(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailTabContent() {
    final emailState = ref.watch(emailNotifierProvider);
    
    return Column(
      children: [
        // Batch processing header
        emailState.when(
          data: (emails) {
            final totalFlutterLinks = emails
                .expand((email) => (email['flutterLinks'] as List?)?.cast<String>() ?? <String>[])
                .length;
            
            if (totalFlutterLinks > 0) {
              return Container(
                padding: const EdgeInsets.all(16),
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.5),
                child: Row(
                  children: [
                    Icon(
                      CupertinoIcons.layers_alt,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '$totalFlutterLinks Flutter links found across ${emails.length} emails',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    CupertinoButton.filled(
                      onPressed: () => _processBatchLinks(context, emails),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            CupertinoIcons.cloud_download,
                            size: 18,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Process All Links',
                            style: TextStyle(
                              fontFamily: 'Comic Sans MS',
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          },
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const SizedBox.shrink(),
        ),
        // Email list
        const Expanded(child: EmailListWidget()),
      ],
    );
  }

  Future<void> _processBatchLinks(BuildContext context, List<Map<String, dynamic>> emails) async {
    // Collect all Flutter links from all emails
    final allFlutterLinks = <String>[];
    for (final email in emails) {
      final flutterLinks = (email['flutterLinks'] as List?)?.cast<String>() ?? [];
      allFlutterLinks.addAll(flutterLinks);
    }

    if (allFlutterLinks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No Flutter links found to process'),
        ),
      );
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Process All Flutter Links'),
        content: Text(
          'Do you want to scrape ${allFlutterLinks.length} Flutter articles from all emails?\n\n'
          'This may take several minutes to complete.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Process All'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    // Start batch scraping
    try {
      final articlesNotifier = ref.read(articlesProvider.notifier);
      final batchId = await articlesNotifier.startBatchScraping(allFlutterLinks);
      
      if (batchId != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Started processing ${allFlutterLinks.length} articles'),
            action: SnackBarAction(
              label: 'View Progress',
              onPressed: () => _showBatchProgress(context, batchId),
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to process links: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showBatchProgress(BuildContext context, String batchId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Batch Processing Progress'),
        content: SizedBox(
          width: 500,
          height: 400,
          child: ProgressIndicatorWidget(
            batchId: batchId,
            onCancel: () => Navigator.of(context).pop(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildLinksTabContent() {
    return const LinksView();
  }

  void _showInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Medium Flutter Link Extractor'),
        content: const Text(
          'Extract and manage Medium articles from email digests.\n\n'
          'Features:\n'
          '• Filter emails by date range and keywords\n'
          '• Extract article links from Medium digests\n'
          '• View article content with markdown support\n'
          '• Real-time progress tracking',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}