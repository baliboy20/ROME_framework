import '../../domain/entities/departure.dart';
import '../../domain/entities/departure_detail.dart';
import '../../domain/entities/lookups.dart';
import '../../domain/entities/tour.dart';

class TourModel extends Tour {
  const TourModel({
    required super.id,
    required super.name,
    required super.tagline,
    super.description,
    required super.durationMin,
    required super.difficulty,
    required super.pricePence,
    super.badge,
    super.routeHighlights,
    required super.status,
  });

  factory TourModel.fromJson(Map<String, dynamic> j) => TourModel(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        tagline: j['tagline']?.toString() ?? '',
        description: j['description']?.toString(),
        durationMin: (j['duration_min'] as num?)?.toInt() ?? 0,
        difficulty: j['difficulty']?.toString() ?? 'Easy',
        pricePence: (j['price_pence'] as num?)?.toInt() ?? 0,
        badge: j['badge']?.toString(),
        routeHighlights: ((j['route_highlights'] as List?) ?? const []).map((e) => '$e').toList(),
        status: j['status']?.toString() ?? 'draft',
      );

  /// Request body for POST/PATCH /admin/tours.
  static Map<String, dynamic> toBody({
    required String name,
    required String tagline,
    String? description,
    required int durationMin,
    required String difficulty,
    required int pricePence,
    String? badge,
    required List<String> routeHighlights,
    required String status,
  }) =>
      {
        'name': name,
        'tagline': tagline,
        'description': (description == null || description.isEmpty) ? null : description,
        'duration_min': durationMin,
        'difficulty': difficulty,
        'price_pence': pricePence,
        'badge': (badge == null || badge.isEmpty) ? null : badge,
        'route_highlights': routeHighlights,
        'status': status,
      };
}

class DepartureModel extends Departure {
  const DepartureModel({
    required super.id,
    required super.tourName,
    required super.dateTime,
    required super.bookedCount,
    required super.capacity,
    required super.hasGuide,
    required super.bikesReadiness,
  });

  factory DepartureModel.fromJson(Map<String, dynamic> j) => DepartureModel(
        id: j['id']?.toString() ?? '',
        // FINDING-001: backend sends tour_id + date + time + guide_id + readiness_status.
        tourName: j['tour_name']?.toString() ?? j['tour_id']?.toString() ?? 'Tour',
        dateTime: DateTime.tryParse(
                j['datetime']?.toString() ?? '${j['date'] ?? ''}T${j['time'] ?? '00:00'}:00') ??
            DateTime.now(),
        bookedCount: (j['booked_count'] as num?)?.toInt() ?? (j['confirmed_count'] as num?)?.toInt() ?? 0,
        capacity: (j['capacity'] as num?)?.toInt() ?? 10,
        hasGuide: (j['has_guide'] as bool?) ?? (j['guide_id'] != null),
        bikesReadiness: _readiness(j['bikes_readiness']?.toString() ?? j['readiness_status']?.toString()),
      );

  static Readiness _readiness(String? s) {
    switch (s) {
      case 'yes':
      case 'ready':
      case 'ok':
        return Readiness.yes;
      case 'no':
      case 'blocked':
      case 'not_ready':
        return Readiness.no;
      default:
        return Readiness.partial;
    }
  }
}

class DepartureDetailModel extends DepartureDetail {
  const DepartureDetailModel({
    super.time,
    super.guideName,
    required super.bookings,
    required super.participants,
  });

  factory DepartureDetailModel.fromJson(Map<String, dynamic> j) {
    final dep = (j['departure'] as Map?)?.cast<String, dynamic>() ?? const {};
    final bookings = (j['bookings'] as List?) ?? const [];
    final participants = (j['participants'] as List?) ?? const [];
    return DepartureDetailModel(
      time: dep['time']?.toString(),
      guideName: dep['guide_name']?.toString(),
      bookings: bookings.map((b) {
        final m = (b as Map).cast<String, dynamic>();
        return DepartureBooking(
          id: m['id']?.toString() ?? '',
          leadName: m['lead_name']?.toString() ?? 'Booking ${m['id']}',
          status: m['status']?.toString() ?? '',
        );
      }).toList(),
      participants: participants.map((p) {
        final m = (p as Map).cast<String, dynamic>();
        final role = m['contact_role']?.toString() ?? (m['is_lead_booker'] == 1 ? 'leader' : 'attendee');
        return DepartureParticipant(
          bookingId: m['booking_id']?.toString() ?? '',
          name: m['name']?.toString() ?? '',
          ageBand: m['age_band']?.toString() ?? '',
          notes: m['notes']?.toString(),
          role: role,
        );
      }).toList(),
    );
  }
}

class GuideOptionModel extends GuideOption {
  const GuideOptionModel({required super.id, required super.name});
  factory GuideOptionModel.fromJson(Map<String, dynamic> j) => GuideOptionModel(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? j['id']?.toString() ?? '',
      );
}

class DepartureEditOptionModel extends DepartureEditOption {
  const DepartureEditOptionModel({
    required super.id,
    required super.tourId,
    required super.date,
    required super.time,
    required super.capacity,
    required super.confirmedCount,
    super.guideId,
  });

  factory DepartureEditOptionModel.fromJson(Map<String, dynamic> j) => DepartureEditOptionModel(
        id: j['id']?.toString() ?? '',
        tourId: j['tour_id']?.toString() ?? '',
        date: j['date']?.toString() ?? '',
        time: j['time']?.toString() ?? '',
        capacity: (j['capacity'] as num?)?.toInt() ?? 10,
        confirmedCount: (j['confirmed_count'] as num?)?.toInt() ?? 0,
        guideId: j['guide_id']?.toString(),
      );
}
