import 'package:flutter/material.dart';

import '../../../../theme/tokens.dart';
import '../../domain/entities/email_blocks.dart';
import '../../domain/entities/email_merge_fields.dart';

/// A5c block editor (REQ-NOTIF10 CR-002, UXD-20): ordered block cards with a
/// five-type palette (Header + logo · Text · Button · Divider · Footer),
/// per-block fields, remove (✕) and keyboard-operable ↑/↓ reorder controls
/// (UXC-A11Y-1 — no drag-only affordance), and a `{{ merge }}` field picker
/// fed by the use_case's declared catalogue. The Owner never sees raw HTML.
class EmailBlockEditor extends StatefulWidget {
  const EmailBlockEditor({
    super.key,
    required this.initialBlocks,
    required this.useCase,
    required this.onChanged,
    this.showErrors = false,
  });

  final List<EmailBlock> initialBlocks;
  final String useCase;
  final ValueChanged<List<EmailBlock>> onChanged;

  /// Set after a failed save so invalid blocks show their message (UXC-FRM-1).
  final bool showErrors;

  @override
  State<EmailBlockEditor> createState() => _EmailBlockEditorState();
}

class _BlockDraft {
  static int _seq = 0;
  final Key key = ValueKey('block-${_seq++}');
  final String type;
  final TextEditingController f1; // tagline / text / label / footer text
  final TextEditingController f2; // button href
  _BlockDraft(this.type, {String f1Text = '', String f2Text = ''})
      : f1 = TextEditingController(text: f1Text),
        f2 = TextEditingController(text: f2Text);

  factory _BlockDraft.fromBlock(EmailBlock b) {
    switch (b.type) {
      case 'header':
        return _BlockDraft('header', f1Text: b.tagline);
      case 'text':
        return _BlockDraft('text', f1Text: b.text);
      case 'button':
        return _BlockDraft('button', f1Text: b.label, f2Text: b.href);
      case 'footer':
        return _BlockDraft('footer', f1Text: b.text);
      default:
        return _BlockDraft('divider');
    }
  }

  EmailBlock toBlock() {
    switch (type) {
      case 'header':
        return EmailBlock.header(tagline: f1.text);
      case 'text':
        return EmailBlock.text(f1.text);
      case 'button':
        return EmailBlock.button(label: f1.text, href: f2.text);
      case 'footer':
        return EmailBlock.footer(text: f1.text);
      default:
        return const EmailBlock.divider();
    }
  }

  void dispose() {
    f1.dispose();
    f2.dispose();
  }
}

class _EmailBlockEditorState extends State<EmailBlockEditor> {
  late final List<_BlockDraft> _drafts =
      widget.initialBlocks.map(_BlockDraft.fromBlock).toList();

  @override
  void dispose() {
    for (final d in _drafts) {
      d.dispose();
    }
    super.dispose();
  }

  List<EmailBlock> get blocks => [for (final d in _drafts) d.toBlock()];

  void _notify() => widget.onChanged(blocks);

  void _add(String type) {
    setState(() => _drafts.add(_BlockDraft(type)));
    _notify();
  }

  void _remove(int i) {
    setState(() => _drafts.removeAt(i).dispose());
    _notify();
  }

  void _move(int i, int delta) {
    final j = i + delta;
    if (j < 0 || j >= _drafts.length) return;
    setState(() {
      final d = _drafts.removeAt(i);
      _drafts.insert(j, d);
    });
    _notify();
  }

  /// Inserts `{{ field }}` at the caret of [c] (UXD-20 merge-field picker).
  void _insertMerge(TextEditingController c, String field) {
    final token = '{{ $field }}';
    final sel = c.selection;
    final text = c.text;
    final start = sel.isValid ? sel.start : text.length;
    final end = sel.isValid ? sel.end : text.length;
    c.value = TextEditingValue(
      text: text.replaceRange(start, end, token),
      selection: TextSelection.collapsed(offset: start + token.length),
    );
    _notify();
  }

