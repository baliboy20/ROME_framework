import '../../domain/entities/enquiry.dart';

class EnquiryModel extends Enquiry {
  const EnquiryModel({
    required super.id,
    required super.prospectName,
    required super.tourName,
    required super.receivedAt,
    super.overdue,
    super.spam,
  });

  factory EnquiryModel.fromJson(Map<String, dynamic> j) {
    // FINDING-001: backend sends contact_name + source_tour_id + status +
    // sla_due_at + created_at; derive overdue/spam here (data layer).
    final status = j['status']?.toString() ?? 'open';
    final created = DateTime.tryParse(
            j['received_at']?.toString() ?? j['created_at']?.toString() ?? '') ??
        DateTime.now();
    final sla = DateTime.tryParse(j['sla_due_at']?.toString() ?? '');
    final responded = status == 'responded' || status == 'converted' || status == 'closed';
    return EnquiryModel(
      id: j['id']?.toString() ?? '',
      prospectName: j['prospect_name']?.toString() ?? j['contact_name']?.toString() ?? 'Unknown',
      tourName: j['tour_name']?.toString() ?? j['source_tour_id']?.toString() ?? '',
      receivedAt: created,
      overdue: (j['overdue'] as bool?) ?? (!responded && sla != null && sla.isBefore(DateTime.now())),
      spam: (j['spam'] as bool?) ?? (status == 'spam'),
    );
  }
}
