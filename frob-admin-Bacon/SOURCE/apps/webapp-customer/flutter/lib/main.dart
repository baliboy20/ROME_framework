import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import 'theme/lbt_tokens.dart';
import 'theme/tokens.dart';
import 'widgets/booking_flow.dart';
import 'widgets/catalogue_view.dart';
import 'widgets/completion_flow.dart';
import 'widgets/hub_flow.dart';

/// Entry point for the booking-flow island. Reads `tour` from the page's
/// query string (set by the static tour-detail page's "Book now" link,
/// see `en/tours/hidden-city.html`) and the API origin from a `<meta
/// name="fob-api-base">` tag the static page provides, so the same built
/// island bundle works across environments without a rebuild.
///
/// Also serves the customer "Manage your booking" hub: when the page URL
/// carries `?mode=hub&booking=<bookingId>` (optionally `&token=<customerToken>`
/// from the confirmation-email link) the same island bundle boots into the
/// standalone [HubApp] instead of the booking flow.
void main() {
  final apiBaseUrl = _metaContent('fob-api-base') ??
      const String.fromEnvironment(
        'FOB_API_BASE',
        defaultValue: 'https://api.friendsonbikes.uk',
      );

  // New: the same island bundle also serves the public tours catalogue when
  // the host page carries `<meta name="fob-island" content="catalogue">`.
  if (_metaContent('fob-island') == 'catalogue') {
    runApp(CatalogueIslandApp(
      apiBaseUrl: apiBaseUrl,
      limit: _intQueryParam('limit'),
    ));
    return;
  }

  if (_queryParam('mode') == 'hub') {
    final bookingId = _queryParam('booking');
    if (bookingId != null && bookingId.isNotEmpty) {
      runApp(HubApp(
        apiBaseUrl: apiBaseUrl,
        bookingId: bookingId,
        token: _queryParam('token'),
      ));
      return;
    }
  }

  // DR-B11 (FINDING-004): the completion link mailed for an owner-created
  // or provisional booking (REQ-BOOK08/REQ-BOOK10) points at
  // `?mode=complete&token=<link_token>` — a signed booking-link JWT
  // exchanged server-side, distinct from the `hub` mode's already-live
  // session token above.
  if (_queryParam('mode') == 'complete') {
    final linkToken = _queryParam('token');
    if (linkToken != null && linkToken.isNotEmpty) {
      runApp(CompletionApp(apiBaseUrl: apiBaseUrl, linkToken: linkToken));
      return;
    }
  }

  final tourId = _queryParam('tour') ?? 'TOUR-HID';
  runApp(BookingIslandApp(tourId: tourId, apiBaseUrl: apiBaseUrl));
}

String? _queryParam(String key) {
  final uri = Uri.tryParse(web.window.location.href);
  return uri?.queryParameters[key];
}

int? _intQueryParam(String key) {
  final raw = _queryParam(key);
  if (raw == null) return null;
  return int.tryParse(raw);
}

String? _metaContent(String name) {
  final el = web.document.querySelector('meta[name="$name"]');
  if (el == null) return null;
  return el.getAttribute('content');
}

class BookingIslandApp extends StatelessWidget {
  const BookingIslandApp({
    required this.tourId,
    required this.apiBaseUrl,
    super.key,
  });

  final String tourId;
  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildForestTheme(),
      home: Scaffold(
        backgroundColor: ForestTokens.sand,
        body: SafeArea(
          child: BookingFlow(apiBaseUrl: apiBaseUrl, tourId: tourId),
        ),
      ),
    );
  }
}

/// Standalone host for the public tours catalogue, booted when the host page
/// declares `<meta name="fob-island" content="catalogue">`. Uses the LBT
/// ("London Bike Tours") editorial theme rather than the Forest booking theme.
class CatalogueIslandApp extends StatelessWidget {
  const CatalogueIslandApp({
    required this.apiBaseUrl,
    this.limit,
    super.key,
  });

  final String apiBaseUrl;
  final int? limit;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildLbtTheme(),
      home: Scaffold(
        backgroundColor: LbtColors.cream,
        body: SafeArea(
          child: SingleChildScrollView(
            child: CatalogueView(apiBaseUrl: apiBaseUrl, limit: limit),
          ),
        ),
      ),
    );
  }
}

/// Standalone host for the booking-completion magic-link landing page,
/// booted from `?mode=complete&token=<link_token>` (see [main]). DR-B11 /
/// FINDING-004: this is where a customer lands after clicking the
/// completion link mailed for an owner-created (REQ-BOOK08) or provisional
/// (REQ-BOOK10) booking, to supply their own attendee details and consent.
class CompletionApp extends StatelessWidget {
  const CompletionApp({
    required this.apiBaseUrl,
    required this.linkToken,
    super.key,
  });

  final String apiBaseUrl;
  final String linkToken;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildForestTheme(),
      home: Scaffold(
        backgroundColor: ForestTokens.sand,
        body: SafeArea(
          child: CompletionFlow(apiBaseUrl: apiBaseUrl, linkToken: linkToken),
        ),
      ),
    );
  }
}

/// Standalone host for the "Manage your booking" hub, booted from
/// `?mode=hub&booking=<id>&token=<token>` (see [main]).
class HubApp extends StatelessWidget {
  const HubApp({
    required this.apiBaseUrl,
    required this.bookingId,
    this.token,
    super.key,
  });

  final String apiBaseUrl;
  final String bookingId;
  final String? token;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: buildForestTheme(),
      home: Scaffold(
        backgroundColor: ForestTokens.sand,
        body: SafeArea(
          child: HubFlow(
            apiBaseUrl: apiBaseUrl,
            bookingId: bookingId,
            token: token,
          ),
        ),
      ),
    );
  }
}
