import 'package:freezed_annotation/freezed_annotation.dart';

part 'progress_model.freezed.dart';
part 'progress_model.g.dart';

@freezed
class ProgressUpdate with _$ProgressUpdate {
  const factory ProgressUpdate({
    required String batchId,
    required int total,
    required int completed,
    required int failed,
    required ProgressStatus status,
    required DateTime startTime,
    DateTime? endTime,
    required List<ScrapingResult> results,
    String? currentUrl,
    String? error,
  }) = _ProgressUpdate;

  factory ProgressUpdate.fromJson(Map<String, dynamic> json) =>
      _$ProgressUpdateFromJson(json);
}

@freezed
class ScrapingResult with _$ScrapingResult {
  const factory ScrapingResult({
    required String url,
    required String title,
    required ScrapingStatus status,
    String? error,
    int? wordCount,
    String? readingTime,
    DateTime? completedAt,
  }) = _ScrapingResult;

  factory ScrapingResult.fromJson(Map<String, dynamic> json) =>
      _$ScrapingResultFromJson(json);
}

enum ProgressStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('running')
  running,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
}

enum ScrapingStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('scraping')
  scraping,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
}