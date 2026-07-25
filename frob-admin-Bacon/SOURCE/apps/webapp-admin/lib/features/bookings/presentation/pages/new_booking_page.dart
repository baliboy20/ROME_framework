import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../bloc/new_booking_bloc.dart';

/// A7 — New owner booking (REQ-BOOK08 / REQ-BOOK10).
class NewBookingPage extends StatelessWidget {
  const NewBookingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<NewBookingBloc>(
      create: (_) => sl<NewBookingBloc>()..add(const LoadNewBookingEvent()),
      child: const _NewBookingView(),
    );
  }
}

class _NewBookingView extends StatefulWidget {
  const _NewBookingView();
  @override
  State<_NewBookingView> createState() => _NewBookingViewState();
}

class _NewBookingViewState extends State<_NewBookingView> {
  final _partyController = TextEditingController(text: '1');
  final _priceController = TextEditingController();
  final _emailController = TextEditingController();
  String? _departureId;
  bool _confirmed = true;

  @override
  void dispose() {
    _partyController.dispose();
    _priceController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _submit(BuildContext context) {
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
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      messenger.showSnackBar(const SnackBar(
        content: Text("Enter the customer's email — they complete attendee details and consent via a link sent there."),
      ));
      return;
    }
    context.read<NewBookingBloc>().add(SubmitBookingEvent(
          departureId: depId,
          partySize: partySize,
          pricePence: (pounds * 100).round(),
          email: email,
          confirmed: _confirmed,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<NewBookingBloc, NewBookingState>(
      listenWhen: (prev, curr) => curr.notice != null && curr.notice != prev.notice,
      listener: (context, state) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!)));
        context.read<NewBookingBloc>().add(const ClearNewBookingNoticeEvent());
      },
      builder: (context, state) {
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
                    DropdownButtonFormField<String>(
                      initialValue: _departureId,
                      isExpanded: true,
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        hintText: state.departures.isEmpty ? 'Loading departures…' : 'Select a departure',
                      ),
                      items: state.departures
                          .map((d) => DropdownMenuItem<String>(value: d.id, child: Text(d.label, style: FobText.body)))
                          .toList(),
                      onChanged: (v) => setState(() => _departureId = v),
                    ),
                    const SizedBox(height: FobSpace.block),
                    const Text('PARTY SIZE', style: FobText.microLabel),
                    const SizedBox(height: FobSpace.row),
                    TextField(
                      controller: _partyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Number of riders'),
                    ),
                    const SizedBox(height: FobSpace.block),
                    const Text('AGREED TOTAL PRICE (£)', style: FobText.microLabel),
                    const SizedBox(height: FobSpace.row),
                    TextField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(border: OutlineInputBorder(), prefixText: '£ ', hintText: '0.00'),
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
                        onPressed: state.submitting ? null : () => _submit(context),
                        child: Text(state.submitting ? 'Creating…' : 'Create booking'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
