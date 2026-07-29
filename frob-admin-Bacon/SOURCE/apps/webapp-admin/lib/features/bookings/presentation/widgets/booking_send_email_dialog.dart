// CR-004 (CHG-012, REQ-NOTIF11) — UXD-23: send an email to the booking's lead
// from the A19 detail card. Template-only (DECIDE-3): the dialog offers active
// BOOKING-AWARE templates (use_case ∈ the client merge-field catalogue,
// DECIDE-1), prefills the editable recipient from the lead contact, shows the
// personal-message box only when the chosen template carries the
// {{personal_message}} token (DECIDE-2), and live-previews the CR-002 house
// shell filled with THIS booking's real merge data plus the typed message.
// Disabled states carry adjacent reasons (UXC-FRM-3).
import 'package:flutter/material.dart';

import '../../../../core/types/result.dart';
import '../../../../theme/tokens.dart';
import '../../../email/domain/entities/email_entities.dart';
import '../../../email/domain/entities/email_html_render.dart';
import '../../../email/domain/entities/email_merge_fields.dart';
import '../../../email/presentation/widgets/email_preview_view_stub.dart'
    if (dart.library.html) '../../../email/presentation/widgets/email_preview_view_web.dart';
import '../../domain/entities/booking_detail.dart';
import '../../domain/usecases/booking_usecases.dart';

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in booking_send_email_test.dart)
// ---------------------------------------------------------------------------

/// Whitespace-tolerant {{ personal_message }} token — the api-contract's
/// client-side slot-discovery rule (api-contracts.md#cr-004).
final RegExp kPersonalMessageToken = RegExp(r'\{\{\s*personal_message\s*\}\}');

/// A template "supports" the personal message iff the literal token appears in
/// its subject, body, or bodyHtml (no template-model change — DECIDE-2).
bool templateHasPersonalMessageSlot(EmailTemplate t) =>
    kPersonalMessageToken.hasMatch(t.subject) ||
    kPersonalMessageToken.hasMatch(t.body) ||
    kPersonalMessageToken.hasMatch(t.bodyHtml ?? '');

/// Picker filter (UXD-23 §1): active AND booking-aware — the template's
/// use_case is a key of the booking merge catalogue (mirror of the worker's
/// OUTCOME_FIELDS allowlist).
List<EmailTemplate> bookingAwareActiveTemplates(List<EmailTemplate> all) => all
    .where((t) => t.status == 'active' && kMergeFieldCatalogue.containsKey(t.useCase))
    .toList();

/// Recipient format validation (UXC-FRM-1/2).
bool isValidEmailAddress(String value) =>
    RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim());

String _money(num pence) => '£${(pence / 100).toStringAsFixed(2)}';

/// Client-side mirror of the worker's `buildBookingMergeVars` (booking-
/// outcome.ts) for the pre-send preview: THIS booking's real merge data. The
/// send itself re-renders server-side from the same catalogue, so the preview
/// remains an approximation (UXD-20 caption discipline).
Map<String, String> bookingMergeVars(BookingDetail d) {
  final paid = d.paymentAttempts
      .where((p) => p.status == 'succeeded' || p.status == 'partially_refunded')
      .fold<int>(0, (sum, p) => sum + p.amountPence);
  final balance = d.priceTotalPence - paid;
  return {
    'name': d.leadName,
    'tour': d.tourId ?? '',
    'date': d.date ?? '',
    'time': '',
    'party_size': '${d.partySize}',
    'amount_paid': _money(paid),
    'balance_due': _money(balance < 0 ? 0 : balance),
    'booking_ref': d.id,
    'meeting_point': 'Barbican Centre, Silk Street, London EC2Y 8DS',
    'completion_link': '',
  };
}

/// Plain-text merge substitution for the subject/text preview (unknown tokens
/// render blank — REQ-NOTIF10 rule; no HTML escaping outside the HTML body).
String substituteMergeFieldsText(String text, Map<String, String> vars) =>
    text.replaceAllMapped(
      RegExp(r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}'),
      (m) => vars[m[1]!] ?? '',
    );

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

/// UXD-23 send dialog, launched from the A19 floating detail card. The caller
/// passes the FULL template list (filtering happens here) and the send
/// callback; on success the dialog pops with the address sent to.
class BookingSendEmailDialog extends StatefulWidget {
  const BookingSendEmailDialog({
    super.key,
    required this.detail,
    required this.templates,
    required this.onSend,
  });

  final BookingDetail detail;
  final List<EmailTemplate> templates;
  final Future<Result<String>> Function(SendBookingEmailParams params) onSend;

