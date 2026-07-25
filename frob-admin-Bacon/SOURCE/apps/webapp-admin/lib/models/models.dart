/// Simplified domain models for the webapp-admin console.
/// Field names follow api-contracts.md / UXIS entity references.
library;

enum StatusPillState { succeeded, requiresPayment, refunded, failed, noShow, draft }

StatusPillState statusFromString(String s) {
  switch (s) {
    case 'succeeded':
      return StatusPillState.succeeded;
    case 'requires_payment':
      return StatusPillState.requiresPayment;
    case 'refunded':
      return StatusPillState.refunded;
    case 'failed':
      return StatusPillState.failed;
    case 'no_show':
      return StatusPillState.noShow;
    default:
      return StatusPillState.draft;
  }
}

String statusLabel(StatusPillState s) {
  switch (s) {
    case StatusPillState.succeeded:
      return 'Succeeded';
    case StatusPillState.requiresPayment:
      return 'Requires payment';
    case StatusPillState.refunded:
      return 'Refunded';
    case StatusPillState.failed:
      return 'Failed';
    case StatusPillState.noShow:
      return 'No-show';
    case StatusPillState.draft:
      return 'Draft';
  }
}

class PaymentRow {
  final String bookingId;
  final String bookingRef;
  final String customerName;
  final int paidPence;
  final int refundedPence;
  final StatusPillState status;
  final String providerRef;

  PaymentRow({
    required this.bookingId,
    required this.bookingRef,
    required this.customerName,
    required this.paidPence,
    required this.refundedPence,
    required this.status,
    required this.providerRef,
  });

  factory PaymentRow.fromJson(Map<String, dynamic> j) => PaymentRow(
        bookingId: j['booking_id']?.toString() ?? j['id']?.toString() ?? '',
        bookingRef: j['booking_ref']?.toString() ?? j['ref']?.toString() ?? '',
        customerName: j['customer_name']?.toString() ?? 'Unknown',
        paidPence: (j['paid_pence'] as num?)?.toInt() ?? 0,
        refundedPence: (j['refunded_pence'] as num?)?.toInt() ?? 0,
        // FINDING-001: payment state lives in `payment_status`; `status` here
        // is the booking status, which is not a payment state.
        status: statusFromString(j['payment_status']?.toString() ?? 'draft'),
        providerRef: j['provider_ref']?.toString() ?? '',
      );

  PaymentRow copyWith({int? refundedPence, StatusPillState? status}) => PaymentRow(
        bookingId: bookingId,
        bookingRef: bookingRef,
        customerName: customerName,
        paidPence: paidPence,
        refundedPence: refundedPence ?? this.refundedPence,
        status: status ?? this.status,
        providerRef: providerRef,
      );
}

enum ReadinessSub { yes, partial, no }

class DepartureRow {
  final String id;
  final String tourName;
  final DateTime dateTime;
  final int bookedCount;
  final int capacity;
  final bool hasGuide;
  final ReadinessSub bikesReadiness;

  DepartureRow({
    required this.id,
    required this.tourName,
    required this.dateTime,
    required this.bookedCount,
    required this.capacity,
    required this.hasGuide,
    required this.bikesReadiness,
  });

  factory DepartureRow.fromJson(Map<String, dynamic> j) => DepartureRow(
        id: j['id']?.toString() ?? '',
        // FINDING-001: backend sends tour_id + date + time + guide_id +
        // readiness_status, not tour_name/datetime/has_guide.
        tourName: j['tour_name']?.toString() ?? j['tour_id']?.toString() ?? 'Tour',
        dateTime: DateTime.tryParse(j['datetime']?.toString() ??
                '${j['date'] ?? ''}T${j['time'] ?? '00:00'}:00') ??
            DateTime.now(),
        bookedCount: (j['booked_count'] as num?)?.toInt() ??
            (j['confirmed_count'] as num?)?.toInt() ?? 0,
        capacity: (j['capacity'] as num?)?.toInt() ?? 10,
        hasGuide: (j['has_guide'] as bool?) ?? (j['guide_id'] != null),
        bikesReadiness: _bikesFromString(
            j['bikes_readiness']?.toString() ?? j['readiness_status']?.toString()),
      );

