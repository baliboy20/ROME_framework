// CR-004 (CHG-012, REQ-NOTIF11, UXD-22/23) — A19 sort logic, booking-aware
// template picker filtering, {{personal_message}} slot detection, the
// contract payload shape (templateId/to/personalMessage — never body fields),
// and the send dialog's disabled-with-reason states (UXC-FRM-3).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_detail.dart';
import 'package:fob_webapp_admin/features/bookings/domain/entities/booking_summary.dart';
import 'package:fob_webapp_admin/features/bookings/domain/usecases/booking_usecases.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/pages/bookings_master_page.dart';
import 'package:fob_webapp_admin/features/bookings/presentation/widgets/booking_send_email_dialog.dart';
import 'package:fob_webapp_admin/features/email/domain/entities/email_entities.dart';

BookingSummary _row(String id, {String name = 'A', String tour = 'T', String date = '2026-08-15', String status = 'confirmed', int paid = 1000}) =>
    BookingSummary(id: id, customerName: name, tourName: tour, date: date, status: status, partySize: 2, paidPence: paid);

EmailTemplate _tmpl(String id, {String useCase = 'booking_confirmed_paid', String status = 'active', String subject = 'Hi {{name}}', String body = 'Body', String? bodyHtml}) =>
    EmailTemplate(id: id, useCase: useCase, name: 'Tmpl $id', subject: subject, body: body, variables: const [], status: status, bodyHtml: bodyHtml);

const _detail = BookingDetail(
  id: 'bk-1',
  status: 'confirmed',
  partySize: 2,
  priceTotalPence: 11000,
  tourId: 'golden-hour',
  date: '2026-08-15',
  attendees: [
    Attendee(name: 'Alex Rivers', role: AttendeeRole.leader, email: 'alex@example.com'),
    Attendee(name: 'Sam Rivers', role: AttendeeRole.attendee),
  ],
  emergencyContact: null,
  consent: Consent(),
  statusHistory: StatusHistory(),
  paymentAttempts: [
    PaymentAttempt(status: 'succeeded', providerReference: 'pi_1', amountPence: 3000, refundAmountPence: 0),
    PaymentAttempt(status: 'failed', providerReference: 'pi_2', amountPence: 8000, refundAmountPence: 0),
  ],
);

