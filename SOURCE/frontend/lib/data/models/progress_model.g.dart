// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProgressUpdateImpl _$$ProgressUpdateImplFromJson(Map<String, dynamic> json) =>
    _$ProgressUpdateImpl(
      batchId: json['batchId'] as String,
      total: (json['total'] as num).toInt(),
      completed: (json['completed'] as num).toInt(),
      failed: (json['failed'] as num).toInt(),
      status: $enumDecode(_$ProgressStatusEnumMap, json['status']),
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: json['endTime'] == null
          ? null
          : DateTime.parse(json['endTime'] as String),
      results: (json['results'] as List<dynamic>)
          .map((e) => ScrapingResult.fromJson(e as Map<String, dynamic>))
          .toList(),
      currentUrl: json['currentUrl'] as String?,
      error: json['error'] as String?,
    );

Map<String, dynamic> _$$ProgressUpdateImplToJson(
        _$ProgressUpdateImpl instance) =>
    <String, dynamic>{
      'batchId': instance.batchId,
      'total': instance.total,
      'completed': instance.completed,
      'failed': instance.failed,
      'status': _$ProgressStatusEnumMap[instance.status]!,
      'startTime': instance.startTime.toIso8601String(),
      'endTime': instance.endTime?.toIso8601String(),
      'results': instance.results,
      'currentUrl': instance.currentUrl,
      'error': instance.error,
    };

const _$ProgressStatusEnumMap = {
  ProgressStatus.pending: 'pending',
  ProgressStatus.running: 'running',
  ProgressStatus.completed: 'completed',
  ProgressStatus.failed: 'failed',
  ProgressStatus.cancelled: 'cancelled',
};

_$ScrapingResultImpl _$$ScrapingResultImplFromJson(Map<String, dynamic> json) =>
    _$ScrapingResultImpl(
      url: json['url'] as String,
      title: json['title'] as String,
      status: $enumDecode(_$ScrapingStatusEnumMap, json['status']),
      error: json['error'] as String?,
      wordCount: (json['wordCount'] as num?)?.toInt(),
      readingTime: json['readingTime'] as String?,
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
    );

Map<String, dynamic> _$$ScrapingResultImplToJson(
        _$ScrapingResultImpl instance) =>
    <String, dynamic>{
      'url': instance.url,
      'title': instance.title,
      'status': _$ScrapingStatusEnumMap[instance.status]!,
      'error': instance.error,
      'wordCount': instance.wordCount,
      'readingTime': instance.readingTime,
      'completedAt': instance.completedAt?.toIso8601String(),
    };

const _$ScrapingStatusEnumMap = {
  ScrapingStatus.pending: 'pending',
  ScrapingStatus.scraping: 'scraping',
  ScrapingStatus.completed: 'completed',
  ScrapingStatus.failed: 'failed',
};
