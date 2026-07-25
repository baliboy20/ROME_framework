import '../../domain/entities/booking_detail.dart';

/// Parses the GET /admin/bookings/:id envelope
/// `{ booking, attendees, emergency_contact, consent, status_history, payments }`
/// into a [BookingDetail]. Tolerates the contact_role / is_lead_booker variants.
class BookingDetailModel extends BookingDetail {
  const BookingDetailModel({
    required super.id,
    required super.status,
    required super.partySize,
    required super.priceTotalPence,
    required super.attendees,
    required super.emergencyContact,
    required super.consent,
    required super.statusHistory,
    required super.paymentAttempts,
  });

  factory BookingDetailModel.fromJson(Map<String, dynamic> j) {
    final booking = (j['booking'] as Map?)?.cast<String, dynamic>() ?? const {};
    final attendees = (j['attendees'] as List?) ?? const [];
    final ec = (j['emergency_contact'] as Map?)?.cast<String, dynamic>();
    final consent = (j['consent'] as Map?)?.cast<String, dynamic>() ?? const {};
    final hist = (j['status_history'] as Map?)?.cast<String, dynamic>() ?? const {};
    final payments = (j['payments'] as List?) ?? const [];

    return BookingDetailModel(
      id: booking['id']?.toString() ?? '',
      status: booking['status']?.toString() ?? '',
      partySize: (booking['party_size'] as num?)?.toInt() ?? 0,
      priceTotalPence: (booking['price_total_pence'] as num?)?.toInt() ?? 0,
      attendees: attendees.map((a) {
        final m = (a as Map).cast<String, dynamic>();
        return Attendee(name: m['name']?.toString() ?? '', role: _role(m));
      }).toList(),
      emergencyContact: ec == null
          ? null
          : EmergencyContact(
              name: ec['name']?.toString() ?? '—',
              phone: ec['phone']?.toString() ?? '',
              relationship: ec['relationship']?.toString(),
            ),
      consent: Consent(
        waiverAcceptedAt: _dt(consent['waiver_accepted_at']),
        termsAcceptedAt: _dt(consent['terms_accepted_at']),
      ),
      statusHistory: StatusHistory(
        createdAt: _dt(hist['created_at']),
        confirmedAt: _dt(hist['confirmed_at']),
        cancelledAt: _dt(hist['cancelled_at']),
      ),
      paymentAttempts: payments.map((p) {
        final m = (p as Map).cast<String, dynamic>();
        return PaymentAttempt(
          status: m['status']?.toString() ?? '—',
          providerReference: m['provider_reference']?.toString() ?? '—',
          amountPence: (m['amount_pence'] as num?)?.toInt() ?? 0,
          refundAmountPence: (m['refund_amount_pence'] as num?)?.toInt() ?? 0,
        );
      }).toList(),
    );
  }

  static AttendeeRole _role(Map<String, dynamic> m) {
    final role = m['contact_role']?.toString() ?? (m['is_lead_booker'] == 1 ? 'leader' : 'attendee');
    return switch (role) {
      'leader' => AttendeeRole.leader,
      'co-leader' => AttendeeRole.coLeader,
      _ => AttendeeRole.attendee,
    };
  }

  static DateTime? _dt(dynamic iso) => iso == null ? null : DateTime.tryParse('$iso');
}
