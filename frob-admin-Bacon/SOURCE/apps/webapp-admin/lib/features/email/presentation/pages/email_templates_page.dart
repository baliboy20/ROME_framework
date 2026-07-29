import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/prefs/recent_test_addresses.dart';
import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/email_entities.dart';
import '../../domain/usecases/email_usecases.dart';
import '../../domain/usecases/template_save_payload.dart';
import '../bloc/templates_bloc.dart';
import '../widgets/email_block_editor.dart';
import '../widgets/email_preview_pane.dart';
import '../widgets/html_import_panel.dart';
import '../../domain/entities/html_import_report.dart';
import '../../domain/repositories/email_repository.dart';

const _useCases = [
  'booking_confirmed_paid',
  'booking_deposit_received',
  'booking_reserved_unpaid',
  'booking_confirmation',
  'reminder',
  'payment_receipt',
  'cancellation_notice',
  'review_request',
];

/// CHG-003 (REQ-NOTIF10, A5c): "12 Jul 2026" — date-only variant of the
/// console's mail-date style; returns null when the value is absent/unparsable.
String? templateDateLabel(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso);
  if (dt == null) return null;
  const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final l = dt.toLocal();
  return '${l.day} ${mo[l.month - 1]} ${l.year}';
}

/// CHG-003 (REQ-NOTIF10, A5c): card metadata dates line, e.g.
/// "Created 12 Jul 2026 · Updated 27 Jul 2026". When updated == created (or
/// only one is present) a single "Created …" is shown; null when neither
/// timestamp is available.
String? templateDatesLine(EmailTemplate t) {
  final created = templateDateLabel(t.createdAt);
  final updated = templateDateLabel(t.updatedAt);
  if (created == null && updated == null) return null;
  if (created != null && (updated == null || updated == created)) return 'Created $created';
  if (created == null) return 'Updated $updated';
  return 'Created $created · Updated $updated';
}

/// CHG-007 (REQ-NOTIF10, A5c): the shared test-send prompt — used by both the
/// list-row action and the editor's Send test so the address flow is one
/// surface. Returns the trimmed "Send to" address ('' = owner default), or
/// null when cancelled. UXD-21: the copy states the multipart/plain variant.
Future<String?> promptTestSendAddress(BuildContext context, EmailTemplate t) async {
  final versions = t.hasHtmlVersion ? 'Sends the text + HTML versions.' : 'Sends the plain-text version.';
  // Loaded before the dialog opens so the list is there on first keystroke —
  // an autocomplete that populates a moment later is worse than none.
  const store = RecentTestAddresses();
  final recents = await store.load();
  if (!context.mounted) return null;

  var typed = '';
  final send = await showDialog<bool>(
    context: context,
    builder: (dctx) => AlertDialog(
      title: const Text('Send a test'),
      content: SizedBox(
        width: 460,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Renders “${t.name}” with sample data and emails it. $versions',
                style: const TextStyle(fontSize: 13, color: FobColors.textMuted)),
            const SizedBox(height: 14),
            RawAutocomplete<String>(
              // Empty input offers the whole list, so clicking into the box
              // reveals the addresses rather than hiding them behind a guess
              // at the first character.
              optionsBuilder: (value) => matchAddresses(recents, value.text),
              onSelected: (v) => typed = v,
              fieldViewBuilder: (context, controller, focusNode, onSubmit) {
                controller.addListener(() => typed = controller.text);
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  autofocus: true,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Send to',
                    hintText: 'Leave blank to send to the owner',
                    suffixIcon: recents.isEmpty
                        ? null
                        : IconButton(
                            tooltip: 'Recent addresses',
                            icon: const Icon(Icons.expand_more, size: 20),
                            // Re-focusing with empty text is what makes the
                            // full list appear.
                            onPressed: () {
                              controller.clear();
                              focusNode.requestFocus();
                            },
                          ),
                  ),
                  onSubmitted: (_) => Navigator.pop(dctx, true),
                );
              },
              optionsViewBuilder: (context, onSelected, options) => Align(
                alignment: Alignment.topLeft,
                child: Material(
                  elevation: 4,
                  borderRadius: BorderRadius.circular(FobRadius.field),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 190, maxWidth: 440),
                    child: ListView.builder(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      itemCount: options.length,
                      itemBuilder: (context, i) {
                        final option = options.elementAt(i);
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.history, size: 16, color: FobColors.textFaint),
                          title: Text(option, style: FobText.body),
                          onTap: () => onSelected(option),
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(dctx, false), child: const Text('Cancel')),
        FilledButton(onPressed: () => Navigator.pop(dctx, true), child: const Text('Send test')),
      ],
    ),
  );

  if (send != true) return null;
  final address = typed.trim();
  // Remembered on send rather than on typing, so a half-typed address never
  // ends up in the list.
  await store.remember(address);
  return address;
}

