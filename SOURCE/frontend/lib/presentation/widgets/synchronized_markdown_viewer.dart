import 'package:flutter/material.dart';
import 'markdown_viewer.dart';

/// A widget that displays two synchronized markdown viewers side by side
/// Useful for comparing original and processed content, or for preview/edit modes
class SynchronizedMarkdownViewer extends StatefulWidget {
  final String primaryContent;
  final String secondaryContent;
  final String? primaryTitle;
  final String? secondaryTitle;

  const SynchronizedMarkdownViewer({
    super.key,
    required this.primaryContent,
    required this.secondaryContent,
    this.primaryTitle,
    this.secondaryTitle,
  });

  @override
  State<SynchronizedMarkdownViewer> createState() => _SynchronizedMarkdownViewerState();
}

class _SynchronizedMarkdownViewerState extends State<SynchronizedMarkdownViewer> {
  final ScrollController _primaryController = ScrollController();
  final ScrollController _secondaryController = ScrollController();
  final GlobalKey<_MarkdownViewerState> _primaryKey = GlobalKey();
  final GlobalKey<_MarkdownViewerState> _secondaryKey = GlobalKey();

  @override
  void dispose() {
    _primaryController.dispose();
    _secondaryController.dispose();
    super.dispose();
  }

  void _onPrimaryScroll(double ratio) {
    _secondaryKey.currentState?.scrollToRatio(ratio);
  }

  void _onSecondaryScroll(double ratio) {
    _primaryKey.currentState?.scrollToRatio(ratio);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: MarkdownViewer(
            key: _primaryKey,
            content: widget.primaryContent,
            title: widget.primaryTitle,
            scrollController: _primaryController,
            onScroll: _onPrimaryScroll,
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(
          child: MarkdownViewer(
            key: _secondaryKey,
            content: widget.secondaryContent,
            title: widget.secondaryTitle,
            scrollController: _secondaryController,
            onScroll: _onSecondaryScroll,
          ),
        ),
      ],
    );
  }
}