  @override
  State<BookingSendEmailDialog> createState() => _BookingSendEmailDialogState();
}

class _BookingSendEmailDialogState extends State<BookingSendEmailDialog> {
  late final List<EmailTemplate> _options = bookingAwareActiveTemplates(widget.templates);
  late final TextEditingController _toCtrl =
      TextEditingController(text: widget.detail.leadEmail ?? '');
  final TextEditingController _msgCtrl = TextEditingController();
  EmailTemplate? _selected;
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _toCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  bool get _recipientValid => isValidEmailAddress(_toCtrl.text);

  /// Adjacent disabled reason (UXC-FRM-3), null when Send is enabled.
  String? get _disabledReason {
    if (_selected == null) return 'Choose a template';
    if (!_recipientValid) return 'Enter a valid email address';
    return null;
  }

  Map<String, String> get _vars => {
        ...bookingMergeVars(widget.detail),
        'personal_message': _msgCtrl.text,
      };

  Future<void> _send() async {
    final to = _toCtrl.text.trim();
    setState(() {
      _sending = true;
      _error = null;
    });
    final r = await widget.onSend(SendBookingEmailParams(
      bookingId: widget.detail.id,
      templateId: _selected!.id,
      to: to,
      personalMessage: _msgCtrl.text.trim().isEmpty ? null : _msgCtrl.text.trim(),
    ));
    if (!mounted) return;
    r.fold(
      (f) => setState(() {
        _sending = false;
        _error = f.message; // inline, retryable (UXC-ERR-1)
      }),
      (sentTo) => Navigator.of(context).pop(sentTo),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasSlot = _selected != null && templateHasPersonalMessageSlot(_selected!);
    return AlertDialog(
      title: const Text('Send email to booking lead'),
      content: SizedBox(
        width: 560,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1 — template picker: active booking-aware only, slot marked.
              DropdownButtonFormField<EmailTemplate>(
                initialValue: _selected,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Template', border: OutlineInputBorder()),
                items: [
                  for (final t in _options)
                    DropdownMenuItem(
                      value: t,
                      child: Text(
                        '${t.name} · ${t.useCase}'
                        '${templateHasPersonalMessageSlot(t) ? ' · personal message' : ''}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: _sending ? null : (t) => setState(() => _selected = t),
              ),
              const SizedBox(height: 12),
              // 2 — recipient, prefilled from the lead, editable.
              TextField(
                controller: _toCtrl,
                enabled: !_sending,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  labelText: 'Recipient',
                  border: const OutlineInputBorder(),
                  errorText: _toCtrl.text.isNotEmpty && !_recipientValid
                      ? 'Enter a valid email address'
                      : null,
                ),
              ),
              // 3 — personal message, only when the template has the slot.
              if (hasSlot) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _msgCtrl,
                  enabled: !_sending,
                  maxLines: 4,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Personal message (optional)',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
              // 4 — live preview with the booking's REAL merge data.
              if (_selected != null) ...[
                const SizedBox(height: 14),
                Text('PREVIEW', style: FobText.microLabel),
                const SizedBox(height: 6),
                Text(
                  substituteMergeFieldsText(_selected!.subject, _vars),
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 240,
                  decoration: BoxDecoration(
                    border: Border.all(color: FobColors.hairline),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _selected!.hasHtmlVersion
                      ? EmailPreviewView(srcdoc: _srcdoc())
                      : Padding(
                          padding: const EdgeInsets.all(12),
                          child: SingleChildScrollView(
                            child: Text(
                              substituteMergeFieldsText(_selected!.body, _vars),
                              style: FobText.body,
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Approximate preview — email clients differ.',
                  style: TextStyle(fontSize: 11.5, color: FobColors.textMuted, height: 1.4),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text('Could not send: $_error', style: const TextStyle(fontSize: 12.5, color: FobColors.error)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        // Adjacent disabled reason (UXC-FRM-3).
        if (_disabledReason != null)
          Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Text(_disabledReason!, style: const TextStyle(fontSize: 12, color: FobColors.textMuted)),
          ),
        TextButton(
          onPressed: _sending ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton.icon(
          icon: _sending
              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.send, size: 16),
          label: const Text('Send'),
          onPressed: (_sending || _disabledReason != null) ? null : _send,
        ),
      ],
    );
  }

  String _srcdoc() {
    final html = _selected!.hasHtmlVersion
        ? _selected!.bodyHtml!
        : renderBlocksToHtml(_selected!.bodyBlocks);
    final body = substituteMergeFieldsHtml(html, _vars);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
        '<body style="margin:0;background-color:#f7f5ef;">$body</body></html>';
  }
}