  /// UXD-07 composite dot: lime = all-clear, orange = hard-miss, cyan = partial.
  String get readinessDot {
    final guideOk = hasGuide;
    final bikesOk = bikesReadiness == ReadinessSub.yes;
    if (guideOk && bikesOk) return 'lime';
    if (!guideOk && bikesReadiness == ReadinessSub.no) return 'orange';
    return 'cyan';
  }
}

ReadinessSub _bikesFromString(String? s) {
  switch (s) {
    case 'yes':
    case 'ready':
    case 'complete':
      return ReadinessSub.yes;
    case 'partial':
    case 'in_progress':
      return ReadinessSub.partial;
    default:
      return ReadinessSub.no;
  }
}

class BikeRow {
  final String id;
  final String label;
  final bool outOfService;
  final bool busyOverlap;

  BikeRow({required this.id, required this.label, this.outOfService = false, this.busyOverlap = false});

  factory BikeRow.fromJson(Map<String, dynamic> j) => BikeRow(
        id: j['id']?.toString() ?? '',
        label: j['label']?.toString() ?? j['id']?.toString() ?? '',
        outOfService: j['out_of_service'] as bool? ?? false,
        busyOverlap: j['busy_overlap'] as bool? ?? false,
      );
}

enum EnquiryTab { open, overdue, spam }

class EnquiryRow {
  final String id;
  final String prospectName;
  final String tourName;
  final DateTime receivedAt;
  final bool overdue;
  final bool spam;

  EnquiryRow({
    required this.id,
    required this.prospectName,
    required this.tourName,
    required this.receivedAt,
    this.overdue = false,
    this.spam = false,
  });

  factory EnquiryRow.fromJson(Map<String, dynamic> j) {
    // FINDING-001: backend sends contact_name + source_tour_id + status +
    // sla_due_at + created_at; derive overdue/spam here.
    final status = j['status']?.toString() ?? 'open';
    final created =
        DateTime.tryParse(j['received_at']?.toString() ?? j['created_at']?.toString() ?? '') ??
            DateTime.now();
    final sla = DateTime.tryParse(j['sla_due_at']?.toString() ?? '');
    final responded = status == 'responded' || status == 'converted' || status == 'closed';
    return EnquiryRow(
      id: j['id']?.toString() ?? '',
      prospectName: j['prospect_name']?.toString() ?? j['contact_name']?.toString() ?? 'Unknown',
      tourName: j['tour_name']?.toString() ?? j['source_tour_id']?.toString() ?? '',
      receivedAt: created,
      overdue: (j['overdue'] as bool?) ??
          (!responded && sla != null && sla.isBefore(DateTime.now())),
      spam: (j['spam'] as bool?) ?? (status == 'spam'),
    );
  }
}

// ---------------------------------------------------------------------------
// FINDING-001 remediation — models for the newly-built admin screens.
// ---------------------------------------------------------------------------

/// A19 booking browser row (BO05/BO06).
class BookingSummaryRow {
  final String id;
  final String customerName;
  final String tourName;
  final String date;
  final String status;
  final int partySize;
  final int paidPence;

  BookingSummaryRow({
    required this.id,
    required this.customerName,
    required this.tourName,
    required this.date,
    required this.status,
    required this.partySize,
    required this.paidPence,
  });

  factory BookingSummaryRow.fromJson(Map<String, dynamic> j) => BookingSummaryRow(
        id: j['id']?.toString() ?? '',
        customerName: j['customer_name']?.toString() ?? 'Unknown',
        tourName: j['tour_id']?.toString() ?? '',
        date: j['date']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        partySize: (j['party_size'] as num?)?.toInt() ?? 0,
        paidPence: (j['paid_pence'] as num?)?.toInt() ?? 0,
      );
}

/// A13 equipment register row (FLEET02).
class EquipmentRow {
  final String id;
  final String type;
  final String description;
  final String status;
  final String? reviewDueAt;

  EquipmentRow({
    required this.id,
    required this.type,
    required this.description,
    required this.status,
    this.reviewDueAt,
  });

  factory EquipmentRow.fromJson(Map<String, dynamic> j) => EquipmentRow(
        id: j['id']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        reviewDueAt: j['review_due_at']?.toString(),
      );
}

