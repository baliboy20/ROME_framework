import 'package:equatable/equatable.dart';

/// Result of creating an owner booking (A7): the new id and whether the
/// customer completion link was emailed (DR-B11).
class BookingCreated extends Equatable {
  final String id;
  final bool completionLinkSent;
  const BookingCreated({required this.id, required this.completionLinkSent});

  @override
  List<Object?> get props => [id, completionLinkSent];
}
