import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../../../../widgets/status_pill.dart';
import '../../domain/entities/email_entities.dart';
import '../../domain/usecases/email_usecases.dart';
import '../bloc/templates_bloc.dart';

const _useCases = ['booking_confirmation', 'reminder', 'payment_receipt', 'cancellation_notice', 'review_request'];

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
    await showDialog<bool>(context: context, builder: (_) => _TemplateEditor(template: template));
    bloc.add(const LoadTemplatesEvent());
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
              Column(children: [for (final t in state.templates) _card(context, t)]),
          ],
        );
      },
    );
  }

  Widget _card(BuildContext context, EmailTemplate t) => InkWell(
        onTap: () => _openEditor(context, template: t),
        child: FobCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.name, style: const TextStyle(fontFamily: FobText.serif, fontWeight: FontWeight.w600, fontSize: 16, color: FobColors.textStrong)),
                    const SizedBox(height: 2),
                    Text('${t.useCase} · ${t.subject}', style: const TextStyle(fontSize: 12.5, color: FobColors.textMuted)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              PillLabel.forStatus(t.status),
            ],
          ),
        ),
      );
}

class _TemplateEditor extends StatefulWidget {
  const _TemplateEditor({this.template});
  final EmailTemplate? template;

  @override
  State<_TemplateEditor> createState() => _TemplateEditorState();
}

class _TemplateEditorState extends State<_TemplateEditor> {
  bool get _isEdit => widget.template != null;
  late final TextEditingController _name = TextEditingController(text: widget.template?.name ?? '');
  late final TextEditingController _subject = TextEditingController(text: widget.template?.subject ?? '');
  late final TextEditingController _body = TextEditingController(text: widget.template?.body ?? '');
  late String _useCase = widget.template?.useCase ?? _useCases.first;
  late String _status = widget.template?.status ?? 'draft';
  bool _saving = false;
  String? _error;

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
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = _isEdit
        ? {'name': _name.text.trim(), 'subject': _subject.text.trim(), 'body': _body.text.trim(), 'status': _status}
        : {'use_case': _useCase, 'name': _name.text.trim(), 'subject': _subject.text.trim(), 'body': _body.text.trim()};
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

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEdit ? 'Edit template' : 'New template'),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
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
              TextField(controller: _body, maxLines: 5, decoration: const InputDecoration(labelText: 'Body', border: OutlineInputBorder())),
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
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: FobColors.error, fontSize: 12.5)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(false), child: const Text('Cancel')),
        FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
      ],
    );
  }
}