/// A10 incident row (OPS12).
class IncidentRow {
  final String id;
  final String location;
  final String type;
  final String severity;
  final String description;
  final String status;
  final String tourId;
  final String occurredAt;

  IncidentRow({
    required this.id,
    required this.location,
    required this.type,
    required this.severity,
    required this.description,
    required this.status,
    required this.tourId,
    required this.occurredAt,
  });

  factory IncidentRow.fromJson(Map<String, dynamic> j) => IncidentRow(
        id: j['id']?.toString() ?? '',
        location: j['location']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        severity: j['severity']?.toString() ?? '',
        description: j['preliminary_description']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        tourId: j['tour_id']?.toString() ?? '',
        occurredAt: j['occurred_at']?.toString() ?? '',
      );
}

/// A11 hazard-log row (OPS14).
class HazardRow {
  final String id;
  final String street;
  final String hazardType;
  final String description;
  final String severity;
  final String status;
  final String observedAt;

  HazardRow({
    required this.id,
    required this.street,
    required this.hazardType,
    required this.description,
    required this.severity,
    required this.status,
    required this.observedAt,
  });

  factory HazardRow.fromJson(Map<String, dynamic> j) => HazardRow(
        id: j['id']?.toString() ?? '',
        street: j['street_name']?.toString() ?? '',
        hazardType: j['hazard_type']?.toString() ?? '',
        description: j['description']?.toString() ?? '',
        severity: j['severity']?.toString() ?? '—',
        status: j['status']?.toString() ?? '',
        observedAt: j['observed_at']?.toString() ?? '',
      );
}

/// A16 compliance row (FLEET07/08).
class ComplianceRow {
  final String id;
  final String type;
  final String expiry;
  final String status;
  final String? equipmentDescription;

  ComplianceRow({
    required this.id,
    required this.type,
    required this.expiry,
    required this.status,
    this.equipmentDescription,
  });

  factory ComplianceRow.fromJson(Map<String, dynamic> j) => ComplianceRow(
        id: j['id']?.toString() ?? '',
        type: j['type']?.toString() ?? '',
        expiry: j['expiry_or_due_at']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        equipmentDescription: j['equipment_description']?.toString(),
      );
}

/// A4 owner-alert row (NOTIF04) and A3 deliverability row (NOTIF02).
class MessageRow {
  final String id;
  final String recipient;
  final String event;
  final String status;
  final String provider;
  final String createdAt;

  MessageRow({
    required this.id,
    required this.recipient,
    required this.event,
    required this.status,
    required this.provider,
    required this.createdAt,
  });

  factory MessageRow.fromJson(Map<String, dynamic> j) => MessageRow(
        id: j['id']?.toString() ?? '',
        recipient: j['recipient']?.toString() ?? '',
        event: j['event']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        provider: j['provider']?.toString() ?? '',
        createdAt: j['created_at']?.toString() ?? '',
      );
}

/// A6 publish & content quality (SEO03).
class ContentPage {
  final String tourId;
  final String path;
  final String title;
  final bool published;
  ContentPage({required this.tourId, required this.path, required this.title, required this.published});
  factory ContentPage.fromJson(Map<String, dynamic> j) => ContentPage(
        tourId: j['tour_id']?.toString() ?? '',
        path: j['path']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        published: j['published'] as bool? ?? false,
      );
}

class QualityItem {
  final String title;
  final String detail;
  QualityItem({required this.title, required this.detail});
  factory QualityItem.fromJson(Map<String, dynamic> j) =>
      QualityItem(title: j['title']?.toString() ?? '', detail: j['detail']?.toString() ?? '');
}

/// A14 fleet readiness dashboard (FLEET03): status counts + alerts.
class FleetReadiness {
  final Map<String, int> counts;
  final List<String> alerts;
  FleetReadiness({required this.counts, required this.alerts});
  factory FleetReadiness.fromJson(Map<String, dynamic> j) {
    final b = (j['bikes'] as Map?)?.cast<String, dynamic>() ?? {};
    return FleetReadiness(
      counts: b.map((k, v) => MapEntry(k, (v as num?)?.toInt() ?? 0)),
      alerts: ((j['alerts'] as List?) ?? []).map((e) => e.toString()).toList(),
    );
  }
}
