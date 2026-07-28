// CR-004 (CHG-012, REQ-NOTIF11 / REQ-BO05/BO06, UXD-22): A19 is ONE surface
// in the A5d idiom — six-column sortable table; selecting a row opens the
// read-only record as a floating detail card IN PLACE (no route change, list
// preserved). Supersedes the CHG-005 compact-row assertions.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_created.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_detail.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_summary.dart';
import 'package:fob_webapp_admin/features/bookings/domain/repositories/booking_repository.dart';
import 'package:fob_webapp_admin/features/bookings/domain/usecases/booking_usecases.dart';
import 'package:fob_webapp_admin/features/bookings/domain/usecases/get_booking_detail.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/bloc/bookings_bloc.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/pages/bookings_master_page.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_entities.dart';
import 'package:fob_webapp_admin/features/email/domain/repositories/email_repository.dart';
import 'package:fob_webapp_admin/features/email/domain/usecases/email_usecases.dart';
import 'package:fob_webapp_admin/injection_container.dart';
import 'package:fob_webapp_admin/widgets/status_pill.dart';

class _FakeRepo implements BookingRepository {
  final List<BookingSummary> bookings;
  _FakeRepo(this.bookings);

  @override
  Future<Result<List<BookingSummary>>> getBookings() async => Success(bookings);
  @override
  Future<Result<BookingDetail>> getBookingDetail(String id) async => Success(BookingDetail(
        id: id, status: 'confirmed', partySize: 2, priceTotalPence: 9000,
        attendees: const [], emergencyContact: null, consent: const Consent(),
        statusHistory: const StatusHistory(), paymentAttempts: const [],
      ));
  @override
  Future<Result<void>> transitionBooking(String id, String t) async => const Success(null);
  @override
  Future<Result<List<DepartureSlot>>> getDepartures() async => const Success([]);
  @override
  Future<Result<BookingCreated>> createBooking(Map<String, dynamic> body) async =>
      const Success(BookingCreated(id: 'x', completionLinkSent: true));
  @override
  Future<Result<BookingCreated>> createProvisionalBooking(Map<String, dynamic> body) async =>
      const Success(BookingCreated(id: 'x', completionLinkSent: true));
  @override
  Future<Result<void>> updateBooking(String id, Map<String, dynamic> body) async => const Success(null);
  @override
  Future<Result<String>> sendBookingEmail(String id, Map<String, dynamic> body) async =>
      Success(body['to']?.toString() ?? '');
}

class _FakeEmailRepo implements EmailRepository {
  @override
  Future<Result<List<EmailTemplate>>> getTemplates() async => const Success(<EmailTemplate>[]);
  @override
  dynamic noSuchMethod(Invocation invocation) => throw UnimplementedError();
}

void main() {
  const bookingA = BookingSummary(
    id: 'bk-1234-abcd',
    customerName: 'Maya Okafor',
    tourName: 'Harbour Lights',
    date: '2026-08-15',
    status: 'confirmed',
    partySize: 2,
    paidPence: 12550,
  );
  const bookingB = BookingSummary(
    id: 'bk-5678-efgh',
    customerName: 'Alex Rivers',
    tourName: 'Golden Hour City',
    date: '2026-08-10',
    status: 'pending',
    partySize: 1,
    paidPence: 4000,
  );

  setUp(() async {
    await sl.reset();
    final repo = _FakeRepo(const [bookingA, bookingB]);
    sl.registerFactory(() => BookingsBloc(
          getBookings: GetBookings(repo),
          getBookingDetail: GetBookingDetail(repo),
          transitionBooking: TransitionBooking(repo),
        ));
    sl.registerLazySingleton(() => GetTemplates(_FakeEmailRepo()));
    sl.registerLazySingleton(() => SendBookingEmail(repo));
  });

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: SingleChildScrollView(child: BookingsMasterPage())),
    ));
    await tester.pumpAndSettle();
  }

  testWidgets('A19 table renders the six sortable columns with row data', (tester) async {
    await pump(tester);

    for (final h in ['CUSTOMER', 'REF', 'TOUR', 'DATE', 'AMOUNT', 'STATUS']) {
      expect(find.text(h), findsOneWidget);
    }
    expect(find.text('Maya Okafor'), findsOneWidget);
    expect(find.text('BK-1234-'), findsOneWidget);
    expect(find.text('Harbour Lights'), findsOneWidget);
    expect(find.text('£125.50'), findsOneWidget);
    expect(find.text('CONFIRMED'), findsOneWidget);
    expect(find.byType(PillLabel), findsNWidgets(2));
  });

  testWidgets('header tap sorts, tap again reverses, indicator on active column', (tester) async {
    await pump(tester);

    // Default: date desc → Maya (2026-08-15) first.
    var names = tester.widgetList<Text>(find.byType(Text)).map((t) => t.data).toList();
    expect(names.indexOf('Maya Okafor'), lessThan(names.indexOf('Alex Rivers')));

    // Sort by customer (desc first): Maya before Alex still; toggle → asc.
    await tester.tap(find.text('CUSTOMER'));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    await tester.tap(find.text('CUSTOMER'));
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
    names = tester.widgetList<Text>(find.byType(Text)).map((t) => t.data).toList();
    expect(names.indexOf('Alex Rivers'), lessThan(names.indexOf('Maya Okafor')));
  });

  testWidgets('row select opens floating detail card in place — no navigation, list retained',
      (tester) async {
    await pump(tester);

    await tester.tap(find.text('Maya Okafor'));
    await tester.pumpAndSettle();

    // Detail card is floating over the SAME page: record header + card title.
    expect(find.text('BOOKING RECORD'), findsOneWidget);
    expect(find.text('Booking BK-1234-'), findsOneWidget);
    // The master list (search + table) is still present beneath.
    expect(find.text('Bookings'), findsOneWidget);
    expect(find.text('Alex Rivers'), findsOneWidget);

    // Close dismisses the card, list untouched.
    await tester.tap(find.byTooltip('Close'));
    await tester.pumpAndSettle();
    expect(find.text('BOOKING RECORD'), findsNothing);
    expect(find.text('Maya Okafor'), findsOneWidget);
  });

  testWidgets('detail card: Send email disabled with adjacent reason when no booking-aware template',
      (tester) async {
    await pump(tester);
    await tester.tap(find.text('Maya Okafor'));
    await tester.pumpAndSettle();

    final btn = tester.widget<OutlinedButton>(
        find.ancestor(of: find.text('Send email'), matching: find.byType(OutlinedButton)));
    expect(btn.onPressed, isNull);
    expect(
      find.text('No booking-aware templates are active. Publish one before sending.'),
      findsOneWidget,
    );
  });
}
