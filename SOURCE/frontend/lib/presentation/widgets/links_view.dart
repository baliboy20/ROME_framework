import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/article_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';

class LinksView extends ConsumerStatefulWidget {
  const LinksView({super.key});

  @override
  ConsumerState<LinksView> createState() => _LinksViewState();
}

class _LinksViewState extends ConsumerState<LinksView> {
  final Set<String> _selectedLinks = <String>{};
  Timer? _scrapingCompletionTimer;

  @override
  void dispose() {
    _scrapingCompletionTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailState = ref.watch(emailNotifierProvider);
    
    return emailState.when(
      data: (emails) {
        final articleLinks = _extractArticleLinks(emails);
        
        if (articleLinks.isEmpty) {
          return _buildEmptyState(context);
        }
        
        return _buildLinksGrid(context, articleLinks, ref);
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(context, error, ref),
    );
  }

  List<ArticleLink> _extractArticleLinks(List<Map<String, dynamic>> emails) {
    final List<ArticleLink> articleLinks = [];
    
    for (final email in emails) {
      final emailId = email['id'] ?? email['_id'] ?? 'unknown';
      final emailSubject = email['subject'] ?? 'No Subject';
      final emailDate = email['date'] != null 
          ? DateTime.parse(email['date']) 
          : DateTime.now();
      
      // Extract article links (Medium, Dev.to, etc.)
      final links = <String>[];
      
      // Check flutterLinks first (these are usually article links)
      if (email['flutterLinks'] != null) {
        for (final link in email['flutterLinks'] as List) {
          links.add(link.toString());
        }
      }
      
      // If no flutter links, check all links for article sites
      if (links.isEmpty && email['allLinks'] != null) {
        for (final link in email['allLinks'] as List) {
          final linkStr = link.toString();
          if (_isArticleLink(linkStr)) {
            links.add(linkStr);
          }
        }
      }
      
      // If still no links, scan email content for article URLs
      if (links.isEmpty) {
        final extractedLinks = _extractLinksFromContent(email);
        links.addAll(extractedLinks.where(_isArticleLink));
      }
      
      // Create ArticleLink objects
      for (final link in links) {
        articleLinks.add(
          ArticleLink(
            url: link,
            title: _extractTitleFromUrl(link),
            emailId: emailId.toString(),
            emailSubject: emailSubject,
            emailDate: emailDate,
            domain: _extractDomain(link),
          ),
        );
      }
    }
    
    // Sort by date (newest first)
    articleLinks.sort((a, b) => b.emailDate.compareTo(a.emailDate));
    
    return articleLinks;
  }
  
  bool _isArticleLink(String url) {
    final lowerUrl = url.toLowerCase();
    
    try {
      final uri = Uri.parse(url);
      final path = uri.path.toLowerCase();
      
      // Exclude non-article file extensions (check path without query params)
      final excludedExtensions = [
        '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.mp4', '.mp3', '.wav',
        '.css', '.js', '.json', '.xml', '.ico', '.woff', '.ttf'
      ];
      
      for (final ext in excludedExtensions) {
        if (path.endsWith(ext) || path.contains('$ext?') || path.contains('$ext#')) {
          return false;
        }
      }
      
      // Exclude tracking/analytics URLs and CDN/image hosts
      final excludedPatterns = [
        'miro.medium.com',  // Medium's image CDN
        'help.medium.com',  // Medium help pages
        'policy.medium.com', // Medium policy pages
        'cdn-images',       // Common CDN pattern
        'googleapis.com',   // Google CDN
        'gstatic.com',      // Google static content
        'cloudinary.com',   // Image CDN
        'imgur.com',        // Image hosting
        'google-analytics.com',
        'googletagmanager.com',
        'facebook.com/tr',
        'twitter.com/i/',
        'linkedin.com/li/',
        'doubleclick.net',
        'adsystem.com',
        'amazon-adsystem.com',
        'googlesyndication.com',
        'addthis.com',
        'sharethis.com',
        '/api/',
        '/ads/',
        '/tracking/',
        '/analytics/',
        'utm_',
        'fbclid=',
        'gclid=',
      ];
      
      for (final pattern in excludedPatterns) {
        if (lowerUrl.contains(pattern)) {
          return false;
        }
      }
      
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
        'freecodecamp.org',
        'css-tricks.com',
        'smashingmagazine.com',
        'alistapart.com',
        'codepen.io',
        'jsfiddle.net',
        'codesandbox.io',
        'replit.com',
        'glitch.com',
        'netlify.app',
        'vercel.app',
        'heroku.com',
        'planetscale.com',
        'railway.app',
        'render.com'
      ];
      
      // Check if it's from a known article domain
      final isFromArticleDomain = articleDomains.any((domain) => lowerUrl.contains(domain));
      if (!isFromArticleDomain) {
        return false;
      }
      
      // For Medium and similar platforms, ensure URL ends with article ID pattern
      if (lowerUrl.contains('medium.com') || lowerUrl.contains('dev.to')) {
        // Valid article URLs should end with a pattern like -alphanumeric
        // e.g., -c2471b9f2e19 or -3d4f5g6h
        final articleIdPattern = RegExp(r'-[a-zA-Z0-9]+$');
        return articleIdPattern.hasMatch(path);
      }
      
      return true;
      
    } catch (e) {
      // If URL parsing fails, it's probably not a valid article link
      return false;
    }
  }
  
