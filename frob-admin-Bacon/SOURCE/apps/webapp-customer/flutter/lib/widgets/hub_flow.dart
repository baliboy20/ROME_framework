import 'package:flutter/material.dart';

import '../api/booking_api.dart';
import '../api/hub_api.dart';
import '../theme/tokens.dart';

/// Customer "Manage your booking" hub. Loads the booker view of a booking from
/// `GET /tour-hub/:bookingId?viewer=booker` and renders self-service sections:
/// summary, participants, change notices (ack + remediation), emergency /
/// safety details (TOUR04), running-late (TOUR09), feedback (POST03), and —
/// when a customer session [token] is present — change-date (BOOK06),
/// cancel (BOOK07) and sign-out (AUTH05).
///
/// Reached two ways: in-app from the booking flow's confirmation screen
/// (reusing the controller's bookingId + authToken) and standalone via
/// `?mode=hub&booking=<id>&token=<token>` on the page URL (see main.dart).
class HubFlow extends StatefulWidget {
  const HubFlow({
    required this.apiBaseUrl,
    required this.bookingId,
    this.token,
    this.onExit,
    super.key,
  });

  final String apiBaseUrl;
  final String bookingId;

  /// Customer session Bearer token. Present in-app (from the booking
  /// controller) and, standalone, when the confirmation-email link carries
  /// `&token=`. Required for change-date / cancel / sign-out.
  final String? token;

  /// Optional "back to booking" affordance when embedded in the booking flow.
  final VoidCallback? onExit;

  @override
  State<HubFlow> createState() => _HubFlowState();
}

class _HubFlowState extends State<HubFlow> {
  late final HubApi _api;

  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _hub;
  bool _signedOut = false;

