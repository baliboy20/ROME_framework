import 'dart:io';

import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../domain/entities/html_import_report.dart';
import '../../domain/usecases/html_image_converter.dart';

/// FR-001 workstream 5 — import a complete HTML document as the template body.
///
/// Images are converted here, on the Owner's machine, before anything is sent
/// (see [convertEmbeddedImages]). The server then extracts them to storage and
/// returns a report; both halves are shown together so the Owner sees one
/// account of what happened rather than two.
class HtmlImportPanel extends StatefulWidget {
  /// Sends the (already image-converted) document. Returns the server report.
  final Future<HtmlImportReport?> Function(String html) onImport;
  final bool isRaw;
  final int? currentBytes;

  const HtmlImportPanel({
    super.key,
    required this.onImport,
    required this.isRaw,
    this.currentBytes,
  });

  @override
  State<HtmlImportPanel> createState() => _HtmlImportPanelState();
}

class _HtmlImportPanelState extends State<HtmlImportPanel> {
  bool _busy = false;
  String _stage = '';
  String? _fileName;
  String? _error;
  HtmlImportReport? _report;
  ImageConversionResult? _conversion;

  Future<void> _pickFile() async {
    const typeGroup = XTypeGroup(label: 'HTML', extensions: ['html', 'htm']);
    final file = await openFile(acceptedTypeGroups: const [typeGroup]);
    if (file == null) return;
    final html = await File(file.path).readAsString();
    await _run(html, file.name);
  }

  Future<void> _paste() async {
    final controller = TextEditingController();
    final html = await showDialog<String>(
      context: context,
      builder: (dctx) => AlertDialog(
        title: const Text('Paste HTML'),
        content: SizedBox(
          width: 620,
          child: TextField(
            controller: controller,
            maxLines: 14,
            style: const TextStyle(fontFamily: FobText.mono, fontSize: 11.5),
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '<!DOCTYPE html> …',
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(dctx, controller.text),
            child: const Text('Import'),
          ),
        ],
      ),
    );
    if (html == null || html.trim().isEmpty) return;
    await _run(html, 'pasted document');
  }

  Future<void> _run(String html, String name) async {
    final imageCount = countEmbeddedImages(html);
    setState(() {
      _busy = true;
      _error = null;
      _fileName = name;
      _stage = imageCount == 0
          ? 'Importing…'
          : 'Converting $imageCount image${imageCount == 1 ? '' : 's'}…';
    });

    // Everything is wrapped: an exception here previously escaped and left the
    // spinner running forever on an import that had actually SUCCEEDED. A
    // failure must always end with a visible message, never silence.
    try {
      // Decoding and re-encoding a 1024px image in pure Dart takes seconds, so
      // it runs on a background isolate. On the UI thread it froze the window
      // and even stopped the spinner animating, which read as a crash.
      // WebP is why this is needed at all: classic Outlook cannot display it.
      // Transparent images become PNG (JPEG would put a solid box behind a
      // cut-out logo); everything else becomes JPEG.
      final conversion = await compute(convertEmbeddedImages, html);

      if (!mounted) return;
      setState(() => _stage = 'Uploading…');

      final report = await widget.onImport(conversion.html);
      if (!mounted) return;
      setState(() {
        _busy = false;
        _conversion = conversion;
        _report = report;
        if (report == null) {
          _error = 'The document could not be saved. Check the connection and try again.';
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Import failed: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _banner(),
        const SizedBox(height: 12),
        if (_busy)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 22),
            child: Row(children: [
              const SizedBox(
                  width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
              const SizedBox(width: 10),
              Text(_stage, style: FobText.body),
            ]),
          )
        else
          _dropZone(),
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(_error!, style: const TextStyle(fontSize: 12.5, color: FobColors.error)),
        ],
        if (_report != null) ...[
          const SizedBox(height: 14),
          _reportCard(_report!),
        ],
      ],
    );
  }

