import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import '../api/tours_api.dart';
import '../theme/lbt_tokens.dart';

/// Public tours catalogue island — renders the "London Bike Tours" tour-card
/// grid (LBT design system). Loads `GET /tours` on mount and lays the cards
/// out responsively: three across on wide viewports, wrapping down to one
/// column on narrow ones. Tapping "Book" navigates the browser to the static
/// booking page for that tour.
class CatalogueView extends StatefulWidget {
  const CatalogueView({
    required this.apiBaseUrl,
    this.limit,
    super.key,
  });

  final String apiBaseUrl;

  /// When set, only the first [limit] tours are shown (e.g. a homepage strip).
  final int? limit;

  @override
  State<CatalogueView> createState() => _CatalogueViewState();
}

class _CatalogueViewState extends State<CatalogueView> {
  late final ToursApi _api;
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _api = ToursApi(baseUrl: widget.apiBaseUrl);
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() async {
    final tours = await _api.fetchTours();
    if (widget.limit != null && widget.limit! < tours.length) {
      return tours.sublist(0, widget.limit!);
    }
    return tours;
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _CataloguePadding(
            child: Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 96),
                child: CircularProgressIndicator(color: LbtColors.forest),
              ),
            ),
          );
        }
        if (snapshot.hasError) {
          return const _CataloguePadding(
            child: Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 96),
                child: Text(
                  "We couldn't load the tours just now.\nPlease try again in a moment.",
                  textAlign: TextAlign.center,
                  style: LbtText.bodyMuted,
                ),
              ),
            ),
          );
        }

        final tours = snapshot.data ?? const [];
        return _CataloguePadding(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Our Tours', style: LbtText.pageTitle),
              const SizedBox(height: LbtSpace.x8),
              _TourGrid(
                tours: tours,
                apiBaseUrl: widget.apiBaseUrl,
              ),
              const SizedBox(height: LbtSpace.x12),
            ],
          ),
        );
      },
    );
  }
}

/// Page gutter — caps the content width and gives the cream page breathing room.
class _CataloguePadding extends StatelessWidget {
  const _CataloguePadding({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1160),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: LbtSpace.x6,
            vertical: LbtSpace.x10,
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Responsive card grid: 3 columns wide, 2 medium, 1 narrow.
class _TourGrid extends StatelessWidget {
  const _TourGrid({required this.tours, required this.apiBaseUrl});

  final List<Map<String, dynamic>> tours;
  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = width >= 900
            ? 3
            : width >= 600
                ? 2
                : 1;
        const gap = LbtSpace.x6;
        final cardWidth =
            columns == 1 ? width : (width - gap * (columns - 1)) / columns;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final tour in tours)
              SizedBox(
                width: cardWidth,
                child: _TourCard(tour: tour, apiBaseUrl: apiBaseUrl),
              ),
          ],
        );
      },
    );
  }
}

class _TourCard extends StatelessWidget {
  const _TourCard({required this.tour, required this.apiBaseUrl});

  final Map<String, dynamic> tour;
  final String apiBaseUrl;

  String get _id => '${tour['id'] ?? ''}';

