import 'package:equatable/equatable.dart';

/// A22 tour/route catalogue entry (REQ-TOUR-CAT / DR-B13). Only `published`
/// tours are bookable and offered for scheduling.
class Tour extends Equatable {
  final String id;
  final String name;
  final String tagline;
  final String? description;
  final int durationMin;
  final String difficulty;
  final int pricePence;
  final String? badge;
  final List<String> routeHighlights;
  final String status;

  const Tour({
    required this.id,
    required this.name,
    required this.tagline,
    this.description,
    required this.durationMin,
    required this.difficulty,
    required this.pricePence,
    this.badge,
    this.routeHighlights = const [],
    required this.status,
  });

  bool get isPublished => status == 'published';

  @override
  List<Object?> get props =>
      [id, name, tagline, description, durationMin, difficulty, pricePence, badge, routeHighlights, status];
}
