import '../../../../core/types/result.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/departure.dart';
import '../entities/departure_detail.dart';
import '../entities/lookups.dart';
import '../entities/tour.dart';
import '../repositories/scheduling_repository.dart';

class GetCalendar extends UseCase<List<Departure>, NoParams> {
  final SchedulingRepository repository;
  GetCalendar(this.repository);
  @override
  Future<Result<List<Departure>>> call(NoParams params) => repository.getCalendar();
}

class GetDeparture extends UseCase<DepartureDetail, String> {
  final SchedulingRepository repository;
  GetDeparture(this.repository);
  @override
  Future<Result<DepartureDetail>> call(String id) => repository.getDeparture(id);
}

class GetTours extends UseCase<List<Tour>, NoParams> {
  final SchedulingRepository repository;
  GetTours(this.repository);
  @override
  Future<Result<List<Tour>>> call(NoParams params) => repository.getTours();
}

class SaveTour extends UseCase<void, SaveTourParams> {
  final SchedulingRepository repository;
  SaveTour(this.repository);
  @override
  Future<Result<void>> call(SaveTourParams p) => p.id == null
      ? repository.createTour(p.body)
      : repository.updateTour(p.id!, p.body);
}

class SaveTourParams {
  final String? id;
  final Map<String, dynamic> body;
  const SaveTourParams({this.id, required this.body});
}

class DeleteTour extends UseCase<void, String> {
  final SchedulingRepository repository;
  DeleteTour(this.repository);
  @override
  Future<Result<void>> call(String id) => repository.deleteTour(id);
}

class GetDepartures extends UseCase<List<DepartureEditOption>, NoParams> {
  final SchedulingRepository repository;
  GetDepartures(this.repository);
  @override
  Future<Result<List<DepartureEditOption>>> call(NoParams params) => repository.getDepartures();
}

class GetGuides extends UseCase<List<GuideOption>, NoParams> {
  final SchedulingRepository repository;
  GetGuides(this.repository);
  @override
  Future<Result<List<GuideOption>>> call(NoParams params) => repository.getGuides();
}

class SaveDeparture extends UseCase<void, SaveDepartureParams> {
  final SchedulingRepository repository;
  SaveDeparture(this.repository);
  @override
  Future<Result<void>> call(SaveDepartureParams p) => p.departureId == null
      ? repository.createDeparture(p.body)
      : repository.updateDeparture(p.departureId!, p.body);
}

class SaveDepartureParams {
  final String? departureId;
  final Map<String, dynamic> body;
  const SaveDepartureParams({this.departureId, required this.body});
}

class CancelDeparture extends UseCase<void, CancelDepartureParams> {
  final SchedulingRepository repository;
  CancelDeparture(this.repository);
  @override
  Future<Result<void>> call(CancelDepartureParams p) =>
      repository.cancelDeparture(p.id, notice: p.notice);
}

class CancelDepartureParams {
  final String id;
  final Map<String, dynamic>? notice;
  const CancelDepartureParams(this.id, {this.notice});
}
