// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'progress_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ProgressUpdate _$ProgressUpdateFromJson(Map<String, dynamic> json) {
  return _ProgressUpdate.fromJson(json);
}

/// @nodoc
mixin _$ProgressUpdate {
  String get batchId => throw _privateConstructorUsedError;
  int get total => throw _privateConstructorUsedError;
  int get completed => throw _privateConstructorUsedError;
  int get failed => throw _privateConstructorUsedError;
  ProgressStatus get status => throw _privateConstructorUsedError;
  DateTime get startTime => throw _privateConstructorUsedError;
  DateTime? get endTime => throw _privateConstructorUsedError;
  List<ScrapingResult> get results => throw _privateConstructorUsedError;
  String? get currentUrl => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;

  /// Serializes this ProgressUpdate to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ProgressUpdate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ProgressUpdateCopyWith<ProgressUpdate> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ProgressUpdateCopyWith<$Res> {
  factory $ProgressUpdateCopyWith(
          ProgressUpdate value, $Res Function(ProgressUpdate) then) =
      _$ProgressUpdateCopyWithImpl<$Res, ProgressUpdate>;
  @useResult
  $Res call(
      {String batchId,
      int total,
      int completed,
      int failed,
      ProgressStatus status,
      DateTime startTime,
      DateTime? endTime,
      List<ScrapingResult> results,
      String? currentUrl,
      String? error});
}

/// @nodoc
class _$ProgressUpdateCopyWithImpl<$Res, $Val extends ProgressUpdate>
    implements $ProgressUpdateCopyWith<$Res> {
  _$ProgressUpdateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ProgressUpdate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? batchId = null,
    Object? total = null,
    Object? completed = null,
    Object? failed = null,
    Object? status = null,
    Object? startTime = null,
    Object? endTime = freezed,
    Object? results = null,
    Object? currentUrl = freezed,
    Object? error = freezed,
  }) {
    return _then(_value.copyWith(
      batchId: null == batchId
          ? _value.batchId
          : batchId // ignore: cast_nullable_to_non_nullable
              as String,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      completed: null == completed
          ? _value.completed
          : completed // ignore: cast_nullable_to_non_nullable
              as int,
      failed: null == failed
          ? _value.failed
          : failed // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as ProgressStatus,
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: freezed == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      results: null == results
          ? _value.results
          : results // ignore: cast_nullable_to_non_nullable
              as List<ScrapingResult>,
      currentUrl: freezed == currentUrl
          ? _value.currentUrl
          : currentUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ProgressUpdateImplCopyWith<$Res>
    implements $ProgressUpdateCopyWith<$Res> {
  factory _$$ProgressUpdateImplCopyWith(_$ProgressUpdateImpl value,
          $Res Function(_$ProgressUpdateImpl) then) =
      __$$ProgressUpdateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String batchId,
      int total,
      int completed,
      int failed,
      ProgressStatus status,
      DateTime startTime,
      DateTime? endTime,
      List<ScrapingResult> results,
      String? currentUrl,
      String? error});
}

/// @nodoc
class __$$ProgressUpdateImplCopyWithImpl<$Res>
    extends _$ProgressUpdateCopyWithImpl<$Res, _$ProgressUpdateImpl>
    implements _$$ProgressUpdateImplCopyWith<$Res> {
  __$$ProgressUpdateImplCopyWithImpl(
      _$ProgressUpdateImpl _value, $Res Function(_$ProgressUpdateImpl) _then)
      : super(_value, _then);

  /// Create a copy of ProgressUpdate
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? batchId = null,
    Object? total = null,
    Object? completed = null,
    Object? failed = null,
    Object? status = null,
    Object? startTime = null,
    Object? endTime = freezed,
    Object? results = null,
    Object? currentUrl = freezed,
    Object? error = freezed,
  }) {
    return _then(_$ProgressUpdateImpl(
      batchId: null == batchId
          ? _value.batchId
          : batchId // ignore: cast_nullable_to_non_nullable
              as String,
      total: null == total
          ? _value.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      completed: null == completed
          ? _value.completed
          : completed // ignore: cast_nullable_to_non_nullable
              as int,
      failed: null == failed
          ? _value.failed
          : failed // ignore: cast_nullable_to_non_nullable
              as int,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as ProgressStatus,
      startTime: null == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endTime: freezed == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      results: null == results
          ? _value._results
          : results // ignore: cast_nullable_to_non_nullable
              as List<ScrapingResult>,
      currentUrl: freezed == currentUrl
          ? _value.currentUrl
          : currentUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ProgressUpdateImpl implements _ProgressUpdate {
  const _$ProgressUpdateImpl(
      {required this.batchId,
      required this.total,
      required this.completed,
      required this.failed,
      required this.status,
      required this.startTime,
      this.endTime,
      required final List<ScrapingResult> results,
      this.currentUrl,
      this.error})
      : _results = results;

  factory _$ProgressUpdateImpl.fromJson(Map<String, dynamic> json) =>
      _$$ProgressUpdateImplFromJson(json);

  @override
  final String batchId;
  @override
  final int total;
  @override
  final int completed;
  @override
  final int failed;
  @override
  final ProgressStatus status;
  @override
  final DateTime startTime;
  @override
  final DateTime? endTime;
  final List<ScrapingResult> _results;
  @override
  List<ScrapingResult> get results {
    if (_results is EqualUnmodifiableListView) return _results;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_results);
  }

  @override
  final String? currentUrl;
  @override
  final String? error;

  @override
  String toString() {
    return 'ProgressUpdate(batchId: $batchId, total: $total, completed: $completed, failed: $failed, status: $status, startTime: $startTime, endTime: $endTime, results: $results, currentUrl: $currentUrl, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ProgressUpdateImpl &&
            (identical(other.batchId, batchId) || other.batchId == batchId) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.completed, completed) ||
                other.completed == completed) &&
            (identical(other.failed, failed) || other.failed == failed) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.startTime, startTime) ||
                other.startTime == startTime) &&
            (identical(other.endTime, endTime) || other.endTime == endTime) &&
            const DeepCollectionEquality().equals(other._results, _results) &&
            (identical(other.currentUrl, currentUrl) ||
                other.currentUrl == currentUrl) &&
            (identical(other.error, error) || other.error == error));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      batchId,
      total,
      completed,
      failed,
      status,
      startTime,
      endTime,
      const DeepCollectionEquality().hash(_results),
      currentUrl,
      error);

  /// Create a copy of ProgressUpdate
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ProgressUpdateImplCopyWith<_$ProgressUpdateImpl> get copyWith =>
      __$$ProgressUpdateImplCopyWithImpl<_$ProgressUpdateImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ProgressUpdateImplToJson(
      this,
    );
  }
}

