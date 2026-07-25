import 'package:flutter/material.dart';

import '../api/booking_api.dart';
import '../theme/tokens.dart';
import 'booking_flow_controller.dart';

/// W4 - date/slot selection + party-size stepper. Fetches live availability
/// from the api-worker and re-queries whenever the party size changes
/// (design-system.md §5.2, aria-live="polite" on the capacity label).
class SelectionStep extends StatefulWidget {
  const SelectionStep({required this.controller, super.key});

  final BookingFlowController controller;

  @override
  State<SelectionStep> createState() => _SelectionStepState();
}

class _SelectionStepState extends State<SelectionStep> {
  String? _selectedDeparture;
  int? _selectedPricePence;
  int _party = 1;

  List<Map<String, dynamic>> _slots = [];
  bool _loadingSlots = false;
  String? _slotsError;

  static const int _partyCap = 10;

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() {
      _loadingSlots = true;
      _slotsError = null;
    });
    try {
      final slots =
          await widget.controller.api.fetchAvailability(widget.controller.tourId, _party);
      if (!mounted) return;
      setState(() {
        _slots = slots;
        // Clear a selection that is no longer offered at this party size.
        if (!_slots.any((s) => s['departureId'] == _selectedDeparture)) {
          _selectedDeparture = null;
          _selectedPricePence = null;
        }
      });
    } on BookingApiException catch (e) {
      if (!mounted) return;
      setState(() => _slotsError =
          'Could not load availability (${e.statusCode}). Please try again.');
    } catch (_) {
      if (!mounted) return;
      setState(() => _slotsError = 'Could not load availability. Please try again.');
    } finally {
      if (mounted) setState(() => _loadingSlots = false);
    }
  }

  String _labelFor(Map<String, dynamic> slot) {
    final date = slot['date']?.toString() ?? '';
    final time = slot['time']?.toString() ?? '';
    return '$date $time'.trim();
  }

  String _priceLabel(int? pence) {
    if (pence == null) return '';
    return '£${(pence / 100).toStringAsFixed(2)}';
  }

  void _changeParty(int next) {
    setState(() => _party = next);
    _loadAvailability();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Select a date', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: ForestTokens.space4),
        Semantics(
          liveRegion: true,
          child: Builder(builder: (context) {
            if (_loadingSlots) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: ForestTokens.space2),
                child: SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              );
            }
            if (_slotsError != null) {
              return Text(
                _slotsError!,
                style: const TextStyle(color: ForestTokens.error),
              );
            }
            if (_slots.isEmpty) {
              return const Text('No departures available for this party size.');
            }
            return Wrap(
              spacing: ForestTokens.space2,
              runSpacing: ForestTokens.space2,
              children: [
                for (final slot in _slots)
                  ChoiceChip(
                    label: Text(
                      '${_labelFor(slot)}  ·  '
                      '${_priceLabel((slot['pricePerPersonPence'] as num?)?.toInt())} pp'
                      '  ·  ${slot['remainingCapacity']} left',
                    ),
                    selected: _selectedDeparture == slot['departureId'],
                    onSelected: (_) => setState(() {
                      _selectedDeparture = slot['departureId'] as String?;
                      _selectedPricePence =
                          (slot['pricePerPersonPence'] as num?)?.toInt();
                    }),
                  ),
              ],
            );
          }),
        ),
        const SizedBox(height: ForestTokens.space6),
        Text('Party size', style: Theme.of(context).textTheme.titleLarge),
        Row(
          children: [
            IconButton(
              onPressed: _party > 1 ? () => _changeParty(_party - 1) : null,
              icon: const Icon(Icons.remove),
            ),
            Text('$_party', style: Theme.of(context).textTheme.bodyLarge),
            IconButton(
              onPressed:
                  _party < _partyCap ? () => _changeParty(_party + 1) : null,
              icon: const Icon(Icons.add),
            ),
          ],
        ),
        if (_party >= _partyCap)
          const Text(
            'Maximum party size is 10.',
            style: TextStyle(color: ForestTokens.error),
          ),
        const SizedBox(height: ForestTokens.space6),
        ElevatedButton(
          onPressed: _selectedDeparture == null ||
                  _selectedPricePence == null ||
                  widget.controller.loading
              ? null
              : () {
                  widget.controller.selectDeparture(
                    _selectedDeparture!,
                    _party,
                    _selectedPricePence!,
                  );
                  widget.controller.confirmSelection();
                },
          child: widget.controller.loading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Continue'),
        ),
      ],
    );
  }
}

