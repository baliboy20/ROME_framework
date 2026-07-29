import 'package:equatable/equatable.dart';

/// A9 sales enquiry. `overdue`/`spam` are derived at the data boundary from the
/// worker's status + SLA fields (UXD-12: overdue is flagged, never auto-emailed).
class Enquiry extends Equatable {
  final String id;
  final String prospectName;
  final String tourName;
  final DateTime receivedAt;
  final bool overdue;
  final bool spam;

  const Enquiry({
    required this.id,
    required this.prospectName,
    required this.tourName,
    required this.receivedAt,
    this.overdue = false,
    this.spam = false,
  });

  @override
  List<Object?> get props => [id, prospectName, tourName, receivedAt, overdue, spam];
}