  @override
  void initState() {
    super.initState();
    _api = HubApi(baseUrl: widget.apiBaseUrl);
    _load();
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  bool get _hasToken => (widget.token ?? '').isNotEmpty;

  Map<String, dynamic> get _booking =>
      (_hub?['booking'] as Map?)?.cast<String, dynamic>() ?? const {};
  Map<String, dynamic> get _departure =>
      (_hub?['departure'] as Map?)?.cast<String, dynamic>() ?? const {};
  List<Map<String, dynamic>> get _participants =>
      ((_hub?['participants'] as List?) ?? const [])
          .cast<Map>()
          .map((e) => e.cast<String, dynamic>())
          .toList();
  List<Map<String, dynamic>> get _notices =>
      ((_hub?['notices'] as List?) ?? const [])
          .cast<Map>()
          .map((e) => e.cast<String, dynamic>())
          .toList();

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final hub = await _api.getHub(widget.bookingId);
      if (!mounted) return;
      setState(() => _hub = hub);
    } on BookingApiException catch (e) {
      if (!mounted) return;
      setState(() =>
          _error = 'Could not load your booking (${e.statusCode}). Please try again.');
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not load your booking. Please try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _snack(String message, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? ForestTokens.error : ForestTokens.forest700,
      ),
    );
  }

  /// Runs a mutation, showing a success/error SnackBar and refreshing the hub.
  Future<void> _mutate(
    Future<void> Function() action, {
    required String success,
  }) async {
    try {
      await action();
      _snack(success);
      await _load();
    } on BookingApiException catch (e) {
      _snack('Something went wrong (${e.statusCode}). Please try again.',
          error: true);
    } catch (_) {
      _snack('Something went wrong. Please try again.', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_signedOut) return _SignedOutView(onExit: widget.onExit);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
              ForestTokens.space4, ForestTokens.space4, ForestTokens.space4, 0),
          child: Row(
            children: [
              if (widget.onExit != null)
                IconButton(
                  onPressed: widget.onExit,
                  icon: const Icon(Icons.arrow_back),
                  tooltip: 'Back',
                ),
              Expanded(
                child: Text('Manage your booking',
                    style: Theme.of(context).textTheme.headlineMedium),
              ),
            ],
          ),
        ),
        Expanded(child: _body()),
      ],
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(ForestTokens.space6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: ForestTokens.error)),
              const SizedBox(height: ForestTokens.space4),
              OutlinedButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(ForestTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _summaryCard(),
          const SizedBox(height: ForestTokens.space4),
          _participantsCard(),
          const SizedBox(height: ForestTokens.space4),
          _noticesCard(),
          const SizedBox(height: ForestTokens.space4),
          _DetailsForm(
            initialName: _booking['emergency_contact_name']?.toString() ?? '',
            initialPhone: _booking['emergency_contact_phone']?.toString() ?? '',
            initialRelationship:
                _booking['emergency_contact_relationship']?.toString() ?? '',
            onSubmit: (name, phone, rel, flags) => _mutate(
              () => _api.updateDetails(
                bookingId: widget.bookingId,
                emergencyContactName: name,
                emergencyContactPhone: phone,
                emergencyContactRelationship: rel,
                safetySignificantFlags: flags,
              ),
              success: 'Details updated.',
            ),
          ),
          const SizedBox(height: ForestTokens.space4),
          _LateForm(
            onSubmit: (arrival, context) => _mutate(
              () => _api.reportLate(
                bookingId: widget.bookingId,
                estimatedArrival: arrival,
                context: context,
              ),
              success: "Thanks — we've let the guide know.",
            ),
          ),
          const SizedBox(height: ForestTokens.space4),
          _FeedbackForm(
            completed: _isCompleted,
            onSubmit: (overall, guide, value, recommend, text) => _mutate(
              () => _api.submitFeedback(
                bookingId: widget.bookingId,
                overallRating: overall,
                guideRating: guide,
                valueRating: value,
                wouldRecommend: recommend,
                freeText: text,
              ),
              success: 'Thanks for your feedback!',
            ),
          ),
          const SizedBox(height: ForestTokens.space4),
          _changeDateCard(),
          const SizedBox(height: ForestTokens.space4),
          _cancelCard(),
          const SizedBox(height: ForestTokens.space4),
          _signOutCard(),
          const SizedBox(height: ForestTokens.space8),
        ],
      ),
    );
  }

  bool get _isCompleted {
    final status = _booking['status']?.toString().toLowerCase() ?? '';
    return status == 'completed' || status == 'complete' || status == 'attended';
  }

  String _money(Object? pence) {
    final n = (pence is num) ? pence : num.tryParse('$pence');
    if (n == null) return '—';
    return '£${(n / 100).toStringAsFixed(2)}';
  }

  Widget _summaryCard() {
    return _HubCard(
      title: 'Booking summary',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _kv('Tour', _departure['tour_id']?.toString() ?? '—'),
          _kv('Date', _departure['date']?.toString() ?? '—'),
          _kv('Time', _departure['time']?.toString() ?? '—'),
          _kv('Party size', _booking['party_size']?.toString() ?? '—'),
          _kv('Status', _booking['status']?.toString() ?? '—'),
          _kv('Payment', _hub?['payment_status']?.toString() ?? '—'),
          _kv('Total', _money(_booking['price_total_pence'])),
          const SizedBox(height: ForestTokens.space1),
          Text('Booking ID: ${widget.bookingId}',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _participantsCard() {
    final people = _participants;
    return _HubCard(
      title: 'Who\'s coming',
      child: people.isEmpty
          ? const Text('No participants recorded yet.')
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final p in people)
                  Padding(
                    padding:
                        const EdgeInsets.only(bottom: ForestTokens.space2),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.person_outline,
                            size: 20, color: ForestTokens.inkMuted),
                        const SizedBox(width: ForestTokens.space2),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${p['name'] ?? 'Guest'}'
                                '${_leadBooker(p) ? '  ·  Lead booker' : ''}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600),
                              ),
                              Text(
                                'Age band: ${p['age_band'] ?? '—'}',
                                style:
                                    Theme.of(context).textTheme.bodySmall,
                              ),
                              if ((p['notes']?.toString() ?? '').isNotEmpty)
                                Text('Notes: ${p['notes']}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  bool _leadBooker(Map<String, dynamic> p) {
    final v = p['is_lead_booker'];
    return v == 1 || v == true || v == '1';
  }

  Widget _noticesCard() {
    final notices = _notices;
    return _HubCard(
      title: 'Change notices',
      child: notices.isEmpty
          ? const Text('No changes to your booking. All good!')
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final n in notices) _noticeTile(n),
              ],
            ),
    );
  }

  Widget _noticeTile(Map<String, dynamic> n) {
    final material = n['material'] == 1 || n['material'] == true;
    final acked = n['status']?.toString().toLowerCase() == 'acknowledged' ||
        n['status']?.toString().toLowerCase() == 'acked';
    final chosen = n['remediation_choice']?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: ForestTokens.space3),
      padding: const EdgeInsets.all(ForestTokens.space3),
      decoration: BoxDecoration(
        color: material ? ForestTokens.sand : ForestTokens.forest50,
        borderRadius: BorderRadius.circular(ForestTokens.radiusMd),
        border: Border.all(
          color: material ? ForestTokens.warning : ForestTokens.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(material ? Icons.warning_amber : Icons.info_outline,
                  size: 20,
                  color: material ? ForestTokens.warning : ForestTokens.info),
              const SizedBox(width: ForestTokens.space2),
              Expanded(
                child: Text(
                  '${n['type'] ?? 'Change'}${material ? ' (material change)' : ''}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: ForestTokens.space1),
          Text('${n['old_value'] ?? '—'}  →  ${n['new_value'] ?? '—'}'),
          const SizedBox(height: ForestTokens.space2),
          Row(
            children: [
              if (acked)
                const Row(children: [
                  Icon(Icons.check, size: 16, color: ForestTokens.success),
                  SizedBox(width: 4),
                  Text('Acknowledged'),
                ])
              else
                OutlinedButton(
                  onPressed: () => _mutate(
                    () => _api.ackNotice(n['id'].toString()),
                    success: 'Notice acknowledged.',
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize:
                        const Size(0, ForestTokens.minTouchTarget),
                  ),
                  child: const Text('Acknowledge'),
                ),
            ],
          ),
          if (material) ...[
            const SizedBox(height: ForestTokens.space2),
            if ((chosen ?? '').isNotEmpty)
              Text('Your choice: $chosen',
                  style: const TextStyle(fontWeight: FontWeight.w600))
            else ...[
              const Text('How would you like to resolve this?'),
              const SizedBox(height: ForestTokens.space2),
              Wrap(
                spacing: ForestTokens.space2,
                runSpacing: ForestTokens.space2,
                children: [
                  for (final choice in const ['refund', 'rebook', 'credit'])
                    OutlinedButton(
                      onPressed: () => _mutate(
                        () => _api.chooseRemediation(
                          noticeId: n['id'].toString(),
                          choice: choice,
                        ),
                        success: 'Choice recorded: $choice.',
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize:
                            const Size(0, ForestTokens.minTouchTarget),
                      ),
                      child: Text(choice[0].toUpperCase() + choice.substring(1)),
                    ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _changeDateCard() {
    if (!_hasToken) {
      return const _HubCard(
        title: 'Change date',
        child: _TokenRequiredNote(
          action: 'change your departure date',
        ),
      );
    }
    return _HubCard(
      title: 'Change date',
      child: _ChangeDateSection(
        api: _api,
        tourId: _departure['tour_id']?.toString() ?? '',
        partySize: (_booking['party_size'] as num?)?.toInt() ?? 1,
        currentDepartureId: _departure['id']?.toString(),
        onPick: (departureId, pricePence) => _mutate(
          () => _api.changeDate(
            bookingId: widget.bookingId,
            token: widget.token!,
            newDepartureId: departureId,
            newPricePerPersonPence: pricePence,
          ),
          success: 'Your booking has been moved.',
        ),
      ),
    );
  }

  Widget _cancelCard() {
    if (!_hasToken) {
      return const _HubCard(
        title: 'Cancel booking',
        child: _TokenRequiredNote(action: 'cancel this booking'),
      );
    }
    return _HubCard(
      title: 'Cancel booking',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
              'Cancelling may be subject to our cancellation policy depending on '
              'how close to departure you are.'),
          const SizedBox(height: ForestTokens.space3),
          OutlinedButton(
            onPressed: _confirmCancel,
            style: OutlinedButton.styleFrom(
              foregroundColor: ForestTokens.error,
              side: const BorderSide(color: ForestTokens.error, width: 1.5),
            ),
            child: const Text('Cancel my booking'),
          ),
        ],
      ),
    );
  }

  double _hoursBeforeDeparture() {
    final date = _departure['date']?.toString() ?? '';
    final time = _departure['time']?.toString() ?? '';
    // Build an ISO-ish string; departure.time may be "HH:mm" or "HH:mm:ss".
    final normalizedTime = time.length == 5 ? '$time:00' : time;
    final dt = DateTime.tryParse('${date}T$normalizedTime');
    if (dt == null) return 0;
    return dt.difference(DateTime.now()).inMinutes / 60.0;
  }

  Future<void> _confirmCancel() async {
    final hours = _hoursBeforeDeparture();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel this booking?'),
        content: Text(
          'This will cancel your booking${hours > 0 ? ' (${hours.toStringAsFixed(0)} hours before departure)' : ''}. '
          'This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep booking'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: ForestTokens.error),
            child: const Text('Yes, cancel'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await _mutate(
      () => _api.cancelBooking(
        bookingId: widget.bookingId,
        token: widget.token!,
        hoursBeforeDeparture: hours,
      ),
      success: 'Your booking has been cancelled.',
    );
  }

  Widget _signOutCard() {
    if (!_hasToken) return const SizedBox.shrink();
    return _HubCard(
      title: 'Session',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          OutlinedButton.icon(
            onPressed: _signOut,
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
          ),
        ],
      ),
    );
  }

  Future<void> _signOut() async {
    try {
      await _api.logout(widget.token!);
      _snack('Signed out.');
      if (mounted) setState(() => _signedOut = true);
    } on BookingApiException catch (e) {
      _snack('Could not sign out (${e.statusCode}).', error: true);
    } catch (_) {
      _snack('Could not sign out.', error: true);
    }
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 110,
              child: Text(k,
                  style: const TextStyle(color: ForestTokens.inkMuted)),
            ),
            Expanded(
              child: Text(v,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      );
}

/// Card shell matching the Forest surface style.
class _HubCard extends StatelessWidget {
  const _HubCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(ForestTokens.space4),
      decoration: BoxDecoration(
        color: ForestTokens.paper,
        borderRadius: BorderRadius.circular(ForestTokens.radiusLg),
        border: Border.all(color: ForestTokens.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ForestTokens.space3),
          child,
        ],
      ),
    );
  }
}

class _TokenRequiredNote extends StatelessWidget {
  const _TokenRequiredNote({required this.action});

  final String action;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.link, size: 20, color: ForestTokens.info),
        const SizedBox(width: ForestTokens.space2),
        Expanded(
          child: Text(
            'To $action, please use the secure "Manage your booking" link in '
            'your confirmation email.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

/// TOUR04 — emergency contact + safety-significant flags form.
class _DetailsForm extends StatefulWidget {
  const _DetailsForm({
    required this.initialName,
    required this.initialPhone,
    required this.initialRelationship,
    required this.onSubmit,
  });

  final String initialName;
  final String initialPhone;
  final String initialRelationship;
  final Future<void> Function(
    String name,
    String phone,
    String relationship,
    List<String> flags,
  ) onSubmit;

  @override
  State<_DetailsForm> createState() => _DetailsFormState();
}

const List<String> _safetyFlagOptions = [
  'Mobility',
  'Medical condition',
  'Allergy',
  'Dietary requirement',
  'Other',
];

class _DetailsFormState extends State<_DetailsForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _rel;
  final Set<String> _flags = {};
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.initialName);
    _phone = TextEditingController(text: widget.initialPhone);
    _rel = TextEditingController(text: widget.initialRelationship);
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _rel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _HubCard(
      title: 'Emergency contact & safety details',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Contact name'),
            ),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Contact phone'),
            ),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _rel,
              decoration: const InputDecoration(labelText: 'Relationship'),
            ),
            const SizedBox(height: ForestTokens.space3),
            Text('Anything we should know for your safety?',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: ForestTokens.space1),
            Wrap(
              spacing: ForestTokens.space2,
              children: [
                for (final flag in _safetyFlagOptions)
                  FilterChip(
                    label: Text(flag),
                    selected: _flags.contains(flag),
                    onSelected: (sel) => setState(() {
                      if (sel) {
                        _flags.add(flag);
                      } else {
                        _flags.remove(flag);
                      }
                    }),
                  ),
              ],
            ),
            const SizedBox(height: ForestTokens.space4),
            ElevatedButton(
              onPressed: _submitting
                  ? null
                  : () async {
                      setState(() => _submitting = true);
                      await widget.onSubmit(
                        _name.text.trim(),
                        _phone.text.trim(),
                        _rel.text.trim(),
                        _flags.toList(),
                      );
                      if (mounted) setState(() => _submitting = false);
                    },
              child: _submitting
                  ? const _BtnSpinner()
                  : const Text('Save details'),
            ),
          ],
        ),
      ),
    );
  }
}