/// W6 - attendee details (per-person name + age band) + emergency contact and
/// customer email. First attendee is the lead booker.
class AttendeesStep extends StatefulWidget {
  const AttendeesStep({required this.controller, super.key});

  final BookingFlowController controller;

  @override
  State<AttendeesStep> createState() => _AttendeesStepState();
}

const List<String> _ageBands = ['under-12', '12-17', '18+', '60+'];

class _AttendeesStepState extends State<AttendeesStep> {
  final _formKey = GlobalKey<FormState>();

  late final List<TextEditingController> _nameCtrls;
  late final List<String> _ageBandValues;
  // DR-B12a: index 0 is always `leader`; the rest default to `attendee` and
  // can be marked `co-leader` (an additional point of contact).
  late final List<bool> _coLeaderValues;

  final _emailCtrl = TextEditingController();
  final _emergencyNameCtrl = TextEditingController();
  final _emergencyPhoneCtrl = TextEditingController();
  final _emergencyRelCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final n = widget.controller.partySize;
    _nameCtrls = List.generate(n, (_) => TextEditingController());
    _ageBandValues = List.generate(n, (_) => '18+');
    _coLeaderValues = List.generate(n, (_) => false);
  }

  @override
  void dispose() {
    for (final c in _nameCtrls) {
      c.dispose();
    }
    _emailCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    _emergencyRelCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Attendee details',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: ForestTokens.space4),
            for (var i = 0; i < _nameCtrls.length; i++) ...[
              Text(
                i == 0 ? 'Leader (main contact)' : 'Attendee ${i + 1}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: ForestTokens.space2),
              TextFormField(
                controller: _nameCtrls[i],
                decoration: const InputDecoration(labelText: 'Full name'),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: ForestTokens.space2),
              DropdownButtonFormField<String>(
                initialValue: _ageBandValues[i],
                decoration: const InputDecoration(labelText: 'Age band'),
                items: [
                  for (final band in _ageBands)
                    DropdownMenuItem(value: band, child: Text(band)),
                ],
                onChanged: (v) =>
                    setState(() => _ageBandValues[i] = v ?? '18+'),
              ),
              if (i > 0)
                CheckboxListTile(
                  value: _coLeaderValues[i],
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('Also a point of contact (co-leader)'),
                  onChanged: (v) =>
                      setState(() => _coLeaderValues[i] = v ?? false),
                ),
              const SizedBox(height: ForestTokens.space4),
            ],
            const Divider(),
            const SizedBox(height: ForestTokens.space2),
            Text('Contact', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _emailCtrl,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) =>
                  (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
            ),
            const SizedBox(height: ForestTokens.space4),
            Text('Emergency contact',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _emergencyNameCtrl,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _emergencyPhoneCtrl,
              decoration: const InputDecoration(labelText: 'Phone'),
              keyboardType: TextInputType.phone,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: ForestTokens.space2),
            TextFormField(
              controller: _emergencyRelCtrl,
              decoration: const InputDecoration(labelText: 'Relationship'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: ForestTokens.space6),
            ElevatedButton(
              onPressed: widget.controller.loading
                  ? null
                  : () {
                      if (_formKey.currentState!.validate()) {
                        final participants = <Map<String, dynamic>>[
                          for (var i = 0; i < _nameCtrls.length; i++)
                            {
                              'name': _nameCtrls[i].text.trim(),
                              'age_band': _ageBandValues[i],
                              'contact_role': i == 0
                                  ? 'leader'
                                  : (_coLeaderValues[i] ? 'co-leader' : 'attendee'),
                              'notes': null,
                            },
                        ];
                        widget.controller.submitAttendees(
                          participants,
                          emergencyName: _emergencyNameCtrl.text.trim(),
                          emergencyPhone: _emergencyPhoneCtrl.text.trim(),
                          emergencyRelationship: _emergencyRelCtrl.text.trim(),
                          email: _emailCtrl.text.trim(),
                        );
                      }
                    },
              child: const Text('Continue'),
            ),
          ],
        ),
      ),
    );
  }
}