/// REQ-NOTIF10 — email template management.
class EmailTemplatesPage extends StatelessWidget {
  const EmailTemplatesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<TemplatesBloc>(
      create: (_) => sl<TemplatesBloc>()..add(const LoadTemplatesEvent()),
      child: const _TemplatesView(),
    );
  }
}

class _TemplatesView extends StatelessWidget {
  const _TemplatesView();

  Future<void> _openEditor(BuildContext context, {EmailTemplate? template}) async {
    final bloc = context.read<TemplatesBloc>();
    await showDialog<bool>(context: context, builder: (_) => TemplateEditor(template: template));
    bloc.add(const LoadTemplatesEvent());
  }

  void _reload(BuildContext context) => context.read<TemplatesBloc>().add(const LoadTemplatesEvent());

  void _toast(BuildContext context, String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? FobColors.error : null),
    );
  }

  /// Allocate = publish active (worker auto-retires the prior active for the use_case).
  Future<void> _allocate(BuildContext context, EmailTemplate t) async {
    final r = await sl<SaveTemplate>()(SaveTemplateParams(id: t.id, body: {'status': 'active'}));
    if (!context.mounted) return;
    r.fold(
      (f) => _toast(context, f.message, error: true),
      (_) { _toast(context, 'Allocated “${t.name}” to ${t.useCase}'); _reload(context); },
    );
  }

  /// Archive = retire (soft; preserves history).
  Future<void> _archive(BuildContext context, EmailTemplate t) async {
    final r = await sl<SaveTemplate>()(SaveTemplateParams(id: t.id, body: {'status': 'retired'}));
    if (!context.mounted) return;
    r.fold(
      (f) => _toast(context, f.message, error: true),
      (_) { _toast(context, 'Archived “${t.name}”'); _reload(context); },
    );
  }

  /// Hard delete — worker permits only an unused draft (else 409).
  Future<void> _delete(BuildContext context, EmailTemplate t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (dctx) => AlertDialog(
        title: const Text('Delete draft?'),
        content: Text('“${t.name}” will be permanently deleted. This is only possible for an unused draft.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: FobColors.error),
            onPressed: () => Navigator.pop(dctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final r = await sl<DeleteTemplate>()(t.id);
    if (!context.mounted) return;
    r.fold(
      (f) => _toast(context, f.message, error: true),
      (_) { _toast(context, 'Deleted “${t.name}”'); _reload(context); },
    );
  }

  Future<void> _testSend(BuildContext context, EmailTemplate t) async {
    // CHG-007: shared prompt (see promptTestSendAddress) — UXD-21 copy notes
    // whether the multipart/alternative (text + HTML) or plain variant sends.
    final to = await promptTestSendAddress(context, t);
    if (to == null || !context.mounted) return;
    final r = await sl<TestSendTemplate>()(TestSendParams(t.id, to: to));
    if (!context.mounted) return;
    r.fold(
      (f) => _toast(context, f.message, error: true),
      (to) => _toast(context, t.hasHtmlVersion ? 'Test sent (text + HTML) to $to' : 'Test sent (text) to $to'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TemplatesBloc, TemplatesState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Email templates', style: FobText.pageTitle),
                FilledButton.icon(
                  onPressed: () => _openEditor(context),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('New template'),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text('Reusable content for the triggered transactional sends. At most one active template per use-case.',
                style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5)),
            const SizedBox(height: FobSpace.block),
            if (state is TemplatesLoading || state is TemplatesInitial)
              const Padding(padding: EdgeInsets.all(28), child: Center(child: CircularProgressIndicator()))
            else if (state is TemplatesFailure)
              Text(state.message, style: FobText.body)
            else if ((state as TemplatesLoaded).templates.isEmpty)
              const Text('No templates yet — create your first one.', style: FobText.body)
            else
              // CHG-006 (REQ-NOTIF10, A5c): one panel of dense rows with
              // hairline dividers — mirrors the A19 bookings master row idiom.
              FobCard(
                padding: EdgeInsets.zero,
                child: Column(children: [
                  for (var i = 0; i < state.templates.length; i++)
                    _row(context, state.templates[i], i == state.templates.length - 1),
                ]),
              ),
          ],
        );
      },
    );
  }

  // CHG-006 (A5c): compact row — line 1 is name + status pill inline (menu
  // trailing); line 2 is 'use_case · subject' with ellipsis; the CHG-003
  // dates sit right-aligned in quiet text.
  Widget _row(BuildContext context, EmailTemplate t, bool last) => InkWell(
        onTap: () => _openEditor(context, template: t),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
          decoration: BoxDecoration(
            border: last ? null : const Border(bottom: BorderSide(color: FobColors.hairlineWarm)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(t.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontFamily: FobText.sans, fontWeight: FontWeight.w600, fontSize: 14, color: FobColors.textStrong)),
                        ),
                        const SizedBox(width: 8),
                        PillLabel.forStatus(t.status),
                      ],
                    ),
                    // CR-002: surface the server-rendered state — a template
                    // with body_html sends multipart text + HTML (UXD-21).
                    Text('${t.useCase} · ${t.subject}${t.hasHtmlVersion ? ' · text + HTML' : ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
                  ],
                ),
              ),
              // CHG-003 (REQ-NOTIF10, A5c): created/modified dates — kept, now
              // right-aligned quiet text on the row (omitted when absent).
              if (templateDatesLine(t) != null) ...[
                const SizedBox(width: 12),
                Text(templateDatesLine(t)!,
                    style: const TextStyle(fontSize: 11.5, color: FobColors.textMuted)),
              ],
              PopupMenuButton<String>(
                tooltip: 'Actions',
                icon: const Icon(Icons.more_horiz, size: 20, color: FobColors.textMuted),
                onSelected: (v) {
                  switch (v) {
                    case 'edit': _openEditor(context, template: t); break;
                    case 'test': _testSend(context, t); break;
                    case 'allocate': _allocate(context, t); break;
                    case 'archive': _archive(context, t); break;
                    case 'delete': _delete(context, t); break;
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                  const PopupMenuItem(value: 'test', child: Text('Send a test')),
                  if (t.status != 'active')
                    const PopupMenuItem(value: 'allocate', child: Text('Use for this process (publish)')),
                  if (t.status == 'active')
                    const PopupMenuItem(value: 'archive', child: Text('Archive')),
                  if (t.status == 'draft')
                    const PopupMenuItem(value: 'delete', child: Text('Delete draft', style: TextStyle(color: FobColors.error))),
                ],
              ),
            ],
          ),
        ),
      );
}

