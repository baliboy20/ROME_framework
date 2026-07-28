import 'package:flutter/material.dart';

import '../../../../theme/tokens.dart';
import '../../domain/entities/email_blocks.dart';
import '../../domain/entities/email_html_render.dart';
import '../../domain/entities/email_merge_fields.dart';
import 'email_preview_view_stub.dart'
    if (dart.library.html) 'email_preview_view_web.dart';

/// A5c live preview pane (REQ-NOTIF10 CR-002, UXD-20): renders the house
/// shell + blocks with the use_case's sample merge data, re-rendering on
/// every edit. Permanently captioned as an approximation — the test-send is
/// the true-to-inbox check (UXD-21). With no blocks, shows the text-only
/// note instead (empty is a valid end state, not an error).
class EmailPreviewPane extends StatelessWidget {
  const EmailPreviewPane({super.key, required this.blocks, required this.useCase});

  final List<EmailBlock> blocks;
  final String useCase;

  String _srcdoc() {
    final body = substituteMergeFieldsHtml(
      renderBlocksToHtml(blocks),
      sampleDataForUseCase(useCase),
    );
    return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
        '<body style="margin:0;background-color:#f7f5ef;">$body</body></html>';
  }

  @override
  Widget build(BuildContext context) {
    if (blocks.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'No HTML version — this template sends as plain text only.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.5),
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: FobColors.hairline),
              borderRadius: BorderRadius.circular(6),
            ),
            clipBehavior: Clip.antiAlias,
            child: EmailPreviewView(srcdoc: _srcdoc()),
          ),
        ),
        const SizedBox(height: 6),
        // UXD-20: permanent caption — the pane is never inbox-accurate.
        const Text(
          'Approximate preview — email clients differ. Send a test to check a real inbox.',
          style: TextStyle(fontSize: 11.5, color: FobColors.textMuted, height: 1.4),
        ),
      ],
    );
  }
}
