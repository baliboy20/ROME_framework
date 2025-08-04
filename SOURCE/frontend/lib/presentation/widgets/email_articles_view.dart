import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/article_table.dart';
import 'package:url_launcher/url_launcher.dart';

/// Widget to show articles from a specific email
class EmailArticlesView extends ConsumerWidget {
  final String emailId;
  final String emailSubject;

  const EmailArticlesView({
    super.key,
    required this.emailId,
    required this.emailSubject,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articlesState = ref.watch(articlesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Articles from Email'),
            Text(
              emailSubject,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
      body: articlesState.when(
        data: (articles) {
          // Debug: Print all available information
          print('DEBUG EmailArticlesView:');
          print('  Looking for emailId: "$emailId"');
          print('  Total articles available: ${articles.length}');
          
          // Debug: Print first few articles with their sourceEmail values
          articles.take(3).forEach((article) {
            print('  Article: ${article.title}');
            print('    sourceEmail: "${article.sourceEmail['id']}"');
            print('    emailDate: ${article.emailDate}');
          });
          
          // Filter articles by source email
          final emailArticles = articles
              .where((article) => article.sourceEmail['id'] == emailId)
              .toList();
              
          print('  Filtered articles found: ${emailArticles.length}');

          if (emailArticles.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.article_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No articles found for this email',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text('Email ID: "$emailId"'),
                  const SizedBox(height: 8),
                  const Text('Possible reasons:'),
                  const SizedBox(height: 4),
                  const Text('• Email hasn\'t been processed yet'),
                  const SizedBox(height: 4),
                  const Text('• No Flutter links found in email'),
                  const SizedBox(height: 4),
                  const Text('• Articles exist but sourceEmail field doesn\'t match'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _showDebugInfo(context, articles),
                    child: const Text('Show Debug Info'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Summary header
              Container(
                padding: const EdgeInsets.all(16),
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Row(
                  children: [
                    Icon(
                      Icons.article,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${emailArticles.length} articles from this email',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              // Articles list
              Expanded(
                child: _EmailSpecificArticleTable(articles: emailArticles),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error loading articles: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(articlesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showDebugInfo(BuildContext context, List<ArticleModel> articles) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Debug: Email-Article Relationship'),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Looking for Email ID: "$emailId"'),
              const SizedBox(height: 16),
              Text('Total Articles: ${articles.length}'),
              const SizedBox(height: 16),
              const Text('All Articles with sourceEmail:'),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  itemCount: articles.length,
                  itemBuilder: (context, index) {
                    final article = articles[index];
                    final isMatch = article.sourceEmail['id'] == emailId;
                    return Card(
                      color: isMatch ? Colors.green[50] : null,
                      child: ListTile(
                        title: Text(
                          article.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('sourceEmail: "${article.sourceEmail['id']}"'),
                            Text('emailDate: ${article.emailDate}'),
                          ],
                        ),
                        trailing: isMatch 
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : const Icon(Icons.cancel, color: Colors.red),
                      ),
                    );
                  },
                ),
              ),
            ],
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
}

/// Simplified article table for specific email articles
class _EmailSpecificArticleTable extends StatelessWidget {
  final List<ArticleModel> articles;

  const _EmailSpecificArticleTable({required this.articles});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: articles.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final article = articles[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              article.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.person, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        article.author?['name'] ?? 'Unknown Author',
                        style: Theme.of(context).textTheme.bodySmall,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.schedule, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      article.readingTime,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.visibility),
                  onPressed: () => _showArticlePreview(context, article),
                  tooltip: 'Preview',
                ),
                IconButton(
                  icon: const Icon(Icons.open_in_new),
                  onPressed: () => _openUrl(article.url),
                  tooltip: 'Open in Medium',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showArticlePreview(BuildContext context, ArticleModel article) {
    showDialog(
      context: context,
      builder: (context) => ArticlePreviewDialog(article: article),
    );
  }

  Future<void> _openUrl(String url) async {
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }
}