class TemplateEditor extends StatefulWidget {
  const TemplateEditor({super.key, this.template});
  final EmailTemplate? template;

  @override
  State<TemplateEditor> createState() => TemplateEditorState();
}

/// A5c template editor — CR-002 (CHG-001, REQ-NOTIF10) grows the dialog into
/// the UXD-20 three-region surface: fields column · HTML block section ·
/// live preview pane (side-by-side when wide, toggled when narrow).
class TemplateEditorState extends State<TemplateEditor> {
  bool get _isEdit => widget.template != null;
  late final TextEditingController _name = TextEditingController(text: widget.template?.name ?? '');
  late final TextEditingController _subject = TextEditingController(text: widget.template?.subject ?? '');
  late final TextEditingController _body = TextEditingController(text: widget.template?.body ?? '');
  late String _useCase = widget.template?.useCase ?? _useCases.first;
  late String _status = widget.template?.status ?? 'draft';
  late List<EmailBlock> _blocks = List.of(widget.template?.bodyBlocks ?? const []);
  late final List<EmailBlock> _savedBlocks = List.of(_blocks);
  bool _saving = false;
  bool _sendingTest = false;
  bool _showBlockErrors = false;
  bool _narrowShowPreview = false;
  String? _error;

  /// FR-001 workstream 5 — which authoring mode this template uses.
  /// Set from the saved record, so re-opening an imported template shows the
  /// import panel rather than an empty block editor.
  late String _bodySource = widget.template?.bodySource ?? 'blocks';