  void _book() {
    // The catalogue renders inside an iframe on the marketing page, so navigate
    // the TOP window (not the iframe). Booking target is overridable via
    // ?bookbase=... ; defaults to the site's /en/book/ path.
    final uri = Uri.tryParse(web.window.location.href);
    final bookBase = uri?.queryParameters['bookbase'] ?? '/en/book/';
    final target = '$bookBase?tour=$_id';
    final top = web.window.top;
    if (top != null) {
      top.location.href = target;
    } else {
      web.window.location.href = target;
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = '${tour['name'] ?? ''}';
    final tagline = '${tour['tagline'] ?? ''}';
    final badge = tour['badge'] as String?;
    final durationMin = tour['duration_min'];
    final maxRiders = tour['max_riders'];
    final difficulty = '${tour['difficulty'] ?? ''}';
    final pricePence = (tour['price_pence'] as num?)?.toInt() ?? 0;
    final heroImage = tour['hero_image'] as String?;
    final highlights = (tour['route_highlights'] as List<dynamic>? ?? const [])
        .map((e) => '$e')
        .toList();

    final meta = '$durationMin MIN · MAX $maxRiders · '
        '${difficulty.toUpperCase()}';

    return DecoratedBox(
      decoration: BoxDecoration(
        color: LbtColors.creamRaised,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: LbtColors.hairline),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroImage(
              apiBaseUrl: apiBaseUrl,
              heroImage: heroImage,
              badge: badge,
              tint: _tintFor(_id),
            ),
            Padding(
              padding: const EdgeInsets.all(LbtSpace.x5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(meta, style: LbtText.metaLabel),
                  const SizedBox(height: LbtSpace.x3),
                  Text(name, style: LbtText.cardTitle),
                  if (tagline.isNotEmpty) ...[
                    const SizedBox(height: LbtSpace.x2),
                    Text(tagline, style: LbtText.bodyMuted),
                  ],
                  if (highlights.isNotEmpty) ...[
                    const SizedBox(height: LbtSpace.x4),
                    const Text('ROUTE HIGHLIGHTS', style: LbtText.metaLabel),
                    const SizedBox(height: LbtSpace.x2),
                    Text(
                      highlights.join('  ·  '),
                      style: LbtText.body.copyWith(fontSize: 14),
                    ),
                  ],
                  const SizedBox(height: LbtSpace.x5),
                  const Divider(),
                  const SizedBox(height: LbtSpace.x4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: '£${pricePence ~/ 100}',
                                style: LbtText.price,
                              ),
                              const TextSpan(
                                text: ' / person',
                                style: LbtText.bodyMuted,
                              ),
                            ],
                          ),
                        ),
                      ),
                      _BookButton(onPressed: _book),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Deterministic accent tint for the image placeholder, keyed off the id so
  /// each card is stable but the grid stays varied.
  static Color _tintFor(String id) {
    const palette = [LbtColors.forest, LbtColors.rust, LbtColors.blue];
    if (id.isEmpty) return palette.first;
    return palette[id.codeUnits.fold(0, (a, b) => a + b) % palette.length];
  }
}

class _HeroImage extends StatelessWidget {
  const _HeroImage({
    required this.apiBaseUrl,
    required this.heroImage,
    required this.badge,
    required this.tint,
  });

  final String apiBaseUrl;
  final String? heroImage;
  final String? badge;
  final Color tint;

  @override
  Widget build(BuildContext context) {
    final placeholder = _Placeholder(tint: tint);
    final Widget image;
    if (heroImage != null && heroImage!.isNotEmpty) {
      image = Image.network(
        '$apiBaseUrl$heroImage',
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => placeholder,
      );
    } else {
      image = placeholder;
    }

    return AspectRatio(
      aspectRatio: 3 / 2,
      child: Stack(
        fit: StackFit.expand,
        children: [
          image,
          if (badge != null && badge!.isNotEmpty)
            Positioned(
              top: LbtSpace.x3,
              left: LbtSpace.x3,
              child: _BadgeChip(label: badge!),
            ),
        ],
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({required this.tint});

  final Color tint;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color.alphaBlend(tint.withValues(alpha: 0.22), LbtColors.creamSunken),
            Color.alphaBlend(tint.withValues(alpha: 0.42), LbtColors.creamSunken),
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.pedal_bike_outlined,
          size: 44,
          color: tint.withValues(alpha: 0.55),
        ),
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  const _BadgeChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: LbtColors.ink,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontFamily: LbtText.sans,
          fontSize: 10.5,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.9,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _BookButton extends StatelessWidget {
  const _BookButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: LbtColors.forest,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
        textStyle: const TextStyle(
          fontFamily: LbtText.sans,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
      child: const Text('Book  →'),
    );
  }
}