abstract class _ProgressUpdate implements ProgressUpdate {
  const factory _ProgressUpdate(
      {required final String batchId,
      required final int total,
      required final int completed,
      required final int failed,
      required final ProgressStatus status,
      required final DateTime startTime,
      final DateTime? endTime,
      required final List<ScrapingResult> results,
      final String? currentUrl,
      final String? error}) = _$ProgressUpdateImpl;

  factory _ProgressUpdate.fromJson(Map<String, dynamic> json) =
      _$ProgressUpdateImpl.fromJson;

  @override
  String get batchId;
  @override
  int get total;
  @override
  int get completed;
  @override
  int get failed;
  @override
  ProgressStatus get status;
  @override
  DateTime get startTime;
  @override
  DateTime? get endTime;
  @override
  List<ScrapingResult> get results;
  @override
  String? get currentUrl;
  @override
  String? get error;

  /// Create a copy of ProgressUpdate
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ProgressUpdateImplCopyWith<_$ProgressUpdateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

ScrapingResult _$ScrapingResultFromJson(Map<String, dynamic> json) {
  return _ScrapingResult.fromJson(json);
}

/// @nodoc
mixin _$ScrapingResult {
  String get url => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  ScrapingStatus get status => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  int? get wordCount => throw _privateConstructorUsedError;
  String? get readingTime => throw _privateConstructorUsedError;
  DateTime? get completedAt => throw _privateConstructorUsedError;

  /// Serializes this ScrapingResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ScrapingResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ScrapingResultCopyWith<ScrapingResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ScrapingResultCopyWith<$Res> {
  factory $ScrapingResultCopyWith(
          ScrapingResult value, $Res Function(ScrapingResult) then) =
      _$ScrapingResultCopyWithImpl<$Res, ScrapingResult>;
  @useResult
  $Res call(
      {String url,
      String title,
      ScrapingStatus status,
      String? error,
      int? wordCount,
      String? readingTime,
      DateTime? completedAt});
}

/// @nodoc
class _$ScrapingResultCopyWithImpl<$Res, $Val extends ScrapingResult>
    implements $ScrapingResultCopyWith<$Res> {
  _$ScrapingResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ScrapingResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? url = null,
    Object? title = null,
    Object? status = null,
    Object? error = freezed,
    Object? wordCount = freezed,
    Object? readingTime = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_value.copyWith(
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as ScrapingStatus,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      wordCount: freezed == wordCount
          ? _value.wordCount
          : wordCount // ignore: cast_nullable_to_non_nullable
              as int?,
      readingTime: freezed == readingTime
          ? _value.readingTime
          : readingTime // ignore: cast_nullable_to_non_nullable
              as String?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ScrapingResultImplCopyWith<$Res>
    implements $ScrapingResultCopyWith<$Res> {
  factory _$$ScrapingResultImplCopyWith(_$ScrapingResultImpl value,
          $Res Function(_$ScrapingResultImpl) then) =
      __$$ScrapingResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String url,
      String title,
      ScrapingStatus status,
      String? error,
      int? wordCount,
      String? readingTime,
      DateTime? completedAt});
}

/// @nodoc
class __$$ScrapingResultImplCopyWithImpl<$Res>
    extends _$ScrapingResultCopyWithImpl<$Res, _$ScrapingResultImpl>
    implements _$$ScrapingResultImplCopyWith<$Res> {
  __$$ScrapingResultImplCopyWithImpl(
      _$ScrapingResultImpl _value, $Res Function(_$ScrapingResultImpl) _then)
      : super(_value, _then);

  /// Create a copy of ScrapingResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? url = null,
    Object? title = null,
    Object? status = null,
    Object? error = freezed,
    Object? wordCount = freezed,
    Object? readingTime = freezed,
    Object? completedAt = freezed,
  }) {
    return _then(_$ScrapingResultImpl(
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as ScrapingStatus,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      wordCount: freezed == wordCount
          ? _value.wordCount
          : wordCount // ignore: cast_nullable_to_non_nullable
              as int?,
      readingTime: freezed == readingTime
          ? _value.readingTime
          : readingTime // ignore: cast_nullable_to_non_nullable
              as String?,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ScrapingResultImpl implements _ScrapingResult {
  const _$ScrapingResultImpl(
      {required this.url,
      required this.title,
      required this.status,
      this.error,
      this.wordCount,
      this.readingTime,
      this.completedAt});

  factory _$ScrapingResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$ScrapingResultImplFromJson(json);

  @override
  final String url;
  @override
  final String title;
  @override
  final ScrapingStatus status;
  @override
  final String? error;
  @override
  final int? wordCount;
  @override
  final String? readingTime;
  @override
  final DateTime? completedAt;

  @override
  String toString() {
    return 'ScrapingResult(url: $url, title: $title, status: $status, error: $error, wordCount: $wordCount, readingTime: $readingTime, completedAt: $completedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ScrapingResultImpl &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.wordCount, wordCount) ||
                other.wordCount == wordCount) &&
            (identical(other.readingTime, readingTime) ||
                other.readingTime == readingTime) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, url, title, status, error,
      wordCount, readingTime, completedAt);

  /// Create a copy of ScrapingResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ScrapingResultImplCopyWith<_$ScrapingResultImpl> get copyWith =>
      __$$ScrapingResultImplCopyWithImpl<_$ScrapingResultImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ScrapingResultImplToJson(
      this,
    );
  }
}

abstract class _ScrapingResult implements ScrapingResult {
  const factory _ScrapingResult(
      {required final String url,
      required final String title,
      required final ScrapingStatus status,
      final String? error,
      final int? wordCount,
      final String? readingTime,
      final DateTime? completedAt}) = _$ScrapingResultImpl;

  factory _ScrapingResult.fromJson(Map<String, dynamic> json) =
      _$ScrapingResultImpl.fromJson;

  @override
  String get url;
  @override
  String get title;
  @override
  ScrapingStatus get status;
  @override
  String? get error;
  @override
  int? get wordCount;
  @override
  String? get readingTime;
  @override
  DateTime? get completedAt;

  /// Create a copy of ScrapingResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ScrapingResultImplCopyWith<_$ScrapingResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
