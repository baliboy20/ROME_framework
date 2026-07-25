import 'package:equatable/equatable.dart';

/// Read-only booking aggregate behind GET /admin/bookings/:id — shared by the
/// A19 browser and the payments drill-down modals. Pure, immutable, Equatable.
class BookingDetail extends Equatable {
  final String id;
  final String status;
  final int partySize;
  final int priceTotalPence;
  final String? tourId;
  final String? date;
  final String? departureId;
  final List<Attendee> attendees;
  final EmergencyContact? emergencyContact;
  final Consent consent;
  final StatusHistory statusHistory;
  final List<PaymentAttempt> paymentAttempts;

  const BookingDetail({
    required this.id,
    required this.status,
    required this.partySize,
    required this.priceTotalPence,
    this.tourId,
    this.date,
    this.departureId,
    required this.attendees,
    required this.emergencyContact,
    required this.consent,
    required this.statusHistory,
    required this.paymentAttempts,
  });

  /// The party leader's name, falling back to the first attendee.
  String get leadName {
    for (final a in attendees) {
      if (a.isLeader) return a.name;
    }
    return attendees.isNotEmpty ? attendees.first.name : '—';
  }

  @override
  List<Object?> get props => [
        id, status, partySize, priceTotalPence, tourId, date, departureId,
        attendees, emergencyContact, consent, statusHistory, paymentAttempts,
      ];
}

enum AttendeeRole { leader, coLeader, attendee }

class Attendee extends Equatable {
  final String name;
  final AttendeeRole role;
  final String ageBand;
  final String? notes;
  const Attendee({required this.name, required this.role, this.ageBand = '18+', this.notes});

  bool get isLeader => role == AttendeeRole.leader;

  @override
  List<Object?> get props => [name, role, ageBand, notes];
}

class EmergencyContact extends Equatable {
  final String name;
  final String phone;
  final String? relationship;
  const EmergencyContact({required this.name, required this.phone, this.relationship});

  @override
  List<Object?> get props => [name, phone, relationship];
}

class Consent extends Equatable {
  final DateTime? waiverAcceptedAt;
  final DateTime? termsAcceptedAt;
  const Consent({this.waiverAcceptedAt, this.termsAcceptedAt});

  @override
  List<Object?> get props => [waiverAcceptedAt, termsAcceptedAt];
}

class StatusHistory extends Equatable {
  final DateTime? createdAt;
  final DateTime? confirmedAt;
  final DateTime? cancelledAt;
  const StatusHistory({this.createdAt, this.confirmedAt, this.cancelledAt});

  @override
  List<Object?> get props => [createdAt, confirmedAt, cancelledAt];
}

class PaymentAttempt extends Equatable {
  final String status;
  final String providerReference;
  final int amountPence;
  final int refundAmountPence;
  const PaymentAttempt({
    required this.status,
    required this.providerReference,
    required this.amountPence,
    required this.refundAmountPence,
  });

  @override
  List<Object?> get props => [status, providerReference, amountPence, refundAmountPence];
}
