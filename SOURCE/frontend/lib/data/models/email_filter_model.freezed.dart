// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'email_filter_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

EmailFilterModel _$EmailFilterModelFromJson(Map<String, dynamic> json) {
  return _EmailFilterModel.fromJson(json);
}

/// @nodoc
mixin _$EmailFilterModel {
  DateTime get startDate => throw _privateConstructorUsedError;
  DateTime get endDate => throw _privateConstructorUsedError;
  List<String> get subjects => throw _privateConstructorUsedError;
  List<String> get keywords => throw _privateConstructorUsedError;

  /// Serializes this EmailFilterModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of EmailFilterModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EmailFilterModelCopyWith<EmailFilterModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EmailFilterModelCopyWith<$Res> {
  factory $EmailFilterModelCopyWith(
          EmailFilterModel value, $Res Function(EmailFilterModel) then) =
      _$EmailFilterModelCopyWithImpl<$Res, EmailFilterModel>;
  @useResult
  $Res call(
      {DateTime startDate,
      DateTime endDate,
      List<String> subjects,
      List<String> keywords});
}

/// @nodoc
class _$EmailFilterModelCopyWithImpl<$Res, $Val extends EmailFilterModel>
    implements $EmailFilterModelCopyWith<$Res> {
  _$EmailFilterModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of EmailFilterModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? startDate = null,
    Object? endDate = null,
    Object? subjects = null,
    Object? keywords = null,
  }) {
    return _then(_value.copyWith(
      startDate: null == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endDate: null == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      subjects: null == subjects
          ? _value.subjects
          : subjects // ignore: cast_nullable_to_non_nullable
              as List<String>,
      keywords: null == keywords
          ? _value.keywords
          : keywords // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$EmailFilterModelImplCopyWith<$Res>
    implements $EmailFilterModelCopyWith<$Res> {
  factory _$$EmailFilterModelImplCopyWith(_$EmailFilterModelImpl value,
          $Res Function(_$EmailFilterModelImpl) then) =
      __$$EmailFilterModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {DateTime startDate,
      DateTime endDate,
      List<String> subjects,
      List<String> keywords});
}

/// @nodoc
class __$$EmailFilterModelImplCopyWithImpl<$Res>
    extends _$EmailFilterModelCopyWithImpl<$Res, _$EmailFilterModelImpl>
    implements _$$EmailFilterModelImplCopyWith<$Res> {
  __$$EmailFilterModelImplCopyWithImpl(_$EmailFilterModelImpl _value,
      $Res Function(_$EmailFilterModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of EmailFilterModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? startDate = null,
    Object? endDate = null,
    Object? subjects = null,
    Object? keywords = null,
  }) {
    return _then(_$EmailFilterModelImpl(
      startDate: null == startDate
          ? _value.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      endDate: null == endDate
          ? _value.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as DateTime,
      subjects: null == subjects
          ? _value._subjects
          : subjects // ignore: cast_nullable_to_non_nullable
              as List<String>,
      keywords: null == keywords
          ? _value._keywords
          : keywords // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EmailFilterModelImpl implements _EmailFilterModel {
  const _$EmailFilterModelImpl(
      {required this.startDate,
      required this.endDate,
      final List<String> subjects = const ['Medium Daily Digest'],
      final List<String> keywords = const ['flutter']})
      : _subjects = subjects,
        _keywords = keywords;

  factory _$EmailFilterModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$EmailFilterModelImplFromJson(json);

  @override
  final DateTime startDate;
  @override
  final DateTime endDate;
  final List<String> _subjects;
  @override
  @JsonKey()
  List<String> get subjects {
    if (_subjects is EqualUnmodifiableListView) return _subjects;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_subjects);
  }

  final List<String> _keywords;
  @override
  @JsonKey()
  List<String> get keywords {
    if (_keywords is EqualUnmodifiableListView) return _keywords;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_keywords);
  }

  @override
  String toString() {
    return 'EmailFilterModel(startDate: $startDate, endDate: $endDate, subjects: $subjects, keywords: $keywords)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EmailFilterModelImpl &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            const DeepCollectionEquality().equals(other._subjects, _subjects) &&
            const DeepCollectionEquality().equals(other._keywords, _keywords));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      startDate,
      endDate,
      const DeepCollectionEquality().hash(_subjects),
      const DeepCollectionEquality().hash(_keywords));

  /// Create a copy of EmailFilterModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EmailFilterModelImplCopyWith<_$EmailFilterModelImpl> get copyWith =>
      __$$EmailFilterModelImplCopyWithImpl<_$EmailFilterModelImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EmailFilterModelImplToJson(
      this,
    );
  }
}

abstract class _EmailFilterModel implements EmailFilterModel {
  const factory _EmailFilterModel(
      {required final DateTime startDate,
      required final DateTime endDate,
      final List<String> subjects,
      final List<String> keywords}) = _$EmailFilterModelImpl;

  factory _EmailFilterModel.fromJson(Map<String, dynamic> json) =
      _$EmailFilterModelImpl.fromJson;

  @override
  DateTime get startDate;
  @override
  DateTime get endDate;
  @override
  List<String> get subjects;
  @override
  List<String> get keywords;

  /// Create a copy of EmailFilterModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EmailFilterModelImplCopyWith<_$EmailFilterModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