  Widget _mergePicker(TextEditingController target) {
    final fields = mergeFieldsForUseCase(widget.useCase);
    if (fields.isEmpty) return const SizedBox.shrink();
    return PopupMenuButton<String>(
      tooltip: 'Insert merge field',
      icon: const Icon(Icons.data_object, size: 16, color: FobColors.textMuted),
      onSelected: (f) => _insertMerge(target, f),
      itemBuilder: (_) => [
        for (final f in fields)
          PopupMenuItem(value: f, child: Text('{{ $f }}', style: const TextStyle(fontSize: 12.5))),
      ],
    );
  }

  InputDecoration _dec(String label, {Widget? suffix}) => InputDecoration(
        labelText: label,
        isDense: true,
        border: const OutlineInputBorder(),
        suffixIcon: suffix,
      );

  Widget _fields(_BlockDraft d) {
    switch (d.type) {
      case 'header':
        return TextField(
          controller: d.f1,
          onChanged: (_) => _notify(),
          decoration: _dec('Tagline (optional)', suffix: _mergePicker(d.f1)),
        );
      case 'text':
        return TextField(
          controller: d.f1,
          maxLines: 3,
          onChanged: (_) => _notify(),
          decoration: _dec('Text', suffix: _mergePicker(d.f1)),
        );
      case 'button':
        return Column(children: [
          TextField(
            controller: d.f1,
            onChanged: (_) => _notify(),
            decoration: _dec('Label', suffix: _mergePicker(d.f1)),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: d.f2,
            onChanged: (_) => _notify(),
            decoration: _dec('Link URL', suffix: _mergePicker(d.f2)),
          ),
        ]);
      case 'footer':
        return TextField(
          controller: d.f1,
          onChanged: (_) => _notify(),
          decoration: _dec('Footer text (optional)'),
        );
      default: // divider — no fields
        return const SizedBox.shrink();
    }
  }

  Widget _card(int i, _BlockDraft d) {
    final error = widget.showErrors ? d.toBlock().validate() : null;
    return Container(
      key: d.key,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: FobColors.surfaceRaised,
        border: Border.all(color: error != null ? FobColors.error : FobColors.hairline),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(EmailBlock.typeLabels[d.type] ?? d.type,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: FobColors.textLabel)),
              ),
              IconButton(
                tooltip: 'Move up',
                visualDensity: VisualDensity.compact,
                iconSize: 16,
                onPressed: i == 0 ? null : () => _move(i, -1),
                icon: const Icon(Icons.arrow_upward),
              ),
              IconButton(
                tooltip: 'Move down',
                visualDensity: VisualDensity.compact,
                iconSize: 16,
                onPressed: i == _drafts.length - 1 ? null : () => _move(i, 1),
                icon: const Icon(Icons.arrow_downward),
              ),
              IconButton(
                tooltip: 'Remove block',
                visualDensity: VisualDensity.compact,
                iconSize: 16,
                onPressed: () => _remove(i),
                icon: const Icon(Icons.close, color: FobColors.textMuted),
              ),
            ],
          ),
          if (d.type != 'divider') ...[const SizedBox(height: 6), _fields(d)],
          if (error != null) ...[
            const SizedBox(height: 4),
            Text(error, style: const TextStyle(fontSize: 11.5, color: FobColors.error)),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_drafts.isEmpty)
          // UXD-20 empty state: text-only is a valid end state, never an error.
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'No HTML version — this template sends as plain text only.',
              style: TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.5),
            ),
          )
        else
          for (var i = 0; i < _drafts.length; i++) _card(i, _drafts[i]),
        // Palette — exactly the five block types (UXD-20).
        PopupMenuButton<String>(
          tooltip: 'Add block',
          onSelected: _add,
          itemBuilder: (_) => [
            for (final t in EmailBlock.types)
              PopupMenuItem(value: t, child: Text(EmailBlock.typeLabels[t]!)),
          ],
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.add, size: 16, color: FobColors.textLink),
              SizedBox(width: 4),
              Text('Add block', style: TextStyle(fontSize: 12.5, color: FobColors.textLink, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }
}