/// W7 - waiver + terms consent. Hard invariant: both checkboxes render
/// unticked by default (design-system.md §5.2) — enforced by reading straight
/// from BookingFlowController's fields, never pre-set to true.
class ConsentStep extends StatelessWidget {
  const ConsentStep({required this.controller, super.key});

  final BookingFlowController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Waiver & consent',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ForestTokens.space4),
          CheckboxListTile(
            value: controller.waiverAccepted,
            onChanged: (v) => controller.setWaiverAccepted(v ?? false),
            title: const Text(
              'I have read and accept the waiver.',
            ),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          CheckboxListTile(
            value: controller.termsAccepted,
            onChanged: (v) => controller.setTermsAccepted(v ?? false),
            title: const Text(
              'I accept the terms & conditions.',
            ),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          if (controller.errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(top: ForestTokens.space2),
              child: Text(
                controller.errorMessage!,
                style: const TextStyle(color: ForestTokens.error),
              ),
            ),
          const SizedBox(height: ForestTokens.space6),
          ElevatedButton(
            onPressed: controller.loading ? null : controller.submitConsent,
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }
}

/// W7/W8 review summary before payment.
class ReviewStep extends StatelessWidget {
  const ReviewStep({required this.controller, super.key});

  final BookingFlowController controller;

  @override
  Widget build(BuildContext context) {
    final pricePence = controller.pricePerPersonPence;
    final totalPence =
        pricePence == null ? null : pricePence * controller.partySize;
    // DR-B11: a provisional booking (REQ-BOOK10) never takes payment at
    // creation (DR-B2) — finish directly rather than routing to Stripe.
    final isProvisional = controller.bookingSource == 'provisional';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Review your booking',
            style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: ForestTokens.space4),
        Text('Departure: ${controller.departureId}'),
        Text('Party size: ${controller.partySize}'),
        if (totalPence != null)
          Text('Total: £${(totalPence / 100).toStringAsFixed(2)}'),
        if (isProvisional)
          const Padding(
            padding: EdgeInsets.only(top: ForestTokens.space2),
            child: Text('No payment is due now — this booking is provisional.'),
          ),
        const SizedBox(height: ForestTokens.space6),
        ElevatedButton(
          onPressed:
              isProvisional ? controller.markConfirmed : controller.proceedToPayment,
          child: Text(isProvisional ? 'Finish — no payment needed' : 'Continue to payment'),
        ),
      ],
    );
  }
}

/// W9 confirmation. Offers a "Manage your booking" button that switches the
/// in-app view straight into the hub (reusing the controller's bookingId +
/// authToken) — see [BookingFlow].
class ConfirmationStep extends StatelessWidget {
  const ConfirmationStep({
    required this.controller,
    this.onManageBooking,
    super.key,
  });

  final BookingFlowController controller;
  final VoidCallback? onManageBooking;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.check_circle, color: ForestTokens.success, size: 40),
        const SizedBox(height: ForestTokens.space4),
        Text('Booking confirmed', style: Theme.of(context).textTheme.titleLarge),
        Text('Booking ID: ${controller.bookingId ?? '-'}'),
        if (onManageBooking != null && controller.bookingId != null) ...[
          const SizedBox(height: ForestTokens.space6),
          ElevatedButton(
            onPressed: onManageBooking,
            child: const Text('Manage your booking'),
          ),
        ],
      ],
    );
  }
}