  /// Size of the stored imported document, kept in state so the preview
  /// reflects an import IMMEDIATELY. Reading it from `widget.template` meant
  /// the preview still described the template as it was when the dialog
  /// opened — so a successful import looked like it had done nothing.
  late int? _rawBytes = widget.template?.bodyHtml?.length;

  /// Whether the SAVED record still has blocks. Mutable, because
  /// `widget.template` is captured when the dialog opens and never refreshed —
  /// after an import it still reports the pre-import blocks, which is what made
  /// a save destroy the document just imported.
  late bool _hadBlocks = widget.template?.bodyBlocks.isNotEmpty ?? false;

  /// UXD-21: unsaved block edits disable the editor's test-send — the test
  /// sends the saved version.
  bool get _blocksDirty {
    if (_blocks.length != _savedBlocks.length) return true;
    for (var i = 0; i < _blocks.length; i++) {
      if (_blocks[i] != _savedBlocks[i]) return true;
    }
    return false;
  }

  @override
  void dispose() {
    _name.dispose();
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty || _subject.text.trim().isEmpty || _body.text.trim().isEmpty) {
      setState(() => _error = 'Name, subject and body are required.');
      return;
    }
    // UXC-FRM-1/3: block validation on submit, with adjacent reasons.
    if (_blocks.any((b) => b.validate() != null)) {
      setState(() {
        _showBlockErrors = true;
        _error = 'Fix the highlighted blocks before saving.';
      });
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    // CR-002 contract: submit body_blocks only — body_html is server-rendered.
    final body = buildTemplateSavePayload(
      isEdit: _isEdit,
      useCase: _useCase,
      name: _name.text.trim(),
      subject: _subject.text.trim(),
      body: _body.text.trim(),
      status: _status,
      blocks: _blocks,
      hadBlocks: _hadBlocks,
      bodySource: _bodySource,
    );
    final r = await sl<SaveTemplate>()(SaveTemplateParams(id: widget.template?.id, body: body));
    r.fold(
      (f) => setState(() {
        _saving = false;
        _error = 'Could not save: ${f.message}';
      }),
      (_) {
        if (mounted) Navigator.of(context).pop(true);
      },
    );
  }

  /// UXD-21: editor test-send — delivers the saved version (multipart when the
  /// saved template has an HTML body). Disabled while block edits are unsaved.
  /// CHG-007 (REQ-NOTIF10): prompts for a "Send to" address via the same
  /// dialog as the list-row action (blank → owner default).
  Future<void> _sendTest() async {
    final t = widget.template;
    if (t == null) return;
    final to = await promptTestSendAddress(context, t);
    if (to == null || !mounted) return;
    setState(() => _sendingTest = true);
    final r = await sl<TestSendTemplate>()(TestSendParams(t.id, to: to));
    if (!mounted) return;
    setState(() => _sendingTest = false);
    final messenger = ScaffoldMessenger.of(context);
    r.fold(
      (f) => messenger.showSnackBar(SnackBar(content: Text(f.message), backgroundColor: FobColors.error)),
      (to) => messenger.showSnackBar(SnackBar(
          content: Text(t.hasHtmlVersion ? 'Test sent (text + HTML) to $to' : 'Test sent (text) to $to'))),
    );
  }

