import 'package:flutter/material.dart';

/// Non-web fallback for the A5c live preview (REQ-NOTIF10 CR-002, UXD-20).
/// The admin console ships as Flutter Web where the real iframe view
/// (email_preview_view_web.dart) is used; this stub keeps VM builds/tests
/// compiling.
class EmailPreviewView extends StatelessWidget {
  const EmailPreviewView({super.key, required this.srcdoc});

  /// Complete HTML document rendered by the preview.
  final String srcdoc;

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Text(
          'The HTML preview renders in the browser build.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12.5),
        ),
      ),
    );
  }
}
