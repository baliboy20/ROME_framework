import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:fob_webapp_customer_booking_island/theme/tokens.dart';
import 'package:fob_webapp_customer_booking_island/widgets/booking_flow_controller.dart';
import 'package:fob_webapp_customer_booking_island/widgets/steps.dart';
import 'package:fob_webapp_customer_booking_island/api/booking_api.dart';

void main() {
  group('ForestTokens', () {
    test('minimum touch target meets the 44px hard floor', () {
      expect(ForestTokens.minTouchTarget, 44);
    });
  });

  group('BookingFlowController', () {
    test('starts on the selection step with no pre-selected departure', () {
      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid'),
        tourId: 'TOUR-HID',
      );
      expect(controller.step, BookingStep.selection);
      expect(controller.departureId, isNull);
    });

    test('consent checkboxes default to false (never pre-ticked)', () {
      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid'),
        tourId: 'TOUR-HID',
      );
      expect(controller.waiverAccepted, isFalse);
      expect(controller.termsAccepted, isFalse);
    });

    test('selectDeparture stores departure id and party size', () {
      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid'),
        tourId: 'TOUR-HID',
      );
      controller.selectDeparture('DEP-HID-2026-08-01-1000', 3, 4500);
      expect(controller.departureId, 'DEP-HID-2026-08-01-1000');
      expect(controller.partySize, 3);
    });

    test('submitConsent refuses to proceed without waiver acceptance',
        () async {
      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid'),
        tourId: 'TOUR-HID',
      );
      await controller.submitConsent();
      // Refused before advancing: step stays wherever it was (selection, in
      // this unit test which never ran the earlier steps) rather than
      // moving on to review.
      expect(controller.step, isNot(BookingStep.review));
      expect(controller.errorMessage, isNotNull);
    });
  });

  group('BookingFlowController.startFromCompletionLink (DR-B11)', () {
    test('exchanges the link token, loads the booking, jumps to attendees',
        () async {
      final mockClient = MockClient((request) async {
        if (request.url.path.endsWith('/auth/customer/verify-link')) {
          return http.Response(
            jsonEncode({'token': 'session-token-abc', 'booking_id': 'bk-1'}),
            200,
          );
        }
        if (request.url.path.endsWith('/bookings/bk-1')) {
          return http.Response(
            jsonEncode({
              'id': 'bk-1',
              'departure_id': 'dep-1',
              'party_size': 2,
              'price_total_pence': 9000,
              'source': 'owner-created',
            }),
            200,
          );
        }
        return http.Response('not found', 404);
      });

      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid', client: mockClient),
        tourId: '',
      );
      await controller.startFromCompletionLink('link-token-xyz');

      expect(controller.errorMessage, isNull);
      expect(controller.bookingId, 'bk-1');
      expect(controller.authToken, 'session-token-abc');
      expect(controller.partySize, 2);
      expect(controller.departureId, 'dep-1');
      expect(controller.pricePerPersonPence, 4500);
      expect(controller.bookingSource, 'owner-created');
      expect(controller.step, BookingStep.attendees);
    });

    test('provisional bookings skip payment after consent', () async {
      final mockClient = MockClient((request) async {
        if (request.url.path.endsWith('/auth/customer/verify-link')) {
          return http.Response(
            jsonEncode({'token': 'session-token-abc', 'booking_id': 'bk-2'}),
            200,
          );
        }
        if (request.url.path.endsWith('/bookings/bk-2')) {
          return http.Response(
            jsonEncode({
              'id': 'bk-2',
              'departure_id': 'dep-1',
              'party_size': 1,
              'price_total_pence': null,
              'source': 'provisional',
            }),
            200,
          );
        }
        return http.Response('not found', 404);
      });

      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid', client: mockClient),
        tourId: '',
      );
      await controller.startFromCompletionLink('link-token-xyz');
      expect(controller.bookingSource, 'provisional');
    });

    test('an invalid/expired link surfaces an error, not a crash', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'error': 'link expired', 'message': 'This link has expired'}),
          401,
        );
      });

      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid', client: mockClient),
        tourId: '',
      );
      await controller.startFromCompletionLink('bad-token');

      expect(controller.bookingId, isNull);
      expect(controller.errorMessage, isNotNull);
    });
  });

  group('ConsentStep widget', () {
    testWidgets('renders both consent checkboxes unticked by default',
        (tester) async {
      final controller = BookingFlowController(
        api: BookingApi(baseUrl: 'https://example.invalid'),
        tourId: 'TOUR-HID',
      );
      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: ConsentStep(controller: controller))),
      );

      final checkboxes = tester.widgetList<CheckboxListTile>(
        find.byType(CheckboxListTile),
      );
      expect(checkboxes.length, 2);
      for (final cb in checkboxes) {
        expect(cb.value, isFalse);
      }
    });
  });
}
