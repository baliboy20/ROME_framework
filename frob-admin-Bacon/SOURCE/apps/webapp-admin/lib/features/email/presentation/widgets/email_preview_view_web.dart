// A5c live preview iframe (REQ-NOTIF10 CR-002, UXD-20) — Flutter Web only.
//
// Renders the house shell + blocks HTML in a sandboxed iframe via `srcdoc`.
// The document contains no scripts by construction (the renderer emits inline
// styles + tables only) and the sandbox attribute blocks scripts anyway.

// dart:html is deprecated in favour of package:web, which this app does not
// yet depend on; the iframe usage here is minimal and migrates trivially.
// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

class EmailPreviewView extends StatefulWidget {
  const EmailPreviewView({super.key, required this.srcdoc});

  /// Complete HTML document rendered by the preview.
  final String srcdoc;

  @override
  State<EmailPreviewView> createState() => _EmailPreviewViewState();
}

class _EmailPreviewViewState extends State<EmailPreviewView> {
  static int _instance = 0;
  late final String _viewType = 'fob-email-preview-${_instance++}';
  late final html.IFrameElement _iframe;

  @override
  void initState() {
    super.initState();
    _iframe = html.IFrameElement()
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%'
      ..setAttribute('sandbox', '') // no scripts, no navigation
      ..srcdoc = widget.srcdoc;
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int _) => _iframe);
  }

  @override
  void didUpdateWidget(EmailPreviewView old) {
    super.didUpdateWidget(old);
    if (old.srcdoc != widget.srcdoc) _iframe.srcdoc = widget.srcdoc;
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