/// TOUR09 — "I'll be late" form.
class _LateForm extends StatefulWidget {
  const _LateForm({required this.onSubmit});

  final Future<void> Function(String estimatedArrival, String? context)
      onSubmit;

  @override
  State<_LateForm> createState() => _LateFormState();
}

class _LateFormState extends State<_LateForm> {
  final _formKey = GlobalKey<FormState>();
  final _arrival = TextEditingController();
  final _context = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _arrival.dispose();
    _context.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _HubCard(
      title: "Let us know you'll be late",
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _arrival,
              decoration: const InputDecoration(
                labelText: 'Estimated arrival (e.g. 14:30)',
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _context,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Anything else? (optional)',
              ),
            ),
            const SizedBox(height: ForestTokens.space4),
            ElevatedButton(
              onPressed: _submitting
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      setState(() => _submitting = true);
                      final ctx = _context.text.trim();
                      await widget.onSubmit(
                        _arrival.text.trim(),
                        ctx.isEmpty ? null : ctx,
                      );
                      if (mounted) setState(() => _submitting = false);
                    },
              child:
                  _submitting ? const _BtnSpinner() : const Text('Notify us'),
            ),
          ],
        ),
      ),
    );
  }
}

/// POST03 — post-tour feedback.
class _FeedbackForm extends StatefulWidget {
  const _FeedbackForm({required this.completed, required this.onSubmit});

