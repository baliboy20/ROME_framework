import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/fob_primitives.dart';
import '../bloc/bookings_bloc.dart';
import '../widgets/booking_record_view.dart';

String _shortRef(String id) => id.length <= 8 ? id.toUpperCase() : id.substring(0, 8).toUpperCase();

/// A19 — Bookings, route-level Detail (REQ-BO06). Strictly read-only full
/// record for one booking; editing and status transitions live on the A23
/// Edit booking page. CR-004 (CHG-012, UXD-22): the primary browse path now
/// opens this record as a floating card on `/bookings` itself; this route
/// remains for deep links and the A8 "View booking" cross-link, rendering the
/// same extracted [BookingRecordView].
class BookingsDetailPage extends StatelessWidget {
  const BookingsDetailPage({super.key, required this.bookingId});
  final String bookingId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<BookingsBloc>(
      create: (_) => sl<BookingsBloc>()..add(SelectBookingEvent(bookingId)),
      child: _DetailView(bookingId: bookingId),
    );
  }
}

class _DetailView extends StatelessWidget {
  const _DetailView({required this.bookingId});
  final String bookingId;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingsBloc, BookingsState>(
      listenWhen: (prev, curr) => curr.notice != null && curr.notice != prev.notice,
      listener: (context, state) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.notice!))),
      builder: (context, state) {
        final d = state.detail;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('A19 · BOOKINGS & PAYMENTS', style: FobText.microLabel),
            const SizedBox(height: 4),
            Text(d == null ? 'Booking' : 'Booking ${_shortRef(d.id)}', style: FobText.pageTitle),
            const SizedBox(height: 6),
            const Text(
              'Full read-only booking record. Payment shown as provider reference only — '
              'amounts remain on A8. Editing moved to A23.',
              style: TextStyle(fontSize: 13.5, color: FobColors.textMuted, height: 1.5),
            ),
            TextButton.icon(
              onPressed: () => context.go('/bookings'),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to bookings'),
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
            ),
            const SizedBox(height: FobSpace.block),
            _recordColumn(context, state),
          ],
        );
      },
    );
  }

  Widget _recordColumn(BuildContext context, BookingsState state) {
    final d = state.detail;
    if (state.detailLoading || d == null) {
      return FobCard(
        child: SizedBox(
          height: 260,
          child: Center(child: state.detailLoading ? const CircularProgressIndicator() : const Text('Booking not found.', style: FobText.body)),
        ),
      );
    }
    return FobCard(
      child: BookingRecordView(
        detail: d,
        onEdit: () => context.go('/bookings/${d.id}/edit'),
      ),
    );
  }
}