  Widget _fieldsColumn() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!_isEdit)
          DropdownButtonFormField<String>(
            initialValue: _useCase,
            decoration: const InputDecoration(labelText: 'Use case', isDense: true, border: OutlineInputBorder()),
            items: [for (final u in _useCases) DropdownMenuItem(value: u, child: Text(u))],
            onChanged: (v) => setState(() => _useCase = v ?? _useCase),
          ),
        const SizedBox(height: 10),
        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name', isDense: true, border: OutlineInputBorder())),
        const SizedBox(height: 10),
        TextField(controller: _subject, decoration: const InputDecoration(labelText: 'Subject', isDense: true, border: OutlineInputBorder())),
        const SizedBox(height: 10),
        // The plain-text body stays required — the guaranteed fallback of
        // every send (REQ-NOTIF10 invariant).
        TextField(controller: _body, maxLines: 5, decoration: const InputDecoration(labelText: 'Body (plain text — always sent)', border: OutlineInputBorder())),
        if (_isEdit) ...[
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _status,
            decoration: const InputDecoration(labelText: 'Status', isDense: true, border: OutlineInputBorder()),
            items: const [
              DropdownMenuItem(value: 'draft', child: Text('draft')),
              DropdownMenuItem(value: 'active', child: Text('active (publish)')),
              DropdownMenuItem(value: 'retired', child: Text('retired')),
            ],
            onChanged: (v) => setState(() => _status = v ?? _status),
          ),
        ],
      ],
    );
  }

  /// FR-001 workstream 5 — send an imported document to the server.
  ///
  /// Only available on a saved template: the document is stored against a
  /// template id, so there must be a record to attach it to. Creating first is
  /// a small extra step, and it keeps import from inventing a half-saved state.
  /// Deliberately does NOT refresh the templates list from here. This dialog is
  /// opened by `showDialog`, whose context sits outside the BlocProvider, so
  /// `context.read<TemplatesBloc>()` throws — and the throw escaped before the
  /// import panel could clear its spinner, which is why a SUCCESSFUL import
  /// looked like a hang. `_openEditor` already reloads the list when the dialog
  /// closes, so the refresh was redundant as well as wrong.
  Future<HtmlImportReport?> _importHtml(String html) async {
    final id = widget.template?.id;
    if (id == null) return null;
    final result = await sl<EmailRepository>().importTemplateHtml(id, html);
    return result.fold(
      (failure) => null,
      (report) {
        if (mounted) {
          setState(() {
            _bodySource = 'raw';
            _blocks = [];
            _rawBytes = report.processedBytes;
            // The import cleared body_blocks server-side; forgetting this is
            // what let the next save send `body_blocks: null` and wipe the
            // document.
            _hadBlocks = false;
          });
        }
        return report;
      },
    );
  }

  /// The preview region. `EmailPreviewPane` renders BLOCKS; it reports "no HTML
  /// version" whenever the block list is empty, which is always true in raw
  /// mode — so it told the Owner the template was plain text while it was in
  /// fact sending an imported HTML document. Raw mode gets its own panel.
  Widget _previewArea() {
    if (_bodySource != 'raw') {
      return EmailPreviewPane(blocks: _blocks, useCase: _useCase);
    }
    final bytes = _rawBytes ?? 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: FobColors.surfaceRaised,
        border: Border.all(color: FobColors.hairline),
        borderRadius: BorderRadius.circular(FobRadius.card),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(bytes > 0 ? Icons.description_outlined : Icons.upload_file_outlined,
              size: 26, color: FobColors.textFaint),
          const SizedBox(height: 10),
          Text(
            bytes > 0 ? 'Imported HTML document' : 'No document imported yet',
            style: FobText.cardTitle,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            bytes > 0
                ? '$bytes bytes. This is what will be sent, exactly as written.\n'
                    'It cannot be previewed here — send a test to see it in a real inbox.'
                : 'Choose a file or paste HTML to import a document.',
            style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted, height: 1.5),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _modeToggle() {
    Widget tab(String value, String label) {
      final active = _bodySource == value;
      return GestureDetector(
        onTap: () => setState(() => _bodySource = value),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 6),
          decoration: BoxDecoration(
            color: active ? FobColors.surfaceCard : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
            border: active ? Border.all(color: FobColors.hairline) : null,
          ),
          child: Text(label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: active ? FobColors.textStrong : FobColors.textMuted,
              )),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: FobColors.surfaceRail,
        borderRadius: BorderRadius.circular(FobRadius.button),
        border: Border.all(color: FobColors.hairline),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        tab('blocks', 'Blocks'),
        const SizedBox(width: 3),
        tab('raw', 'Full HTML document'),
      ]),
    );
  }

  Widget _htmlSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('HTML version (optional)',
            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: FobColors.textLabel)),
        const SizedBox(height: 8),
        _modeToggle(),
        const SizedBox(height: 12),
        if (_bodySource == 'raw')
          if (!_isEdit)
            const Text(
              'Save this template first, then import a document into it.',
              style: TextStyle(fontSize: 12.5, color: FobColors.textMuted),
            )
          else
            HtmlImportPanel(
              isRaw: widget.template?.isRawHtml ?? false,
              currentBytes: widget.template?.bodyHtml?.length,
              onImport: _importHtml,
            )
        else
          EmailBlockEditor(
            initialBlocks: widget.template?.bodyBlocks ?? const [],
            useCase: _useCase,
            showErrors: _showBlockErrors,
            onChanged: (b) => setState(() => _blocks = b),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 1080;
    final testDisabled = _sendingTest || _saving || _blocksDirty;
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: wide ? 1040 : 560, maxHeight: 640),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_isEdit ? 'Edit template' : 'New template',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 14),
              Flexible(
                child: wide
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(width: 300, child: SingleChildScrollView(child: _fieldsColumn())),
                          const SizedBox(width: 18),
                          Expanded(child: SingleChildScrollView(child: _htmlSection())),
                          const SizedBox(width: 18),
                          SizedBox(
                            width: 340,
                            height: 520,
                            child: _previewArea(),
                          ),
                        ],
                      )
                    : SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _fieldsColumn(),
                            const SizedBox(height: 14),
                            _htmlSection(),
                            const SizedBox(height: 10),
                            // UXD-20: preview toggled on narrow widths.
                            TextButton.icon(
                              onPressed: () => setState(() => _narrowShowPreview = !_narrowShowPreview),
                              icon: Icon(_narrowShowPreview ? Icons.visibility_off : Icons.visibility, size: 16),
                              label: Text(_narrowShowPreview ? 'Hide preview' : 'Show preview'),
                            ),
                            if (_narrowShowPreview)
                              SizedBox(height: 420, child: _previewArea()),
                          ],
                        ),
                      ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: FobColors.error, fontSize: 12.5)),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  if (_isEdit) ...[
                    OutlinedButton.icon(
                      onPressed: testDisabled ? null : _sendTest,
                      icon: const Icon(Icons.outgoing_mail, size: 16),
                      label: Text(_sendingTest ? 'Sending…' : 'Send test'),
                    ),
                    if (_blocksDirty) ...[
                      const SizedBox(width: 8),
                      // UXD-21 adjacent reason for the disabled control.
                      const Flexible(
                        child: Text('Save the draft first — the test sends the saved version.',
                            style: TextStyle(fontSize: 11.5, color: FobColors.textMuted)),
                      ),
                    ],
                  ],
                  const Spacer(),
                  TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(false), child: const Text('Cancel')),
                  const SizedBox(width: 8),
                  FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
