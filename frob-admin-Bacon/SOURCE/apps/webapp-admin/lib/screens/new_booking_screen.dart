import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../theme/tokens.dart';

/// A7 — New owner booking (REQ-BOOK08 / REQ-BOOK10).
/// Confirmed → createBookingFromEnquiry; Provisional → createProvisionalBooking.
/// DR-B11: the Owner never enters attendee/waiver details themselves — the
/// customer supplies those via a completion link sent to customerEmail.
class NewBookingScreen extends StatefulWidget {
  const NewBookingScreen({super.key});

  @override
  State<NewBookingScreen> createState() => _NewBookingScreenState();
}

class _NewBookingScreenState extends State<NewBookingScreen> {
  ApiClient get _api => context.read<ApiClient>();

  late Future<List<dynamic>> _departuresFuture;
  final _partyController = TextEditingController(text: '1');
  final _priceController = TextEditingController();
  final _emailController = TextEditingController();

  String? _departureId;
  bool _confirmed = true; // true = Confirmed, false = Provisional
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _departuresFuture = _api.getDepartures();
  }

  @override
  void dispose() {
    _partyController.dispose();
    _priceController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  String _departureLabel(Map<String, dynamic> j) {
    final tour = j['tour_id']?.toString() ?? 'Tour';
    final date = j['date']?.toString() ?? '';
    final time = j['time']?.toString() ?? '';
    return '$tour — $date $time'.trim();
  }

  Future<void> _submit() async {
    final messenger = ScaffoldMessenger.of(context);
    final depId = _departureId;
    if (depId == null) {
      messenger.showSnackBar(const SnackBar(content: Text('Select a departure.')));
      return;
    }
    final partySize = int.tryParse(_partyController.text.trim()) ?? 0;
    if (partySize <= 0) {
      messenger.showSnackBar(const SnackBar(content: Text('Enter a valid party size.')));
      return;
    }
    final pounds = double.tryParse(_priceController.text.trim());
    if (pounds == null || pounds < 0) {
      messenger.showSnackBar(const SnackBar(content: Text('Enter a valid total price.')));
      return;
    }
    final email = _emailController.text.trim();
    final emailValid = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
    if (!emailValid) {
      messenger.showSnackBar(const SnackBar(
        content: Text('Enter the customer\'s email — they complete attendee details and consent via a link sent there.'),
      ));
      return;
    }
    final pence = (pounds * 100).round();

    setState(() => _submitting = true);
    try {
      Map<String, dynamic> result;
      if (_confirmed) {
        result = await _api.createBookingFromEnquiry({
          'departureId': depId,
          'partySize': partySize,
          'agreedTotalPricePence': pence,
          'customerEmail': email,
        });
      } else {
        final perPerson = (pence / partySize).round();
        final holdExpiresAt =
            DateTime.now().add(const Duration(days: 3)).toUtc().toIso8601String();
        result = await _api.createProvisionalBooking({
          'departureId': depId,
          'partySize': partySize,
          'pricePerPersonPence': perPerson,
          'holdExpiresAt': holdExpiresAt,
          'customerEmail': email,
        });
      }
      final id = result['id']?.toString();
      final linkSent = result['completionLinkSent'] == true;
      final idPart = id != null && id.isNotEmpty ? ' ($id)' : '';
      messenger.showSnackBar(SnackBar(
        content: Text(linkSent
            ? 'Booking created$idPart. Completion link sent to $email.'
            : 'Booking created$idPart. Could not send the completion link — resend from the booking record.'),
      ));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Could not create booking: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('New booking', style: FobText.pageTitle),
        const SizedBox(height: FobSpace.card),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(FobSpace.card),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('DEPARTURE', style: FobText.microLabel),
                const SizedBox(height: FobSpace.row),
                FutureBuilder<List<dynamic>>(
                  future: _departuresFuture,
                  builder: (context, snap) {
                    final loading = snap.connectionState == ConnectionState.waiting;
                    final items = (snap.data ?? const [])
                        .map((j) => j as Map<String, dynamic>)
                        .toList();
                    return DropdownButtonFormField<String>(
                      initialValue: _departureId,
                      isExpanded: true,
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        hintText: loading ? 'Loading departures…' : 'Select a departure',
                      ),
                      items: items
                          .map((j) => DropdownMenuItem<String>(
                                value: j['id']?.toString(),
                                child: Text(_departureLabel(j), style: FobText.body),
                              ))
                          .toList(),
                      onChanged: loading
                          ? null
                          : (v) => setState(() => _departureId = v),
                    );
                  },
                ),
                const SizedBox(height: FobSpace.block),
                const Text('PARTY SIZE', style: FobText.microLabel),
                const SizedBox(height: FobSpace.row),
                TextField(
                  controller: _partyController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Number of riders',
                  ),
                ),
                const SizedBox(height: FobSpace.block),
                const Text('AGREED TOTAL PRICE (£)', style: FobText.microLabel),
                const SizedBox(height: FobSpace.row),
                TextField(
                  controller: _priceController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    prefixText: '£ ',
                    hintText: '0.00',
                  ),
                ),
                const SizedBox(height: FobSpace.block),
                const Text('CUSTOMER EMAIL', style: FobText.microLabel),
                const SizedBox(height: FobSpace.row),
                TextField(
                  key: const Key('new-booking-customer-email'),
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'customer@example.com',
                    helperText: 'A link is sent here for the customer to add attendees and accept the waiver/terms themselves.',
                  ),
                ),
                const SizedBox(height: FobSpace.block),
                const Text('BOOKING TYPE', style: FobText.microLabel),
                const SizedBox(height: FobSpace.row),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: true, label: Text('Confirmed')),
                    ButtonSegment(value: false, label: Text('Provisional')),
                  ],
                  selected: {_confirmed},
                  onSelectionChanged: (s) => setState(() => _confirmed = s.first),
                ),
                const SizedBox(height: FobSpace.block),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton(
                    onPressed: _submitting ? null : _submit,
                    child: Text(_submitting ? 'Creating…' : 'Create booking'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
