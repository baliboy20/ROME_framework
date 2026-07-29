import '../../domain/entities/booking_summary.dart';

class BookingSummaryModel extends BookingSummary {
  const BookingSummaryModel({
    required super.id,
    required super.customerName,
    required super.tourName,
    required super.date,
    required super.status,
    required super.partySize,
    required super.paidPence,
  });

  factory BookingSummaryModel.fromJson(Map<String, dynamic> j) => BookingSummaryModel(
        id: j['id']?.toString() ?? '',
        customerName: j['customer_name']?.toString() ?? 'Unknown',
        tourName: j['tour_id']?.toString() ?? '',
        date: j['date']?.toString() ?? '',
        status: j['status']?.toString() ?? '',
        partySize: (j['party_size'] as num?)?.toInt() ?? 0,
        paidPence: (j['paid_pence'] as num?)?.toInt() ?? 0,
      );
}

class DepartureSlotModel extends DepartureSlot {
  const DepartureSlotModel({required super.id, required super.tourId, required super.date, required super.time});

  factory DepartureSlotModel.fromJson(Map<String, dynamic> j) => DepartureSlotModel(
        id: j['id']?.toString() ?? '',
        tourId: j['tour_id']?.toString() ?? 'Tour',
        date: j['date']?.toString() ?? '',
        time: j['time']?.toString() ?? '',
      );
}
