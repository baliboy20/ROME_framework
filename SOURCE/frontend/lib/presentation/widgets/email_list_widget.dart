import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:medium_flutter_extractor/presentation/widgets/progress_indicator_widget.dart';
import 'package:medium_flutter_extractor/presentation/widgets/email_articles_view.dart';
import 'package:medium_flutter_extractor/presentation/widgets/markdown_viewer.dart';
import 'package:medium_flutter_extractor/presentation/widgets/hyperlink_selector_dialog.dart';
import 'package:medium_flutter_extractor/core/utils/content_format_utils.dart';

class EmailListWidget extends ConsumerWidget {
  const EmailListWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailState = ref.watch(emailNotifierProvider);
    
    return emailState.when(
      data: (emails) {
        if (emails.isEmpty) {
          return _buildEmptyState(context);
        }
        return _buildEmailList(context, emails, ref);
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error, ref),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.inbox_outlined,
            size: 64,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            'No emails fetched',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          const Text('Use the filter on the left to fetch emails'),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text('Error loading emails: $error'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => ref.invalidate(emailNotifierProvider),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailList(BuildContext context, List<Map<String, dynamic>> emails, WidgetRef ref) {
    final dateFormat = DateFormat('MMM dd, yyyy HH:mm');
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: emails.length,
      itemBuilder: (context, index) {
        final email = emails[index];
        final date = email['date'] != null 
            ? DateTime.parse(email['date']) 
            : DateTime.now();
        final linksFound = email['linksFound'] ?? 0;
        final flutterLinks = (email['flutterLinks'] as List?)?.length ?? 0;
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ExpansionTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Icon(
                Icons.email,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
              ),
            ),
            title: Text(
              email['subject'] ?? 'No Subject',
              style: const TextStyle(fontWeight: FontWeight.bold),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(
                  'From: ${email['sender'] ?? 'Unknown'}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  dateFormat.format(date),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Chip(
                      label: Text('$linksFound total links'),
                      visualDensity: VisualDensity.compact,
                      labelStyle: const TextStyle(fontSize: 12),
                    ),
                    const SizedBox(width: 8),
                    if (flutterLinks > 0)
                      Chip(
                        label: Text('$flutterLinks Flutter links'),
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        visualDensity: VisualDensity.compact,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                      ),
                  ],
                ),
              ],
            ),
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (email['bodyPreview'] != null) ...[
                      Text(
                        'Preview:',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          email['bodyPreview'],
                          maxLines: 5,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                    if (flutterLinks > 0) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Flutter Links Found:',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      ..._buildLinksList(context, email['flutterLinks'] as List? ?? []),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          icon: const Icon(Icons.visibility),
                          label: const Text('View Full Email'),
                          onPressed: () => _showEmailDetails(context, email),
                        ),
                        const SizedBox(width: 8),
                        TextButton.icon(
                          icon: const Icon(Icons.article),
                          label: const Text('View Articles'),
                          onPressed: () => _navigateToEmailArticles(context, email),
                        ),
                        const SizedBox(width: 8),
                        if (flutterLinks > 0)
                          ElevatedButton.icon(
                            icon: const Icon(Icons.download),
                            label: const Text('Process Links'),
                            onPressed: () => _processEmailLinks(context, email, ref),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildLinksList(BuildContext context, List<dynamic> links) {
    return links.take(5).map((link) {
      final url = link is Map ? link['url'] ?? link.toString() : link.toString();
      final title = link is Map ? link['title'] ?? 'No title' : 'No title';
      
      return Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          children: [
            const Icon(Icons.link, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    url,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.blue,
                      decoration: TextDecoration.underline,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  void _showEmailDetails(BuildContext context, Map<String, dynamic> email) {
    // Debug: Log email content format
    print('DEBUG _showEmailDetails:');
    print('  Email content keys: ${email.keys.where((k) => k.contains('ontent') || k.contains('body')).toList()}');
    print('  Has markdownContent: ${email['markdownContent'] != null}');
    print('  Has htmlContent: ${email['htmlContent'] != null}');
    print('  Has bodyPreview: ${email['bodyPreview'] != null}');
    if (email['markdownContent'] != null) {
      print('  markdownContent length: ${email['markdownContent'].toString().length}');
    }
    if (email['htmlContent'] != null) {
      print('  htmlContent length: ${email['htmlContent'].toString().length}');
    }
    
    showDialog(
      context: context,
      builder: (context) => EmailDetailDialog(email: email),
    );
  }

  void _processEmailLinks(BuildContext context, Map<String, dynamic> email, WidgetRef ref) async {
    final flutterLinks = (email['flutterLinks'] as List?)?.cast<String>() ?? [];
    
    if (flutterLinks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No Flutter links to process in this email'),
        ),
      );
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Process Flutter Links'),
        content: Text(
          'Do you want to scrape ${flutterLinks.length} Flutter articles from this email?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Process'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    // Start batch scraping
    try {
      final articlesNotifier = ref.read(articlesProvider.notifier);
      final batchId = await articlesNotifier.startBatchScraping(flutterLinks);
      
      if (batchId != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Started processing ${flutterLinks.length} articles'),
            action: SnackBarAction(
              label: 'View Progress',
              onPressed: () => _showScrapingProgress(context, batchId),
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

  void _showScrapingProgress(BuildContext context, String batchId) {
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

  void _navigateToEmailArticles(BuildContext context, Map<String, dynamic> email) {
    final emailId = email['id'] ?? email['_id'] ?? 'unknown';
    final emailSubject = email['subject'] ?? 'No Subject';
    
    // Debug: Print email information
    print('DEBUG _navigateToEmailArticles:');
    print('  Email data keys: ${email.keys.toList()}');
    print('  Using emailId: "$emailId"');
    print('  Email subject: "$emailSubject"');
    print('  Email date: ${email['date']}');
    print('  Full email data: $email');
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => EmailArticlesView(
          emailId: emailId.toString(),
          emailSubject: emailSubject,
        ),
      ),
    );
  }
}

class EmailDetailDialog extends StatefulWidget {
  final Map<String, dynamic> email;

  const EmailDetailDialog({
    super.key,
    required this.email,
  });

  @override
  State<EmailDetailDialog> createState() => _EmailDetailDialogState();
}

class _EmailDetailDialogState extends State<EmailDetailDialog> {
  
  bool _hasAnyLinks(Map<String, dynamic> email) {
    // Check for article-related links only (not all hyperlinks)
    final articleLinks = _extractArticleLinksFromEmail(email);
    final hasArticleLinks = articleLinks.isNotEmpty;
    
    print('DEBUG _hasAnyLinks: Found ${articleLinks.length} article links');
    return hasArticleLinks;
  }
  
  bool _isArticleLink(String url) {
    // Check if URL is from known article/blog sites
    final articleDomains = [
      'medium.com',
      'dev.to',
      'hashnode.com',
      'substack.com',
      'blog.',
      'docs.flutter.dev',
      'flutter.dev',
      'pub.dev',
      'github.com',
      'stackoverflow.com',
    ];
    
    final lowerUrl = url.toLowerCase();
    return articleDomains.any((domain) => lowerUrl.contains(domain));
  }
  
  List<String> _extractArticleLinksFromEmail(Map<String, dynamic> email) {
    final Set<String> articleLinks = <String>{};
    
    // Priority 1: flutterLinks (usually article links)
    if (email['flutterLinks'] != null) {
      for (final link in email['flutterLinks'] as List) {
        final linkStr = link.toString();
        if (_isArticleLink(linkStr)) {
          articleLinks.add(linkStr);
        }
      }
    }
    
    // Priority 2: Filter allLinks for article domains
    if (articleLinks.isEmpty && email['allLinks'] != null) {
      for (final link in email['allLinks'] as List) {
        final linkStr = link.toString();
        if (_isArticleLink(linkStr)) {
          articleLinks.add(linkStr);
        }
      }
    }
    
    // Priority 3: Extract from email content and filter for articles
    if (articleLinks.isEmpty) {
      String? content;
      if (email['markdownContent'] != null) {
        content = email['markdownContent'].toString();
      } else if (email['htmlContent'] != null) {
        content = email['htmlContent'].toString();
      } else if (email['bodyPreview'] != null) {
        content = email['bodyPreview'].toString();
      }
      
      if (content != null) {
        final urlPattern = RegExp(r'https?://[^\s<>"]+');
        final matches = urlPattern.allMatches(content);
        for (final match in matches) {
          final url = match.group(0)!;
          if (_isArticleLink(url)) {
            articleLinks.add(url);
          }
        }
      }
    }
    
    return articleLinks.toList();
  }

  Widget _buildEmailFormatIndicator(Map<String, dynamic> email) {
    String format;
    Color indicatorColor;
    
    if (email['markdownContent'] != null) {
      format = 'MD';
      indicatorColor = Colors.green;
    } else if (email['htmlContent'] != null) {
      format = 'HTML';
      indicatorColor = Colors.orange;
    } else if (email['bodyPreview'] != null) {
      format = 'TEXT';
      indicatorColor = Colors.grey;
    } else {
      format = 'EMPTY';
      indicatorColor = Colors.red;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: indicatorColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: indicatorColor.withOpacity(0.5)),
      ),
      child: Text(
        format,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: indicatorColor,
        ),
      ),
    );
  }
  
  void _showHyperlinkSelector(BuildContext context, Map<String, dynamic> email) {
    // Create an enhanced email object with extracted links
    final enhancedEmail = Map<String, dynamic>.from(email);
    final extractedLinks = _extractArticleLinksFromEmail(email);
    
    // Ensure allLinks contains all found article links
    enhancedEmail['allLinks'] = extractedLinks;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => HyperlinkSelectorDialog(
        email: enhancedEmail,
        onLinksSelected: (selectedLinks) {
          _handleSelectedLinks(context, email, selectedLinks);
        },
      ),
    );
  }
  
  void _handleSelectedLinks(BuildContext context, Map<String, dynamic> email, List<String> selectedLinks) {
    if (selectedLinks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No links were selected'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }
    
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              CupertinoIcons.checkmark_circle,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            const Text(
              'Links Selected',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You have selected ${selectedLinks.length} link${selectedLinks.length == 1 ? '' : 's'} from:',
              style: const TextStyle(fontFamily: 'Comic Sans MS'),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                email['subject'] ?? 'No Subject',
                style: TextStyle(
                  fontFamily: 'Comic Sans MS',
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.primary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Selected links:',
              style: TextStyle(
                fontFamily: 'Comic Sans MS',
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 150),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: selectedLinks.take(5).map((link) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      '• ${Uri.parse(link).host}',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  )).toList()
                    ..addAll(selectedLinks.length > 5 ? [
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '... and ${selectedLinks.length - 5} more',
                          style: TextStyle(
                            fontFamily: 'Comic Sans MS',
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
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
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                ),
              ),
              child: Text(
                'Ready for Part 2: These links will be sent to the backend for scraping and conversion to markdown files.',
                style: TextStyle(
                  fontFamily: 'Comic Sans MS',
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.primary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(
              'OK',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMMM dd, yyyy HH:mm');
    final date = widget.email['date'] != null 
        ? DateTime.parse(widget.email['date']) 
        : DateTime.now();
    
    return Dialog(
      insetPadding: const EdgeInsets.all(32), // Better screen usage
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9, // Use more screen width
        height: MediaQuery.of(context).size.height * 0.85, // Use more screen height
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).colorScheme.background,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with padding
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.email['subject'] ?? 'No Subject',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontFamily: 'Comic Sans MS',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(
                              CupertinoIcons.person,
                              size: 16,
                              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'From: ${widget.email['sender'] ?? 'Unknown'}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontFamily: 'Comic Sans MS',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              CupertinoIcons.time,
                              size: 16,
                              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              dateFormat.format(date),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                fontFamily: 'Comic Sans MS',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Content format indicator
                  _buildEmailFormatIndicator(widget.email),
                  const SizedBox(width: 12),
                  
                  // Select Links button - moved to header for visibility
                  // Debug: Log email data for link detection
                  Builder(
                    builder: (context) {
                      print('DEBUG: Email link detection:');
                      print('  Email subject: ${widget.email['subject']}');
                      print('  allLinks: ${widget.email['allLinks']}');
                      print('  flutterLinks: ${widget.email['flutterLinks']}');
                      print('  Email keys: ${widget.email.keys.toList()}');
                      return const SizedBox.shrink();
                    },
                  ),
                  if (_hasAnyLinks(widget.email))
                    CupertinoButton.filled(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      onPressed: () => _showHyperlinkSelector(context, widget.email),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            CupertinoIcons.link,
                            size: 14,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Articles (${_extractArticleLinksFromEmail(widget.email).length})',
                            style: const TextStyle(
                              fontFamily: 'Comic Sans MS',
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            CupertinoIcons.link_circle,
                            size: 12,
                            color: Colors.grey[500],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'No Articles',
                            style: TextStyle(
                              fontFamily: 'Comic Sans MS',
                              fontSize: 10,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(width: 12),
                  
                  CupertinoButton(
                    padding: const EdgeInsets.all(8),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Icon(
                      CupertinoIcons.xmark_circle_fill,
                      size: 28,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            // Divider with full width
            Divider(
              height: 1,
              thickness: 0.5,
              color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
            ),
            // Email content area - use all available space with padding
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Email content - should be Markdown from backend
                  if (widget.email['markdownContent'] != null) ...[
                    // Use MarkdownViewer with full available space
                    Expanded(
                      flex: 3,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: MarkdownViewer(
                            content: widget.email['markdownContent'],
                          ),
                        ),
                      ),
                    ),
                  ] else if (widget.email['htmlContent'] != null) ...[
                    // Temporary fallback for HTML content during transition
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        border: Border.all(color: Colors.orange[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(CupertinoIcons.exclamationmark_triangle, 
                               color: Colors.orange[700], size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'This email content is in HTML format. Backend should convert to Markdown.',
                              style: TextStyle(
                                fontFamily: 'Comic Sans MS',
                                color: Colors.orange[700],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: SingleChildScrollView(
                          child: SelectableText(
                            widget.email['htmlContent'],
                            style: const TextStyle(
                              fontFamily: 'Comic Sans MS',
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ] else if (widget.email['bodyPreview'] != null) ...[
                    // Plain text preview
                    Expanded(
                      flex: 3,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: SingleChildScrollView(
                          child: SelectableText(
                            widget.email['bodyPreview'],
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontFamily: 'Comic Sans MS',
                            ),
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    // No content available
                    Expanded(
                      flex: 1,
                      child: Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                CupertinoIcons.doc_text,
                                size: 48,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No email content available',
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontFamily: 'Comic Sans MS',
                                  color: Colors.grey[600],
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  
                  // Links section (if available)  
                  if (_hasAnyLinks(widget.email)) ...[
                    const SizedBox(height: 16),
                    Container(
                      constraints: const BoxConstraints(maxHeight: 200),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Icon(
                                  CupertinoIcons.link,
                                  size: 20,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Article Links (${_extractArticleLinksFromEmail(widget.email).length})',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontFamily: 'Comic Sans MS',
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Divider(height: 1),
                          Expanded(
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: _extractArticleLinksFromEmail(widget.email).length,
                              separatorBuilder: (context, index) => const SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                final extractedLinks = _extractArticleLinksFromEmail(widget.email);
                                final link = extractedLinks[index];
                                return SelectableText(
                                  link.toString(),
                                  style: TextStyle(
                                    fontFamily: 'Comic Sans MS',
                                    color: Theme.of(context).colorScheme.primary,
                                    decoration: TextDecoration.underline,
                                    fontSize: 13,
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  ],
                ),
              ),
            ),
            // Bottom action bar with padding
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                    width: 0.5,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CupertinoButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text(
                      'Close',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ),
                  if ((widget.email['flutterLinks'] as List?)?.isNotEmpty ?? false) ...[
                    const SizedBox(width: 12),
                    CupertinoButton.filled(
                      onPressed: () {
                        Navigator.of(context).pop();
                        // TODO: Process links functionality
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            CupertinoIcons.cloud_download,
                            size: 16,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Process Flutter Links',
                            style: const TextStyle(
                              fontFamily: 'Comic Sans MS',
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}