  final bool completed;
  final Future<void> Function(
    int overall,
    int guide,
    int value,
    String wouldRecommend,
    String? freeText,
  ) onSubmit;

  @override
  State<_FeedbackForm> createState() => _FeedbackFormState();
}

class _FeedbackFormState extends State<_FeedbackForm> {
  int _overall = 0;
  int _guide = 0;
  int _value = 0;
  String _recommend = 'yes';
  final _text = TextEditingController();
  bool _submitting = false;
  String? _validation;

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _HubCard(
      title: 'Leave feedback',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!widget.completed)
            Padding(
              padding: const EdgeInsets.only(bottom: ForestTokens.space2),
              child: Text(
                'You can leave feedback here once your tour is complete — '
                'we\'ll still record early notes.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          _RatingRow(
            label: 'Overall',
            value: _overall,
            onChanged: (v) => setState(() => _overall = v),
          ),
          _RatingRow(
            label: 'Guide',
            value: _guide,
            onChanged: (v) => setState(() => _guide = v),
          ),
          _RatingRow(
            label: 'Value',
            value: _value,
            onChanged: (v) => setState(() => _value = v),
          ),
          const SizedBox(height: ForestTokens.space2),
          Text('Would you recommend us?',
              style: Theme.of(context).textTheme.bodySmall),
          Wrap(
            spacing: ForestTokens.space2,
            children: [
              for (final r in const ['yes', 'maybe', 'no'])
                ChoiceChip(
                  label: Text(r[0].toUpperCase() + r.substring(1)),
                  selected: _recommend == r,
                  onSelected: (_) => setState(() => _recommend = r),
                ),
            ],
          ),
          const SizedBox(height: ForestTokens.space2),
          TextField(
            controller: _text,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Tell us more (optional)',
            ),
          ),
          if (_validation != null)
            Padding(
              padding: const EdgeInsets.only(top: ForestTokens.space2),
              child: Text(_validation!,
                  style: const TextStyle(color: ForestTokens.error)),
            ),
          const SizedBox(height: ForestTokens.space4),
          ElevatedButton(
            onPressed: _submitting
                ? null
                : () async {
                    if (_overall < 1 || _guide < 1 || _value < 1) {
                      setState(() => _validation =
                          'Please give a 1-5 rating for all three.');
                      return;
                    }
                    setState(() {
                      _validation = null;
                      _submitting = true;
                    });
                    final t = _text.text.trim();
                    await widget.onSubmit(
                      _overall,
                      _guide,
                      _value,
                      _recommend,
                      t.isEmpty ? null : t,
                    );
                    if (mounted) setState(() => _submitting = false);
                  },
            child: _submitting
                ? const _BtnSpinner()
                : const Text('Submit feedback'),
          ),
        ],
      ),
    );
  }
}

