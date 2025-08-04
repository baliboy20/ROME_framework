import 'dart:async';
import 'package:data_table_2/data_table_2.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:medium_flutter_extractor/core/utils/content_format_utils.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/api_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/markdown_viewer.dart';
import 'package:medium_flutter_extractor/presentation/widgets/progress_indicator_widget.dart';
import 'package:url_launcher/url_launcher.dart';

class ArticleTable extends ConsumerStatefulWidget {
  const ArticleTable({super.key});

  @override
  ConsumerState<ArticleTable> createState() => _ArticleTableState();
}

class _ArticleTableState extends ConsumerState<ArticleTable> {
  final Set<String> _selectedArticles = {};
  String? _currentBatchId;
  Timer? _debounceTimer;
  List<ArticleModel>? _cachedArticles;
  int _lastArticleCount = 0;
  bool _hasInitiallyLoaded = false;
  
  @override
  void initState() {
    super.initState();
    // Auto-load articles when component mounts
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_hasInitiallyLoaded) {
        _loadArticles();
        _hasInitiallyLoaded = true;
      }
    });
  }
  
  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadArticles() async {
    final articlesNotifier = ref.read(articlesProvider.notifier);
    await articlesNotifier.loadArticles();
  }

  void _checkForCompletedScraping(Map<String, ProgressUpdate> progressMap) {
    // Check if current batch has completed and refresh articles
    if (_currentBatchId != null && progressMap.containsKey(_currentBatchId)) {
      final progress = progressMap[_currentBatchId]!;
      
      if (progress.status == ProgressStatus.completed || 
          progress.status == ProgressStatus.failed) {
        
        // Use debounced timer to avoid multiple rapid refreshes
        _debounceTimer?.cancel();
        _debounceTimer = Timer(const Duration(seconds: 2), () {
          if (mounted) {
            _loadArticles();
            setState(() {
              _currentBatchId = null; // Clear the batch ID
            });
          }
        });
      }
    }
  }

  void _toggleSelection(String articleId) {
    setState(() {
      if (_selectedArticles.contains(articleId)) {
        _selectedArticles.remove(articleId);
      } else {
        _selectedArticles.add(articleId);
      }
    });
  }
  
  void _selectAll(List<ArticleModel> articles) {
    setState(() {
      if (_selectedArticles.length == articles.length) {
        _selectedArticles.clear();
      } else {
        _selectedArticles.addAll(articles.map((a) => a.id));
      }
    });
  }
  
  Future<void> _startScraping() async {
    if (_selectedArticles.isEmpty) return;
    
    final articlesNotifier = ref.read(articlesProvider.notifier);
    final articles = ref.read(articlesProvider).valueOrNull ?? [];
    
    // Get URLs of selected articles
    final selectedUrls = articles
        .where((article) => _selectedArticles.contains(article.id))
        .map((article) => article.url)
        .toList();
    
    if (selectedUrls.isEmpty) return;
    
    // Start batch scraping
    final batchId = await articlesNotifier.startBatchScraping(selectedUrls);
    
    if (batchId != null) {
      setState(() {
        _currentBatchId = batchId;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Started scraping ${selectedUrls.length} articles'),
          action: SnackBarAction(
            label: 'View Progress',
            onPressed: () => _showProgressDialog(batchId),
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to start scraping'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Future<void> _cancelScraping() async {
    if (_currentBatchId == null) return;
    
    final articlesNotifier = ref.read(articlesProvider.notifier);
    await articlesNotifier.cancelScraping(_currentBatchId!);
    
    setState(() {
      _currentBatchId = null;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Scraping cancelled')),
    );
  }
  
  void _showProgressDialog(String batchId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Scraping Progress'),
        content: SizedBox(
          width: 500,
          height: 400,
          child: ProgressIndicatorWidget(
            batchId: batchId,
            onCancel: () {
              Navigator.of(context).pop();
              _cancelScraping();
            },
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
  
  String _getArticleStatus(ArticleModel article) {
    // Use the actual status field from the backend
    return article.status;
  }

  Widget _buildStatusChip(String status) {
    Color color;
    IconData icon;
    
    switch (status.toLowerCase()) {
      case 'scraped':
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'processing':
        color = Colors.blue;
        icon = Icons.hourglass_empty;
        break;
      case 'pending':
        color = Colors.orange;
        icon = Icons.schedule;
        break;
      case 'failed':
        color = Colors.red;
        icon = Icons.error;
        break;
      case 'archived':
        color = Colors.grey;
        icon = Icons.archive;
        break;
      default:
        color = Colors.blue;
        icon = Icons.help;
    }
    
    return Chip(
      avatar: Icon(icon, size: 16, color: Colors.white),
      label: Text(
        status.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      backgroundColor: color,
    );
  }
  
  String _formatDate(DateTime date) {
    return DateFormat('MMM dd, yyyy').format(date);
  }
  
  Future<void> _openUrl(String url) async {
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  void _showArticlePreview(BuildContext context, ArticleModel article) async {
    showDialog(
      context: context,
      builder: (context) => ArticlePreviewDialog(article: article),
    );
  }

  Future<void> _deleteArticle(BuildContext context, ArticleModel article) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.warning,
              color: Colors.red[600],
            ),
            const SizedBox(width: 8),
            const Text('Delete Article'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to delete this article?'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Comic Sans MS',
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Author: ${article.author?['name'] ?? 'Unknown'}',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontFamily: 'Comic Sans MS',
                    ),
                  ),
                  Text(
                    'Status: ${article.status}',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontFamily: 'Comic Sans MS',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Text(
                'This will permanently delete the article from the database and remove the associated markdown file.',
                style: TextStyle(
                  color: Colors.red[800],
                  fontSize: 12,
                  fontFamily: 'Comic Sans MS',
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.delete, size: 16),
                SizedBox(width: 4),
                Text(
                  'Delete',
                  style: TextStyle(fontFamily: 'Comic Sans MS'),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        final articlesNotifier = ref.read(articlesProvider.notifier);
        await articlesNotifier.deleteArticle(article.id);
        
        if (mounted) {
          // Remove from selection if it was selected
          setState(() {
            _selectedArticles.remove(article.id);
          });
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Article "${article.title}" deleted successfully',
                style: const TextStyle(fontFamily: 'Comic Sans MS'),
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to delete article: ${e.toString()}',
                style: const TextStyle(fontFamily: 'Comic Sans MS'),
              ),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    }
  }

  Future<void> _deleteSelectedArticles(BuildContext context) async {
    if (_selectedArticles.isEmpty) return;

    final articlesState = ref.read(articlesProvider);
    final allArticles = articlesState.valueOrNull ?? [];
    final selectedArticles = allArticles
        .where((article) => _selectedArticles.contains(article.id))
        .toList();

    if (selectedArticles.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.warning,
              color: Colors.red[600],
            ),
            const SizedBox(width: 8),
            const Text('Delete Articles'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to delete ${selectedArticles.length} article${selectedArticles.length == 1 ? '' : 's'}?'),
            const SizedBox(height: 12),
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: selectedArticles.take(5).map((article) => 
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              article.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Comic Sans MS',
                                fontSize: 12,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Author: ${article.author?['name'] ?? 'Unknown'}',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontFamily: 'Comic Sans MS',
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  ).toList()
                    ..addAll(selectedArticles.length > 5 ? [
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          '... and ${selectedArticles.length - 5} more articles',
                          style: TextStyle(
                            fontStyle: FontStyle.italic,
                            color: Colors.grey[600],
                            fontFamily: 'Comic Sans MS',
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ] : []),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Text(
                'This will permanently delete all selected articles from the database and remove their associated markdown files.',
                style: TextStyle(
                  color: Colors.red[800],
                  fontSize: 12,
                  fontFamily: 'Comic Sans MS',
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.delete, size: 16),
                const SizedBox(width: 4),
                Text(
                  'Delete ${selectedArticles.length} Article${selectedArticles.length == 1 ? '' : 's'}',
                  style: const TextStyle(fontFamily: 'Comic Sans MS'),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        final articlesNotifier = ref.read(articlesProvider.notifier);
        
        // Delete articles one by one
        int deletedCount = 0;
        for (final article in selectedArticles) {
          try {
            await articlesNotifier.deleteArticle(article.id);
            deletedCount++;
          } catch (e) {
            print('Failed to delete article ${article.id}: $e');
          }
        }
        
        if (mounted) {
          // Clear selection
          setState(() {
            _selectedArticles.clear();
          });
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Successfully deleted $deletedCount of ${selectedArticles.length} article${selectedArticles.length == 1 ? '' : 's'}',
                style: const TextStyle(fontFamily: 'Comic Sans MS'),
              ),
              backgroundColor: deletedCount == selectedArticles.length ? Colors.green : Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to delete articles: ${e.toString()}',
                style: const TextStyle(fontFamily: 'Comic Sans MS'),
              ),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    }
  }

  Widget _buildDataTable(List<ArticleModel> articles) {
    return DataTable2(
      columnSpacing: 12,
      horizontalMargin: 12,
      minWidth: 800,
      showCheckboxColumn: false, // Optimize for performance
      dataRowHeight: 72, // Fixed height for better performance
      columns: [
        DataColumn2(
          label: Checkbox(
            value: _selectedArticles.length == articles.length && articles.isNotEmpty,
            tristate: true,
            onChanged: (_) => _selectAll(articles),
          ),
          fixedWidth: 60,
        ),
        const DataColumn2(
          label: Text('Title'),
          size: ColumnSize.L,
        ),
        const DataColumn2(
          label: Text('Author'),
          size: ColumnSize.S,
        ),
        const DataColumn2(
          label: Text('Scraped'),
          size: ColumnSize.S,
        ),
        const DataColumn2(
          label: Text('Reading Time'),
          fixedWidth: 100,
        ),
        const DataColumn2(
          label: Text('Status'),
          fixedWidth: 120,
        ),
        const DataColumn2(
          label: Text('Actions'),
          fixedWidth: 100,
        ),
      ],
      rows: articles.map((article) => _buildDataRow(article)).toList(),
    );
  }

  DataRow2 _buildDataRow(ArticleModel article) {
    final isSelected = _selectedArticles.contains(article.id);
    
    return DataRow2(
      selected: isSelected,
      cells: [
        DataCell(
          Checkbox(
            value: isSelected,
            onChanged: (_) => _toggleSelection(article.id),
          ),
        ),
        DataCell(
          Tooltip(
            message: article.title,
            child: Text(
              article.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        DataCell(
          Text(article.author?['name'] ?? 'Unknown'),
        ),
        DataCell(
          Text(_formatDate(DateTime.parse(article.scrapedAt))),
        ),
        DataCell(
          Text(article.readingTime),
        ),
        DataCell(
          _buildStatusChip(_getArticleStatus(article)),
        ),
        DataCell(
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.open_in_new, size: 18),
                onPressed: () => _openUrl(article.url),
                tooltip: 'Open URL',
              ),
              IconButton(
                icon: const Icon(Icons.visibility, size: 18),
                onPressed: () => _showArticlePreview(context, article),
                tooltip: 'Preview',
              ),
              IconButton(
                icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                onPressed: () => _deleteArticle(context, article),
                tooltip: 'Delete Article',
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  @override
  Widget build(BuildContext context) {
    try {
      final articlesState = ref.watch(articlesProvider);
      final progressMap = ref.watch(scrapingProgressProvider);
      
      // Check if any scraping operations have completed and refresh articles
      _checkForCompletedScraping(progressMap);
      
      final isScrapingInProgress = _currentBatchId != null && 
          progressMap[_currentBatchId]?.status == ProgressStatus.running;
      
      return Column(
      children: [
        // Header with actions
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Text(
                'Articles',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const Spacer(),
              if (_selectedArticles.isNotEmpty) ...[
                Chip(
                  label: Text('${_selectedArticles.length} selected'),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  icon: isScrapingInProgress 
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.download),
                  label: Text(isScrapingInProgress ? 'Scraping...' : 'Scrape Selected'),
                  onPressed: isScrapingInProgress ? null : _startScraping,
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  icon: const Icon(Icons.delete, size: 18),
                  label: const Text('Delete Selected'),
                  onPressed: () => _deleteSelectedArticles(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
                if (isScrapingInProgress) ...[
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.visibility),
                    label: const Text('View Progress'),
                    onPressed: () => _showProgressDialog(_currentBatchId!),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.secondary,
                    ),
                  ),
                ],
                const SizedBox(width: 8),
              ],
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadArticles,
                tooltip: 'Refresh',
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () async {
                  print('[ArticleTable] Manual load articles triggered');
                  await _loadArticles();
                },
                child: const Text('Debug Load'),
              ),
            ],
          ),
        ),
        
        // Data Table
        Expanded(
          child: articlesState.when(
            data: (articles) => _buildArticlesList(articles),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => _buildErrorWidget(error),
          ),
        ),
      ],
    );
    } catch (e, stackTrace) {
      // Error boundary - prevent total crash
      if (kDebugMode) {
        print('ArticleTable build error: $e');
        print('Stack trace: $stackTrace');
      }
      return _buildCrashRecoveryWidget(e);
    }
  }

  Widget _buildArticlesList(List<ArticleModel> articles) {
    // Optimize for memory - use caching for large lists
    if (articles.length != _lastArticleCount) {
      _lastArticleCount = articles.length;
      _cachedArticles = articles;
    }

    if (articles.isEmpty) {
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
              'No scraped articles found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontFamily: 'Comic Sans MS',
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Go to the Links tab to select and scrape articles from your emails',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
    
    // Limit articles to prevent browser crashes
    final displayArticles = articles.length > 50 
        ? articles.take(50).toList() 
        : articles;
    
    if (articles.length > 50) {
      return Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.orange[100],
            child: Row(
              children: [
                const Icon(Icons.warning, color: Colors.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Showing first 50 of ${articles.length} articles to prevent browser crashes. Use filters to narrow results.',
                    style: const TextStyle(color: Colors.orange),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _buildDataTable(displayArticles),
          ),
        ],
      );
    }
    
    return _buildDataTable(displayArticles);
  }

  Widget _buildErrorWidget(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text('Error loading articles: $error'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.read(articlesProvider.notifier).loadArticles(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildCrashRecoveryWidget(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          const Text(
            'Something went wrong with the article table',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          if (kDebugMode) 
            Text('Error: $error', style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _selectedArticles.clear();
                _cachedArticles = null;
                _lastArticleCount = 0;
              });
              ref.invalidate(articlesProvider);
            },
            child: const Text('Reset & Reload'),
          ),
        ],
      ),
    );
  }
}

class ArticlePreviewDialog extends ConsumerStatefulWidget {
  final ArticleModel article;

  const ArticlePreviewDialog({
    super.key,
    required this.article,
  });

  @override
  ConsumerState<ArticlePreviewDialog> createState() => _ArticlePreviewDialogState();
}

class _ArticlePreviewDialogState extends ConsumerState<ArticlePreviewDialog> {
  String? _content;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    if (widget.article.content.isNotEmpty) {
      // Already has content (should be Markdown after backend conversion)
      setState(() {
        _content = widget.article.content;
      });
      return;
    }

    // Load content from API (backend will convert HTML to Markdown)
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final content = await apiService.getArticleContent(widget.article.id);
      
      if (mounted) {
        setState(() {
          _content = content;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.9,
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.article.title,
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.person,
                              size: 16,
                              color: Theme.of(context).colorScheme.onPrimaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.article.author?['name'] ?? 'Unknown Author',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onPrimaryContainer,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Icon(
                              Icons.schedule,
                              size: 16,
                              color: Theme.of(context).colorScheme.onPrimaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.article.readingTime,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.open_in_new,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    onPressed: () async {
                      if (await canLaunchUrl(Uri.parse(widget.article.url))) {
                        await launchUrl(Uri.parse(widget.article.url));
                      }
                    },
                    tooltip: 'Open in Medium',
                  ),
                  // Content format indicator
                  if (_content != null)
                    _buildFormatIndicator(),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: Icon(
                      Icons.close,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: _buildContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormatIndicator() {
    if (_content == null) return const SizedBox.shrink();
    
    final format = ContentFormatUtils.detectFormat(_content!);
    final displayName = ContentFormatUtils.getFormatDisplayName(format);
    
    Color indicatorColor;
    switch (format) {
      case ContentFormat.html:
        indicatorColor = Colors.orange;
        break;
      case ContentFormat.markdown:
        indicatorColor = Colors.green;
        break;
      case ContentFormat.plainText:
        indicatorColor = Colors.grey;
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: indicatorColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: indicatorColor.withOpacity(0.5)),
      ),
      child: Text(
        displayName,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: indicatorColor,
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading article content...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Failed to load content: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadContent,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_content == null || _content!.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.article_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No content available'),
            SizedBox(height: 8),
            Text('This article may not have been scraped yet.'),
          ],
        ),
      );
    }

    // Handle content based on detected format
    final format = ContentFormatUtils.detectFormat(_content!);
    
    if (format == ContentFormat.html) {
      // During transition period, show HTML content with a notice
      return Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              border: Border.all(color: Colors.orange[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.orange[700]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'This content is in HTML format. It will be converted to Markdown soon for better display.',
                    style: TextStyle(
                      color: Colors.orange[700],
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: SelectableText(
                _content!,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
            ),
          ),
        ],
      );
    }
    
    // Use MarkdownViewer for Markdown content (preferred)
    return MarkdownViewer(
      content: _content!,
      title: widget.article.title,
    );
  }
}