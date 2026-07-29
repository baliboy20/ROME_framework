import 'package:flutter/foundation.dart';

import '../api/booking_api.dart';

enum BookingStep { selection, attendees, consent, review, payment, confirmed }

/// Holds state for the W4-W10 booking flow so it survives step navigation
/// within the single island (no full-page reload between steps, per
/// design-system.md §5.4/TDR-13 "island" scope).
class BookingFlowController extends ChangeNotifier {
  BookingFlowController({required this.api, required this.tourId});

  final BookingApi api;
  final String tourId;

  BookingStep step = BookingStep.selection;
  String? departureId;
  int partySize = 1;
  int? pricePerPersonPence;
  final List<Map<String, dynamic>> attendees = [];

  // Emergency contact + customer email captured on the attendees step.
  String emergencyContactName = '';
  String emergencyContactPhone = '';
  String emergencyContactRelationship = '';
  String customerEmail = '';

  // Consent checkboxes never pre-ticked (hard invariant, design-system.md
  // §5.2) — both default false and stay false until the user explicitly
  // taps them.
  bool waiverAccepted = false;
  bool termsAccepted = false;

  /// Customer session token from `POST /bookings`, forwarded to the api client.
  String? authToken;

  String? bookingId;
  String? checkoutClientSecret;
  String? checkoutPublishableKey;

  /// Set only via [startFromCompletionLink]. `provisional` bookings
  /// (REQ-BOOK10, DR-B2) never take payment at creation — the review step
  /// finishes the booking directly instead of routing to Stripe.
  String? bookingSource;

  bool loading = false;
  String? errorMessage;

  void selectDeparture(String id, int party, int pricePence) {
    departureId = id;
    partySize = party;
    pricePerPersonPence = pricePence;
    notifyListeners();
  }

  /// DR-B11 - entry point for the magic-link landing page: exchanges the
  /// mailed completion-link token for a session, loads the booking the
  /// Owner already created (REQ-BOOK08/REQ-BOOK10), and jumps straight to
  /// the attendees step — REQ-BOOK01's selection step is skipped, since the
  /// departure/party-size/price were already set by the Owner.
  Future<void> startFromCompletionLink(String linkToken) async {
    await _run(() async {
      final verified = await api.verifyCompletionLink(linkToken);
      authToken = verified['token'] as String?;
      bookingId = verified['booking_id'] as String?;
      api.setToken(authToken);

      final booking = await api.fetchBooking(bookingId!);
      partySize = booking['party_size'] as int? ?? 1;
      departureId = booking['departure_id'] as String?;
      bookingSource = booking['source'] as String?;
      final totalPence = booking['price_total_pence'] as int?;
      pricePerPersonPence =
          totalPence == null ? null : (totalPence / partySize).round();
      step = BookingStep.attendees;
    });
  }

  Future<void> confirmSelection() async {
    await _run(() async {
      final result = await api.createBooking(
        departureId: departureId!,
        partySize: partySize,
        pricePerPersonPence: pricePerPersonPence!,
      );
      bookingId = result['id'] as String? ?? result['bookingId'] as String?;
      authToken = result['token'] as String?;
      api.setToken(authToken);
      step = BookingStep.attendees;
    });
  }

  Future<void> submitAttendees(
    List<Map<String, dynamic>> people, {
    required String emergencyName,
    required String emergencyPhone,
    required String emergencyRelationship,
    required String email,
  }) async {
    await _run(() async {
      await api.updateParticipants(
        bookingId: bookingId!,
        participants: people,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
        emergencyContactRelationship: emergencyRelationship,
      );
      attendees
        ..clear()
        ..addAll(people);
      emergencyContactName = emergencyName;
      emergencyContactPhone = emergencyPhone;
      emergencyContactRelationship = emergencyRelationship;
      customerEmail = email;
      step = BookingStep.consent;
    });
  }

  void setWaiverAccepted(bool value) {
    waiverAccepted = value;
    notifyListeners();
  }

  void setTermsAccepted(bool value) {
    termsAccepted = value;
    notifyListeners();
  }

  Future<void> submitConsent() async {
    if (!waiverAccepted || !termsAccepted) {
      errorMessage = 'You must accept both the waiver and the terms to continue.';
      notifyListeners();
      return;
    }
    await _run(() async {
      await api.submitConsent(
        bookingId: bookingId!,
        waiverAccepted: waiverAccepted,
        termsAccepted: termsAccepted,
      );
      step = BookingStep.review;
    });
  }

  void proceedToPayment() {
    step = BookingStep.payment;
    notifyListeners();
  }

  Future<void> startCheckout() async {
    await _run(() async {
      final result = await api.createCheckoutSession(
        bookingId: bookingId!,
        customerEmail: customerEmail.isEmpty ? null : customerEmail,
      );
      checkoutClientSecret = result['clientSecret'] as String?;
      checkoutPublishableKey = const String.fromEnvironment(
        'STRIPE_PUBLISHABLE_KEY',
        defaultValue:
            'pk_test_51T7csbFDdVl3SML7AuRd1Vt55H2m8P6trx1sb5dnblSTj1adHXUg4rPFr92826mKi9IW5yFtjWv7vxVSn04C6xnl00iYMaHaX2',
      );
    });
  }

  void markConfirmed() {
    step = BookingStep.confirmed;
    notifyListeners();
  }

  Future<void> _run(Future<void> Function() body) async {
    loading = true;
    errorMessage = null;
    notifyListeners();
    try {
      await body();
    } on BookingApiException catch (e) {
      errorMessage = 'Something went wrong (${e.statusCode}). Please try again.';
    } catch (_) {
      errorMessage = 'Something went wrong. Please try again.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
