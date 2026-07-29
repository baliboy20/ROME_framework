import 'package:equatable/equatable.dart';

/// REQ-NOTIF10 (CR-002/CHG-001) — the five pre-built email blocks the Owner
/// composes an optional HTML body from on screen A5c (UXD-20). Mirrors the
/// worker's Zod `blockSchema` (SOURCE/worker/src/modules/notifications/
/// html-render.ts): header {tagline?}, text {text}, button {label, href},
/// divider {}, footer {text?}. The Owner never sees or edits raw HTML —
/// blocks are the only authoring surface.
class EmailBlock extends Equatable {
  /// header | text | button | divider | footer
  final String type;
  final String tagline; // header (optional)
  final String text; // text (required) / footer (optional)
  final String label; // button (required)
  final String href; // button (required)

  const EmailBlock._(this.type, {this.tagline = '', this.text = '', this.label = '', this.href = ''});

  const EmailBlock.header({String tagline = ''}) : this._('header', tagline: tagline);
  const EmailBlock.text(String text) : this._('text', text: text);
  const EmailBlock.button({required String label, required String href})
      : this._('button', label: label, href: href);
  const EmailBlock.divider() : this._('divider');
  const EmailBlock.footer({String text = ''}) : this._('footer', text: text);

  static const types = ['header', 'text', 'button', 'divider', 'footer'];

  /// Palette display names (UXD-20 — "Header + logo · Text · Button · Divider · Footer").
  static const typeLabels = {
    'header': 'Header + logo',
    'text': 'Text',
    'button': 'Button',
    'divider': 'Divider',
    'footer': 'Footer',
  };

  factory EmailBlock.fromJson(Map<String, dynamic> j) {
    final type = j['type']?.toString() ?? '';
    switch (type) {
      case 'header':
        return EmailBlock.header(tagline: j['tagline']?.toString() ?? '');
      case 'text':
        return EmailBlock.text(j['text']?.toString() ?? '');
      case 'button':
        return EmailBlock.button(label: j['label']?.toString() ?? '', href: j['href']?.toString() ?? '');
      case 'divider':
        return const EmailBlock.divider();
      case 'footer':
        return EmailBlock.footer(text: j['text']?.toString() ?? '');
      default:
        throw FormatException('Unknown email block type: $type');
    }
  }

  /// Wire shape matching the worker's block schema exactly — optional fields
  /// are omitted when empty (header.tagline, footer.text).
  Map<String, dynamic> toJson() {
    switch (type) {
      case 'header':
        return {'type': 'header', if (tagline.isNotEmpty) 'tagline': tagline};
      case 'text':
        return {'type': 'text', 'text': text};
      case 'button':
        return {'type': 'button', 'label': label, 'href': href};
      case 'divider':
        return {'type': 'divider'};
      case 'footer':
      default:
        return {'type': 'footer', if (text.isNotEmpty) 'text': text};
    }
  }

  /// UXC-FRM-1 blur/submit validation (UXD-20): Text requires non-empty text;
  /// Button requires label + URL. Returns null when the block is valid.
  String? validate() {
    switch (type) {
      case 'text':
        return text.trim().isEmpty ? 'Text is required.' : null;
      case 'button':
        if (label.trim().isEmpty && href.trim().isEmpty) return 'Button needs a label and a link URL.';
        if (label.trim().isEmpty) return 'Button needs a label.';
        if (href.trim().isEmpty) return 'Button needs a link URL.';
        return null;
      default:
        return null;
    }
  }

  @override
  List<Object?> get props => [type, tagline, text, label, href];
}
