import 'package:equatable/equatable.dart';

/// A17 drill-down: departure meta + its bookings and their participants.
class DepartureDetail extends Equatable {
  final String? time;
  final String? guideName;
  final List<DepartureBooking> bookings;
  final List<DepartureParticipant> participants;

  const DepartureDetail({
    this.time,
    this.guideName,
    required this.bookings,
    required this.participants,
  });

  List<DepartureParticipant> participantsFor(String bookingId) =>
      participants.where((p) => p.bookingId == bookingId).toList();

  @override
  List<Object?> get props => [time, guideName, bookings, participants];
}

class DepartureBooking extends Equatable {
  final String id;
  final String leadName;
  final String status;
  const DepartureBooking({required this.id, required this.leadName, required this.status});
  @override
  List<Object?> get props => [id, leadName, status];
}

class DepartureParticipant extends Equatable {
  final String bookingId;
  final String name;
  final String ageBand;
  final String? notes;
  final String role;
  const DepartureParticipant({
    required this.bookingId,
    required this.name,
    required this.ageBand,
    this.notes,
    required this.role,
  });
  @override
  List<Object?> get props => [bookingId, name, ageBand, notes, role];
}