  List<String> _extractLinksFromContent(Map<String, dynamic> email) {
    final Set<String> links = <String>{};
    
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
        var url = match.group(0)!;
        
        // Clean up URLs that might have trailing punctuation
        // Remove trailing ), ], }, ., ,, ;, : if not part of the URL structure
        url = url.replaceAll(RegExp(r'[)\]},.:;]+$'), '');
        
        // Only add if it passes the article filter
        if (_isArticleLink(url)) {
          links.add(url);
        }
      }
    }
    
    return links.toList();
  }
  
  String _extractTitleFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final path = uri.path;
      
      // Extract meaningful title from URL path
      if (path.length > 1) {
        final segments = path.split('/').where((s) => s.isNotEmpty).toList();
        if (segments.isNotEmpty) {
          final lastSegment = segments.last;
          // Clean up URL-style text
          return lastSegment
              .replaceAll('-', ' ')
              .replaceAll('_', ' ')
              .split(' ')
              .where((word) => word.isNotEmpty)
              .take(8) // Limit to 8 words
              .join(' ')
              .trim();
        }
      }
      
      return uri.host;
    } catch (e) {
      return 'Unknown Article';
    }
  }
  
  String _extractDomain(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host;
    } catch (e) {
      return 'unknown';
    }
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            CupertinoIcons.link,
            size: 64,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            'No Article Links Found',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontFamily: 'Comic Sans MS',
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Fetch emails first to see extractable article links',
            style: TextStyle(fontFamily: 'Comic Sans MS'),
          ),
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
          Text(
            'Error loading links: $error',
            style: const TextStyle(fontFamily: 'Comic Sans MS'),
          ),
          const SizedBox(height: 16),
          CupertinoButton.filled(
            onPressed: () => ref.invalidate(emailNotifierProvider),
            child: const Text(
              'Retry',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinksGrid(BuildContext context, List<ArticleLink> links, WidgetRef ref) {
    return Column(
      children: [
        // Header with count and actions
        Container(
          padding: const EdgeInsets.all(16),
          color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
          child: Row(
            children: [
              Icon(
                CupertinoIcons.link,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${links.length} Article Link${links.length == 1 ? '' : 's'} Ready for Scraping',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (_selectedLinks.isNotEmpty)
                      Text(
                        '${_selectedLinks.length} selected',
                        style: TextStyle(
                          fontFamily: 'Comic Sans MS',
                          color: Theme.of(context).colorScheme.primary,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              if (links.isNotEmpty) ...[
                CupertinoButton.filled(
                  onPressed: () => _selectAllLinks(context, links),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _selectedLinks.length == links.length 
                          ? CupertinoIcons.minus_circle
                          : CupertinoIcons.checkmark_circle,
                        size: 16,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _selectedLinks.length == links.length ? 'Deselect All' : 'Select All',
                        style: const TextStyle(
                          fontFamily: 'Comic Sans MS',
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_selectedLinks.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  CupertinoButton.filled(
                    onPressed: () => _processSelectedLinks(context, links),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          CupertinoIcons.cloud_download,
                          size: 16,
                          color: Colors.white,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Process Selected',
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
              ],
            ],
          ),
        ),
        
        // Links grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 2.2, // Adjusted for taller tiles with wrapping text
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: links.length,
            itemBuilder: (context, index) {
              return _buildLinkCard(context, links[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLinkCard(BuildContext context, ArticleLink link) {
    final isSelected = _selectedLinks.contains(link.url);
    final dateFormat = DateFormat('MMM dd');
    
    return Card(
      elevation: isSelected ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected 
            ? Theme.of(context).colorScheme.primary
            : Colors.transparent,
          width: isSelected ? 2 : 0,
        ),
      ),
      color: isSelected 
        ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
        : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => _toggleSelection(link.url),
        child: Container(
          height: 84, // Increased height to accommodate larger font and wrapping
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.start, // Align to top
            children: [
              // Line 1: Domain badge + Navigation icon + Selection indicator
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      link.domain,
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const Spacer(),
                  // Navigation icon to open URL in browser
                  GestureDetector(
                    onTap: () => _openUrlInBrowser(link.url),
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      child: Icon(
                        CupertinoIcons.arrow_up_right_square,
                        size: 14,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Selection indicator
                  if (isSelected)
                    Icon(
                      CupertinoIcons.checkmark_circle_fill,
                      size: 16,
                      color: Theme.of(context).colorScheme.primary,
                    )
                  else
                    Icon(
                      CupertinoIcons.circle,
                      size: 16,
                      color: Colors.grey[400],
                    ),
                ],
              ),
              const SizedBox(height: 6),
              
              // Line 2-3: Article title (wrapped, larger font, flexible height)
              Flexible(
                child: SizedBox(
                  width: double.infinity,
                  child: Text(
                    link.title,
                    style: TextStyle(
                      fontFamily: 'Comic Sans MS',
                      fontWeight: FontWeight.w600,
                      fontSize: 13, // Increased from 11 to 13
                      height: 1.2, // Line height for better text flow
                      color: isSelected 
                        ? Theme.of(context).colorScheme.primary
                        : null,
                    ),
                    maxLines: 2, // Allow wrapping to 2 lines
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.start,
                  ),
                ),
              ),
              
              const Spacer(), // Push bottom content to bottom
              
              // Bottom line: Email source + date (smaller, single line)
              Row(
                children: [
                  Expanded(
                    child: Text(
                      link.emailSubject,
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        fontSize: 10, // Slightly increased from 9 to 10
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    dateFormat.format(link.emailDate),
                    style: TextStyle(
                      fontFamily: 'Comic Sans MS',
                      fontSize: 10, // Slightly increased from 9 to 10
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _toggleSelection(String url) {
    setState(() {
      if (_selectedLinks.contains(url)) {
        _selectedLinks.remove(url);
      } else {
        _selectedLinks.add(url);
      }
    });
  }


  void _selectAllLinks(BuildContext context, List<ArticleLink> links) {
    setState(() {
      if (_selectedLinks.length == links.length) {
        // If all are selected, deselect all
        _selectedLinks.clear();
      } else {
        // Select all links
        _selectedLinks.addAll(links.map((link) => link.url));
      }
    });
  }


  Future<void> _processSelectedLinks(BuildContext context, List<ArticleLink> links) async {
    if (_selectedLinks.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No links selected for processing'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final selectedUrls = _selectedLinks.toList();
    final selectedCount = selectedUrls.length;
    
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              CupertinoIcons.cloud_download,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            const Text(
              'Start Scraping',
              style: TextStyle(fontFamily: 'Comic Sans MS'),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ready to scrape $selectedCount article${selectedCount == 1 ? '' : 's'}:',
              style: const TextStyle(fontFamily: 'Comic Sans MS'),
            ),
            const SizedBox(height: 12),
            Container(
              constraints: const BoxConstraints(maxHeight: 120),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: selectedUrls.take(5).map((url) {
                    try {
                      final domain = Uri.parse(url).host;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '• $domain',
                          style: TextStyle(
                            fontFamily: 'Comic Sans MS',
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                      );
                    } catch (e) {
                      return const SizedBox.shrink();
                    }
                  }).toList()
                    ..addAll(selectedUrls.length > 5 ? [
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '... and ${selectedUrls.length - 5} more',
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
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Theme.of(context).colorScheme.secondary.withOpacity(0.3),
                ),
              ),
              child: Text(
                'Articles will be scraped with Puppeteer, converted to markdown, and saved as text files in the local directory.',
                style: TextStyle(
                  fontFamily: 'Comic Sans MS',
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSecondaryContainer,
                  fontStyle: FontStyle.italic,
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
          CupertinoButton.filled(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  CupertinoIcons.play_fill,
                  size: 16,
                  color: Colors.white,
                ),
                SizedBox(width: 8),
                Text(
                  'Start Scraping',
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

    if (confirmed != true || !context.mounted) return;

    // Start scraping process
    try {
      final articlesNotifier = ref.read(articlesProvider.notifier);
      final batchId = await articlesNotifier.startBatchScraping(selectedUrls);
      
      if (batchId != null && context.mounted) {
        // Clear selection after successful start
        setState(() {
          _selectedLinks.clear();
        });
        
        // Start listening for completion to refresh articles
        _listenForScrapingCompletion(batchId);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Started scraping $selectedCount article${selectedCount == 1 ? '' : 's'}',
              style: const TextStyle(fontFamily: 'Comic Sans MS'),
            ),
            action: SnackBarAction(
              label: 'View Progress',
              onPressed: () => _showScrapingProgress(context, batchId),
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to start scraping: ${e.toString()}',
              style: const TextStyle(fontFamily: 'Comic Sans MS'),
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  Future<void> _openUrlInBrowser(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        // Handle error - URL can't be launched
        print('Could not launch URL: $url');
      }
    } catch (e) {
      // Handle parsing or launch errors
      print('Error launching URL: $e');
    }
  }

  Color _getStatusColor(ProgressStatus status, BuildContext context) {
    switch (status) {
      case ProgressStatus.pending:
        return Colors.orange[600] ?? Colors.orange;
      case ProgressStatus.running:
        return Theme.of(context).colorScheme.primary;
      case ProgressStatus.completed:
        return Colors.green[600] ?? Colors.green;
      case ProgressStatus.failed:
        return Colors.red[600] ?? Colors.red;
      case ProgressStatus.cancelled:
        return Colors.grey[600] ?? Colors.grey;
    }
  }

  void _listenForScrapingCompletion(String batchId) {
    // Cancel any existing timer first
    _scrapingCompletionTimer?.cancel();
    
    // Listen to progress updates and trigger article refresh when completed
    _scrapingCompletionTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      // Check if widget is still mounted before using ref
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      final progressMap = ref.read(scrapingProgressProvider);
      final progress = progressMap[batchId];
      
      if (progress != null && 
          (progress.status == ProgressStatus.completed || 
           progress.status == ProgressStatus.failed)) {
        
        timer.cancel();
        _scrapingCompletionTimer = null;
        
        // Refresh articles after a short delay
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            // Trigger articles refresh
            ref.read(articlesProvider.notifier).loadArticles();
            
            // Show completion notification
            if (progress.status == ProgressStatus.completed && mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Scraping completed! ${progress.completed} articles processed successfully.',
                    style: const TextStyle(fontFamily: 'Comic Sans MS'),
                  ),
                  backgroundColor: Colors.green,
                  duration: const Duration(seconds: 3),
                ),
              );
            }
          }
        });
      }
    });
  }

  void _showScrapingProgress(BuildContext context, String batchId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(24),
        child: Container(
          width: MediaQuery.of(context).size.width * 0.8,
          height: MediaQuery.of(context).size.height * 0.6,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    CupertinoIcons.cloud_download,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Scraping Progress',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontFamily: 'Comic Sans MS',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  CupertinoButton(
                    padding: const EdgeInsets.all(8),
                    onPressed: () => Navigator.of(context).pop(),
                    child: Icon(
                      CupertinoIcons.xmark_circle_fill,
                      size: 28,
                      color: Colors.grey[400],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Progress content
              Expanded(
                child: Consumer(
                  builder: (context, ref, child) {
                    final progressMap = ref.watch(scrapingProgressProvider);
                    final progress = progressMap[batchId];
                    
                    if (progress == null) {
                      return const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(),
                            SizedBox(height: 16),
                            Text(
                              'Initializing scraping...',
                              style: TextStyle(fontFamily: 'Comic Sans MS'),
                            ),
                          ],
                        ),
                      );
                    }
                    
                    final percentage = progress.total > 0 
                      ? (progress.completed + progress.failed) / progress.total 
                      : 0.0;
                    
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Progress bar
                        Container(
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: FractionallySizedBox(
                            widthFactor: percentage,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Progress stats
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total: ${progress.total}',
                              style: const TextStyle(fontFamily: 'Comic Sans MS'),
                            ),
                            Text(
                              'Completed: ${progress.completed}',
                              style: TextStyle(
                                fontFamily: 'Comic Sans MS',
                                color: Colors.green[600],
                              ),
                            ),
                            Text(
                              'Failed: ${progress.failed}',
                              style: TextStyle(
                                fontFamily: 'Comic Sans MS',
                                color: Colors.red[600],
                              ),
                            ),
                            Text(
                              '${(percentage * 100).toStringAsFixed(1)}%',
                              style: TextStyle(
                                fontFamily: 'Comic Sans MS',
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        
                        // Status message
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Status: ${progress.status.name.toUpperCase()}',
                                style: TextStyle(
                                  fontFamily: 'Comic Sans MS',
                                  fontWeight: FontWeight.w600,
                                  color: _getStatusColor(progress.status, context),
                                ),
                              ),
                              if (progress.currentUrl != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Currently processing: ${Uri.parse(progress.currentUrl!).host}',
                                  style: const TextStyle(
                                    fontFamily: 'Comic Sans MS',
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                              if (progress.error != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Error: ${progress.error}',
                                  style: TextStyle(
                                    fontFamily: 'Comic Sans MS',
                                    fontSize: 12,
                                    color: Colors.red[600],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              
              // Close button
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CupertinoButton.filled(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'Close',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

}

class ArticleLink {
  final String url;
  final String title;
  final String emailId;
  final String emailSubject;
  final DateTime emailDate;
  final String domain;

  ArticleLink({
    required this.url,
    required this.title,
    required this.emailId,
    required this.emailSubject,
    required this.emailDate,
    required this.domain,
  });
}