void main() {
  group('UXD-22 sortBookings', () {
    final rows = [
      _row('b-charlie', name: 'Charlie', tour: 'Zeta', date: '2026-08-20', status: 'pending', paid: 500),
      _row('a-alice', name: 'alice', tour: 'Alpha', date: '2026-08-10', status: 'confirmed', paid: 9000),
      _row('m-bob', name: 'Bob', tour: 'Mid', date: '2026-08-15', status: 'cancelled', paid: 2000),
    ];

    test('sorts by each column, case-insensitive strings, numeric amount', () {
      expect(sortBookings(rows, BookingSortKey.customer, true).map((r) => r.customerName).toList(),
          ['alice', 'Bob', 'Charlie']);
      expect(sortBookings(rows, BookingSortKey.ref, true).first.id, 'a-alice');
      expect(sortBookings(rows, BookingSortKey.tour, true).first.tourName, 'Alpha');
      expect(sortBookings(rows, BookingSortKey.date, true).first.date, '2026-08-10');
      expect(sortBookings(rows, BookingSortKey.amount, true).map((r) => r.paidPence).toList(),
          [500, 2000, 9000]);
      expect(sortBookings(rows, BookingSortKey.status, true).first.status, 'cancelled');
    });

    test('descending reverses the ascending order', () {
      expect(sortBookings(rows, BookingSortKey.amount, false).map((r) => r.paidPence).toList(),
          [9000, 2000, 500]);
    });
  });

  group('UXD-23 template picker filtering', () {
    test('offers only ACTIVE templates whose use_case is booking-aware', () {
      final all = [
        _tmpl('t1'), // active booking-aware — kept
        _tmpl('t2', status: 'draft'), // right use_case, not active
        _tmpl('t3', useCase: 'enquiry_reply'), // active, not booking-aware
        _tmpl('t4', useCase: 'booking_reserved_unpaid'), // kept
        _tmpl('t5', useCase: 'booking_deposit_received', status: 'retired'),
      ];
      expect(bookingAwareActiveTemplates(all).map((t) => t.id).toList(), ['t1', 't4']);
    });
  });

  group('personal_message slot detection (whitespace-tolerant, all three fields)', () {
    test('detects the token in subject, body or bodyHtml', () {
      expect(templateHasPersonalMessageSlot(_tmpl('a', subject: 'Note {{personal_message}}')), isTrue);
      expect(templateHasPersonalMessageSlot(_tmpl('b', body: 'Hi {{ personal_message }}')), isTrue);
      expect(templateHasPersonalMessageSlot(_tmpl('c', bodyHtml: '<p>{{  personal_message  }}</p>')), isTrue);
      expect(templateHasPersonalMessageSlot(_tmpl('d')), isFalse);
      expect(templateHasPersonalMessageSlot(_tmpl('e', body: '{{personal_messages}}')), isFalse);
    });
  });

  group('send payload (api-contracts.md#cr-004)', () {
    test('templateId + to + personalMessage only — never body/subject fields', () {
      const p = SendBookingEmailParams(bookingId: 'bk-1', templateId: 't1', to: 'a@b.co', personalMessage: 'See you!');
      expect(p.payload, {'templateId': 't1', 'to': 'a@b.co', 'personalMessage': 'See you!'});
    });

    test('personalMessage omitted when absent or empty', () {
      const p = SendBookingEmailParams(bookingId: 'bk-1', templateId: 't1', to: 'a@b.co');
      expect(p.payload.keys.toList(), ['templateId', 'to']);
    });
  });

  group('booking merge vars (client mirror of buildBookingMergeVars)', () {
    test('real booking data: lead name, ref, paid sum over succeeded attempts, balance', () {
      final vars = bookingMergeVars(_detail);
      expect(vars['name'], 'Alex Rivers');
      expect(vars['booking_ref'], 'bk-1');
      expect(vars['tour'], 'golden-hour');
      expect(vars['date'], '2026-08-15');
      expect(vars['party_size'], '2');
      expect(vars['amount_paid'], '£30.00'); // failed attempt excluded
      expect(vars['balance_due'], '£80.00');
    });
  });

  group('BookingSendEmailDialog (UXD-23)', () {
    Future<void> pumpDialog(WidgetTester tester, List<EmailTemplate> templates,
        {Future<Result<String>> Function(SendBookingEmailParams p)? onSend}) async {
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: BookingSendEmailDialog(
            detail: _detail,
            templates: templates,
            onSend: onSend ?? (p) async => Success(p.to),
          ),
        ),
      ));
      await tester.pumpAndSettle();
    }

    FilledButton send(WidgetTester tester) => tester.widget<FilledButton>(
        find.ancestor(of: find.text('Send'), matching: find.byType(FilledButton)));

    testWidgets('picker excludes non-booking-aware templates; Send disabled until one chosen',
        (tester) async {
      final templates = [_tmpl('t1'), _tmpl('t3', useCase: 'enquiry_reply')];
      await pumpDialog(tester, templates);

      // Adjacent reason: no template chosen yet (recipient prefilled + valid).
      expect(send(tester).onPressed, isNull);
      expect(find.text('Choose a template'), findsOneWidget);

      await tester.tap(find.byType(DropdownButtonFormField<EmailTemplate>));
      await tester.pumpAndSettle();
      expect(find.textContaining('Tmpl t1'), findsWidgets);
      expect(find.textContaining('Tmpl t3'), findsNothing); // not booking-aware

      await tester.tap(find.textContaining('Tmpl t1').last);
      await tester.pumpAndSettle();
      expect(send(tester).onPressed, isNotNull);
      expect(find.text('Choose a template'), findsNothing);
    });

    testWidgets('recipient prefilled from lead; invalid edit disables Send with reason',
        (tester) async {
      await pumpDialog(tester, [_tmpl('t1')]);
      await tester.tap(find.byType(DropdownButtonFormField<EmailTemplate>));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Tmpl t1').last);
      await tester.pumpAndSettle();

      expect(find.widgetWithText(TextField, 'alex@example.com'), findsOneWidget);
      expect(send(tester).onPressed, isNotNull);

      await tester.enterText(find.widgetWithText(TextField, 'alex@example.com'), 'not-an-email');
      await tester.pumpAndSettle();
      expect(send(tester).onPressed, isNull);
      expect(find.text('Enter a valid email address'), findsWidgets);
    });

    testWidgets('personal-message box only when the template has the slot; slot marked in picker',
        (tester) async {
      final templates = [
        _tmpl('t1'), // no slot
        _tmpl('t2', useCase: 'booking_reserved_unpaid', body: 'Hi {{ personal_message }}'),
      ];
      await pumpDialog(tester, templates);
      await tester.tap(find.byType(DropdownButtonFormField<EmailTemplate>));
      await tester.pumpAndSettle();
      // Slot marker on t2 only.
      expect(find.textContaining('Tmpl t2 · booking_reserved_unpaid · personal message'), findsWidgets);

      await tester.tap(find.textContaining('Tmpl t1').last);
      await tester.pumpAndSettle();
      expect(find.text('Personal message (optional)'), findsNothing);

      await tester.tap(find.byType(DropdownButtonFormField<EmailTemplate>));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Tmpl t2').last);
      await tester.pumpAndSettle();
      expect(find.text('Personal message (optional)'), findsOneWidget);
    });

    testWidgets('Send posts the contract params and pops with the sent-to address',
        (tester) async {
      SendBookingEmailParams? sent;
      await pumpDialog(tester, [_tmpl('t2', body: 'Hi {{ personal_message }}')],
          onSend: (p) async {
        sent = p;
        return Success(p.to);
      });
      await tester.tap(find.byType(DropdownButtonFormField<EmailTemplate>));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Tmpl t2').last);
      await tester.pumpAndSettle();
      await tester.enterText(find.widgetWithText(TextField, 'Personal message (optional)'), 'See you Saturday!');
      await tester.pumpAndSettle();

      await tester.tap(find.text('Send'));
      await tester.pumpAndSettle();

      expect(sent, isNotNull);
      expect(sent!.bookingId, 'bk-1');
      expect(sent!.templateId, 't2');
      expect(sent!.to, 'alex@example.com');
      expect(sent!.personalMessage, 'See you Saturday!');
      expect(sent!.payload.containsKey('body'), isFalse);
      expect(sent!.payload.containsKey('subject'), isFalse);
    });
  });
}
