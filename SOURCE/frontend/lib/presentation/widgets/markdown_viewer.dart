import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:url_launcher/url_launcher.dart';

class MarkdownViewer extends StatefulWidget {
  final String content;
  final String? title;
  final bool showFullscreen;
  final ScrollController? scrollController;
  final ValueChanged<double>? onScroll;

  const MarkdownViewer({
    super.key,
    required this.content,
    this.title,
    this.showFullscreen = false,
    this.scrollController,
    this.onScroll,
  });

  @override
  State<MarkdownViewer> createState() => _MarkdownViewerState();
}

class _MarkdownViewerState extends State<MarkdownViewer> {
  late ScrollController _internalScrollController;
  bool _isScrolling = false;

  @override
  void initState() {
    super.initState();
    _internalScrollController = widget.scrollController ?? ScrollController();
    _internalScrollController.addListener(_onScrollChanged);
  }

  @override
  void dispose() {
    if (widget.scrollController == null) {
      _internalScrollController.dispose();
    } else {
      _internalScrollController.removeListener(_onScrollChanged);
    }
    super.dispose();
  }

  void _onScrollChanged() {
    if (!_isScrolling && widget.onScroll != null) {
      final position = _internalScrollController.position;
      if (position.hasContentDimensions) {
        final scrollRatio = position.pixels / position.maxScrollExtent;
        widget.onScroll!(scrollRatio.clamp(0.0, 1.0));
      }
    }
  }

  void scrollToRatio(double ratio) {
    if (_internalScrollController.hasClients) {
      _isScrolling = true;
      final targetPosition = _internalScrollController.position.maxScrollExtent * ratio;
      _internalScrollController.animateTo(
        targetPosition,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      ).then((_) {
        _isScrolling = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.showFullscreen) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.title ?? 'Article Preview'),
          actions: [
            IconButton(
              icon: const Icon(Icons.copy),
              onPressed: () => _copyToClipboard(context),
              tooltip: 'Copy to clipboard',
            ),
          ],
        ),
        body: _buildMarkdownContent(),
      );
    }

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.title != null) ...[
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      widget.title!,
                      style: Theme.of(context).textTheme.headlineSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.fullscreen),
                        onPressed: () => _showFullscreen(context),
                        tooltip: 'Show fullscreen',
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy),
                        onPressed: () => _copyToClipboard(context),
                        tooltip: 'Copy to clipboard',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(),
          ],
          Expanded(child: _buildMarkdownContent()),
        ],
      ),
    );
  }

  Widget _buildMarkdownContent() {
    return Markdown(
      data: widget.content,
      selectable: true,
      controller: _internalScrollController,
      onTapLink: (text, href, title) async {
        if (href != null && await canLaunchUrl(Uri.parse(href))) {
          await launchUrl(Uri.parse(href));
        }
      },
      builders: {
        'code': CodeElementBuilder(),
      },
      styleSheet: MarkdownStyleSheet(
        codeblockDecoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        code: TextStyle(
          backgroundColor: Colors.grey[200],
          fontFamily: 'monospace',
        ),
        blockquoteDecoration: BoxDecoration(
          color: Colors.blue[50],
          border: Border(
            left: BorderSide(
              color: Colors.blue[300]!,
              width: 4,
            ),
          ),
        ),
        h1: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          height: 1.5,
        ),
        h2: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          height: 1.4,
        ),
        h3: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          height: 1.3,
        ),
        p: const TextStyle(
          fontSize: 16,
          height: 1.6,
        ),
      ),
    );
  }

  void _showFullscreen(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => MarkdownViewer(
          content: widget.content,
          title: widget.title,
          showFullscreen: true,
        ),
      ),
    );
  }

  void _copyToClipboard(BuildContext context) async {
    try {
      await Clipboard.setData(ClipboardData(text: widget.content));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Markdown content copied to clipboard'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to copy content: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class CodeElementBuilder extends MarkdownElementBuilder {
  @override
  Widget? visitElementAfter(md.Element element, TextStyle? preferredStyle) {
    var language = '';

    if (element.attributes['class'] != null) {
      String lg = element.attributes['class'] as String;
      language = lg.substring(9); // Remove 'language-' prefix
    }

    return SizedBox(
      width: double.infinity,
      child: HighlightView(
        element.textContent,
        language: language.isNotEmpty ? language : 'plaintext',
        theme: githubTheme,
        padding: const EdgeInsets.all(12),
        textStyle: const TextStyle(
          fontFamily: 'monospace',
          fontSize: 14,
        ),
      ),
    );
  }
}