  /// States plainly what importing gives up. Without this, an Owner discovers
  /// the missing FOB header only after a customer receives it.
  Widget _banner() => Container(
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          color: FobHue.orange.background,
          borderRadius: BorderRadius.circular(FobRadius.field),
        ),
        child: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline, size: 16, color: FobColors.orangeText),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'An imported document is sent exactly as written. The standard FOB header and '
                'footer are not added, and the usual layout safeguards do not apply — the '
                'document provides its own. Other templates are unaffected.',
                style: TextStyle(fontSize: 12, color: FobColors.orangeText, height: 1.45),
              ),
            ),
          ],
        ),
      );

  Widget _dropZone() => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        decoration: BoxDecoration(
          color: FobColors.surfaceRaised,
          border: Border.all(color: FobColors.hairline),
          borderRadius: BorderRadius.circular(FobRadius.card),
        ),
        child: Column(
          children: [
            Text(
              widget.isRaw ? 'Replace the imported document' : 'Import an HTML document',
              style: FobText.cardTitle,
            ),
            const SizedBox(height: 4),
            const Text(
              'Images are converted and moved out of the document automatically.',
              style: TextStyle(fontSize: 12, color: FobColors.textMuted),
            ),
            const SizedBox(height: 12),
            Wrap(spacing: 9, children: [
              AppButton(label: 'Choose file…', kind: AppButtonKind.primary, onPressed: _pickFile),
              AppButton(label: 'Paste HTML', kind: AppButtonKind.secondary, onPressed: _paste),
            ]),
          ],
        ),
      );

  Widget _reportCard(HtmlImportReport r) {
    final conv = _conversion;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: FobColors.hairline),
        borderRadius: BorderRadius.circular(FobRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: const BoxDecoration(
              color: FobColors.surfaceRail,
              border: Border(bottom: BorderSide(color: FobColors.hairline)),
            ),
            child: Text(
              _fileName == null ? 'IMPORT CHECK' : 'IMPORT CHECK · ${_fileName!.toUpperCase()}',
              style: FobText.microLabel,
            ),
          ),
          if (r.bytesSaved > 0)
            _line(
              tag: 'Done',
              hue: FobHue.lime,
              text: 'Size ${formatBytes(r.originalBytes)} → ${formatBytes(r.processedBytes)} '
                  '(${r.percentSmaller}% smaller). '
                  '${r.imagesHosted} image${r.imagesHosted == 1 ? '' : 's'} moved out of the document.',
            ),
          if (conv != null && conv.didAnything)
            _line(
              tag: 'Done',
              hue: FobHue.lime,
              text: conv.converted
                  .map((c) => '${c.fromMime.toUpperCase()} → ${c.toMime.toUpperCase()}'
                      '${c.hadTransparency ? ' (kept transparency)' : ''}')
                  .join(', '),
            ),
          // The one that fails silently at send time, so it leads on colour.
          if (r.unknownFields.isNotEmpty)
            _line(
              tag: 'Check',
              hue: FobHue.pink,
              text: '${r.unknownFields.length} merge field'
                  '${r.unknownFields.length == 1 ? '' : 's'} will arrive blank: '
                  '${r.unknownFields.join(', ')}. '
                  'This email does not supply them, and nothing warns you at send time.',
            ),
          if (r.knownFields.isNotEmpty)
            _line(
              tag: 'Note',
              hue: FobHue.cyan,
              text: '${r.knownFields.length} merge field'
                  '${r.knownFields.length == 1 ? '' : 's'} will fill correctly: '
                  '${r.knownFields.join(', ')}.',
            ),
          for (final n in r.notes) _line(tag: 'Note', hue: FobHue.orange, text: n),
        ],
      ),
    );
  }

  Widget _line({required String tag, required FobHue hue, required String text}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: FobColors.hairline)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 1),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: hue.background,
                borderRadius: BorderRadius.circular(FobRadius.round),
              ),
              child: Text(tag.toUpperCase(),
                  style: TextStyle(
                      fontFamily: FobText.mono,
                      fontFamilyFallback: FobText.monoFallback,
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: hue.foreground)),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Text(text,
                  style: const TextStyle(fontSize: 12, color: FobColors.textBody, height: 1.45)),
            ),
          ],
        ),
      );
}