class _RatingRow extends StatelessWidget {
  const _RatingRow({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 70, child: Text(label)),
        for (var i = 1; i <= 5; i++)
          IconButton(
            visualDensity: VisualDensity.compact,
            onPressed: () => onChanged(i),
            icon: Icon(
              i <= value ? Icons.star : Icons.star_border,
              color: i <= value ? ForestTokens.warning : ForestTokens.inkMuted,
            ),
            tooltip: '$i',
          ),
      ],
    );
  }
}

/// BOOK06 — change-date slot picker (token present).
class _ChangeDateSection extends StatefulWidget {
  const _ChangeDateSection({
    required this.api,
    required this.tourId,
    required this.partySize,
    required this.currentDepartureId,
    required this.onPick,
  });

  final HubApi api;
  final String tourId;
  final int partySize;
  final String? currentDepartureId;
  final Future<void> Function(String departureId, int pricePence) onPick;

  @override
  State<_ChangeDateSection> createState() => _ChangeDateSectionState();
}

class _ChangeDateSectionState extends State<_ChangeDateSection> {
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _slots = [];
  bool _loaded = false;

  Future<void> _loadSlots() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final slots =
          await widget.api.fetchAvailability(widget.tourId, widget.partySize);
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _loaded = true;
      });
    } on BookingApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Could not load slots (${e.statusCode}).');
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Could not load slots.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _price(int? pence) =>
      pence == null ? '' : '£${(pence / 100).toStringAsFixed(2)}';

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Move your booking to a different departure.'),
          const SizedBox(height: ForestTokens.space3),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: ForestTokens.space2),
              child: Text(_error!,
                  style: const TextStyle(color: ForestTokens.error)),
            ),
          OutlinedButton(
            onPressed: _loading ? null : _loadSlots,
            child: _loading
                ? const _BtnSpinner(dark: true)
                : const Text('Show available dates'),
          ),
        ],
      );
    }
    final options = _slots
        .where((s) => s['departureId'] != widget.currentDepartureId)
        .toList();
    if (options.isEmpty) {
      return const Text('No other departures are currently available.');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final s in options)
          Padding(
            padding: const EdgeInsets.only(bottom: ForestTokens.space2),
            child: OutlinedButton(
              onPressed: () {
                final id = s['departureId'] as String?;
                final price = (s['pricePerPersonPence'] as num?)?.toInt();
                if (id != null && price != null) {
                  widget.onPick(id, price);
                }
              },
              child: Text(
                '${s['date']} ${s['time']}  ·  '
                '${_price((s['pricePerPersonPence'] as num?)?.toInt())} pp  ·  '
                '${s['remainingCapacity']} left',
              ),
            ),
          ),
      ],
    );
  }
}

class _SignedOutView extends StatelessWidget {
  const _SignedOutView({this.onExit});

  final VoidCallback? onExit;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ForestTokens.space6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle,
                color: ForestTokens.success, size: 40),
            const SizedBox(height: ForestTokens.space4),
            Text('You\'re signed out',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: ForestTokens.space2),
            const Text(
              'Your session has ended. You can reopen this hub from the link '
              'in your confirmation email.',
              textAlign: TextAlign.center,
            ),
            if (onExit != null) ...[
              const SizedBox(height: ForestTokens.space4),
              OutlinedButton(onPressed: onExit, child: const Text('Done')),
            ],
          ],
        ),
      ),
    );
  }
}

class _BtnSpinner extends StatelessWidget {
  const _BtnSpinner({this.dark = false});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 20,
      width: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: dark ? ForestTokens.forest700 : Colors.white,
      ),
    );
  }
}
