// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'email_filter_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EmailFilterModelImpl _$$EmailFilterModelImplFromJson(
        Map<String, dynamic> json) =>
    _$EmailFilterModelImpl(
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      subjects: (json['subjects'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const ['Medium Daily Digest'],
      keywords: (json['keywords'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const ['flutter'],
    );

Map<String, dynamic> _$$EmailFilterModelImplToJson(
        _$EmailFilterModelImpl instance) =>
    <String, dynamic>{
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate.toIso8601String(),
      'subjects': instance.subjects,
      'keywords': instance.keywords,
    };
