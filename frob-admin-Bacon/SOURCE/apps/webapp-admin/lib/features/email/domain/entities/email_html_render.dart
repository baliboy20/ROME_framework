/// REQ-NOTIF10 (CR-002/CHG-001) — Dart mirror of the worker's block→HTML
/// email renderer + house shell (SOURCE/worker/src/modules/notifications/
/// html-render.ts), used by the A5c live preview pane (UXD-20). MUST produce
/// byte-identical HTML for the same block JSON — parity is pinned by the
/// shared golden fixtures in SOURCE/worker/test/fixtures/html-email/ (see
/// test/features/email/html_render_parity_test.dart). Keep the two renderers
/// in lockstep: any change here or there must update the fixtures and pass
/// both suites.
///
/// House-shell spec: ARTIFACTS/_design/design-assets/email-house-shell.md.
library;

import 'email_blocks.dart';

// ---------------------------------------------------------------------------
// Config constants — mirroring the worker's constants. Logo is the real
// hosted asset (CHG-002); the footer identity remains a PLACEHOLDER.
// ---------------------------------------------------------------------------

const templateLogoUrl =
    'https://pub-301582f6d9af4200b73c5ca176edde9c.r2.dev/brand/img-logo.png';
const templateLogoWidth = 200;
const templateLogoHeight = 134;
const templateFooterIdentity = 'Friends on Bikes · hello@friendsonbikes.uk';

// House shell tokens (email-house-shell.md §2 — Forest, email-safe fallbacks).
const _fontBody = "'DM Sans',Helvetica,Arial,sans-serif";
const _fontDisplay = "'Syne',Georgia,'Times New Roman',serif";
const _cPage = '#f7f5ef';
const _cPaper = '#ffffff';
const _cText = '#243320';
const _cMuted = '#5a6b57';
const _cButton = '#3f7347';
const _cHeader = '#243320';
const _cBorder = '#dde3da';

/// HTML-escape & < > " ' — every Owner-entered value passes through here.
/// `{{merge}}` token syntax ([a-zA-Z0-9_{}]) contains no escaped characters,
/// so tokens survive verbatim for substitution.
String escapeHtml(String value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

/// Merge substitution for the preview — same regex as the worker's
/// `substituteMergeFieldsHtml`: values are HTML-escaped, unknown tokens
/// render blank.
String substituteMergeFieldsHtml(String html, Map<String, String> vars) =>
    html.replaceAllMapped(
      RegExp(r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}'),
      (m) => escapeHtml(vars[m[1]!] ?? ''),
    );

String _renderText(String text) =>
    '<tr><td style="padding:0 0 16px 0;font-family:$_fontBody;font-size:16px;line-height:24px;color:$_cText;">'
    '${escapeHtml(text)}'
    '</td></tr>';

String _renderButton(String label, String href) =>
    '<tr><td align="center" style="padding:0 0 16px 0;">'
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>'
    '<td align="center" style="background-color:$_cButton;border-radius:6px;">'
    '<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-family:$_fontBody;font-size:16px;line-height:24px;font-weight:bold;color:#ffffff;text-decoration:none;">'
    '${escapeHtml(label)}'
    '</a></td></tr></table></td></tr>';

String _renderDivider() =>
    '<tr><td style="padding:16px 0;"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid $_cBorder;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>';

String _renderHeaderBand(String tagline) {
  final taglineHtml = tagline.isNotEmpty
      ? '<div style="padding-top:8px;font-family:$_fontDisplay;font-size:20px;line-height:28px;font-weight:bold;color:#ffffff;">${escapeHtml(tagline)}</div>'
      : '';
  return '<tr><td align="center" style="background-color:$_cHeader;padding:20px;">'
      '<img src="$templateLogoUrl" width="$templateLogoWidth" height="$templateLogoHeight" alt="Friends on Bikes" style="display:block;max-height:${templateLogoHeight}px;border:0;" />'
      '$taglineHtml'
      '</td></tr>';
}

String _renderFooterBand(String footerText) {
  final ownerLine = footerText.isNotEmpty
      ? '<div style="padding-top:4px;">${escapeHtml(footerText)}</div>'
      : '';
  return '<tr><td align="center" style="background-color:$_cPage;padding:16px;font-family:$_fontBody;font-size:12px;line-height:18px;color:$_cMuted;">'
      '${escapeHtml(templateFooterIdentity)}'
      '$ownerLine'
      '</td></tr>';
}

/// Render the Owner-authored block list into the complete email-safe HTML
/// body — byte-identical to the worker's `renderBlocksToHtml` for the same
/// blocks. The first `header` block styles the header band (a minimal
/// logo-only band renders without one); the first `footer` block appends
/// below the fixed identity line; text/button/divider render in order inside
/// the content area.
String renderBlocksToHtml(List<EmailBlock> blocks) {
  String headerTagline = '';
  String footerText = '';
  for (final b in blocks) {
    if (b.type == 'header') {
      headerTagline = b.tagline;
      break;
    }
  }
  for (final b in blocks) {
    if (b.type == 'footer') {
      footerText = b.text;
      break;
    }
  }

  final contentRows = blocks.map((b) {
    switch (b.type) {
      case 'text':
        return _renderText(b.text);
      case 'button':
        return _renderButton(b.label, b.href);
      case 'divider':
        return _renderDivider();
      default:
        return ''; // header/footer render as shell bands, not content rows
    }
  }).join();

  return '<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:$_cPage;">'
      '<tr><td align="center" style="padding:24px;">'
      '<table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">'
      '${_renderHeaderBand(headerTagline)}'
      '<tr><td style="background-color:$_cPaper;padding:24px;">'
      '<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">'
      '$contentRows'
      '</table></td></tr>'
      '${_renderFooterBand(footerText)}'
      '</table></td></tr></table>';
}
