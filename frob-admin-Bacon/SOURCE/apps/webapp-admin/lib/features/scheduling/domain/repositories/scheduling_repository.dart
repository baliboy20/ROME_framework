import '../../../../core/types/result.dart';
import '../entities/departure.dart';
import '../entities/departure_detail.dart';
import '../entities/lookups.dart';
import '../entities/tour.dart';

abstract class SchedulingRepository {
  Future<Result<List<Departure>>> getCalendar();
  Future<Result<DepartureDetail>> getDeparture(String id);
  Future<Result<List<Tour>>> getTours();
  Future<Result<void>> createTour(Map<String, dynamic> body);
  Future<Result<void>> updateTour(String id, Map<String, dynamic> body);
  Future<Result<void>> deleteTour(String id);
  Future<Result<List<DepartureEditOption>>> getDepartures();
  Future<Result<List<GuideOption>>> getGuides();
  Future<Result<void>> createDeparture(Map<String, dynamic> body);
  Future<Result<void>> updateDeparture(String id, Map<String, dynamic> body);
  Future<Result<void>> cancelDeparture(String id);
}
