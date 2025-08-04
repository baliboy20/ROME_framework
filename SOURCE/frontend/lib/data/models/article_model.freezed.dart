// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'article_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

ArticleModel _$ArticleModelFromJson(Map<String, dynamic> json) {
  return _ArticleModel.fromJson(json);
}

/// @nodoc
mixin _$ArticleModel {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get url => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  String? get rawHtml => throw _privateConstructorUsedError;
  String get filePath => throw _privateConstructorUsedError;
  int get wordCount => throw _privateConstructorUsedError;
  String get readingTime => throw _privateConstructorUsedError;
  String get emailDate => throw _privateConstructorUsedError;
  String get scrapedAt => throw _privateConstructorUsedError;
  String get lastUpdated => throw _privateConstructorUsedError;
  String get category => throw _privateConstructorUsedError;
  List<String> get keywords => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  Map<String, dynamic>? get author => throw _privateConstructorUsedError;
  Map<String, dynamic> get sourceEmail => throw _privateConstructorUsedError;
  String? get urlHash => throw _privateConstructorUsedError;

  /// Serializes this ArticleModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ArticleModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ArticleModelCopyWith<ArticleModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ArticleModelCopyWith<$Res> {
  factory $ArticleModelCopyWith(
          ArticleModel value, $Res Function(ArticleModel) then) =
      _$ArticleModelCopyWithImpl<$Res, ArticleModel>;
  @useResult
  $Res call(
      {String id,
      String title,
      String url,
      String content,
      String? rawHtml,
      String filePath,
      int wordCount,
      String readingTime,
      String emailDate,
      String scrapedAt,
      String lastUpdated,
      String category,
      List<String> keywords,
      List<String> tags,
      String status,
      Map<String, dynamic>? author,
      Map<String, dynamic> sourceEmail,
      String? urlHash});
}

/// @nodoc
class _$ArticleModelCopyWithImpl<$Res, $Val extends ArticleModel>
    implements $ArticleModelCopyWith<$Res> {
  _$ArticleModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ArticleModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? url = null,
    Object? content = null,
    Object? rawHtml = freezed,
    Object? filePath = null,
    Object? wordCount = null,
    Object? readingTime = null,
    Object? emailDate = null,
    Object? scrapedAt = null,
    Object? lastUpdated = null,
    Object? category = null,
    Object? keywords = null,
    Object? tags = null,
    Object? status = null,
    Object? author = freezed,
    Object? sourceEmail = null,
    Object? urlHash = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      rawHtml: freezed == rawHtml
          ? _value.rawHtml
          : rawHtml // ignore: cast_nullable_to_non_nullable
              as String?,
      filePath: null == filePath
          ? _value.filePath
          : filePath // ignore: cast_nullable_to_non_nullable
              as String,
      wordCount: null == wordCount
          ? _value.wordCount
          : wordCount // ignore: cast_nullable_to_non_nullable
              as int,
      readingTime: null == readingTime
          ? _value.readingTime
          : readingTime // ignore: cast_nullable_to_non_nullable
              as String,
      emailDate: null == emailDate
          ? _value.emailDate
          : emailDate // ignore: cast_nullable_to_non_nullable
              as String,
      scrapedAt: null == scrapedAt
          ? _value.scrapedAt
          : scrapedAt // ignore: cast_nullable_to_non_nullable
              as String,
      lastUpdated: null == lastUpdated
          ? _value.lastUpdated
          : lastUpdated // ignore: cast_nullable_to_non_nullable
              as String,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      keywords: null == keywords
          ? _value.keywords
          : keywords // ignore: cast_nullable_to_non_nullable
              as List<String>,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      author: freezed == author
          ? _value.author
          : author // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      sourceEmail: null == sourceEmail
          ? _value.sourceEmail
          : sourceEmail // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      urlHash: freezed == urlHash
          ? _value.urlHash
          : urlHash // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ArticleModelImplCopyWith<$Res>
    implements $ArticleModelCopyWith<$Res> {
  factory _$$ArticleModelImplCopyWith(
          _$ArticleModelImpl value, $Res Function(_$ArticleModelImpl) then) =
      __$$ArticleModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String url,
      String content,
      String? rawHtml,
      String filePath,
      int wordCount,
      String readingTime,
      String emailDate,
      String scrapedAt,
      String lastUpdated,
      String category,
      List<String> keywords,
      List<String> tags,
      String status,
      Map<String, dynamic>? author,
      Map<String, dynamic> sourceEmail,
      String? urlHash});
}

/// @nodoc
class __$$ArticleModelImplCopyWithImpl<$Res>
    extends _$ArticleModelCopyWithImpl<$Res, _$ArticleModelImpl>
    implements _$$ArticleModelImplCopyWith<$Res> {
  __$$ArticleModelImplCopyWithImpl(
      _$ArticleModelImpl _value, $Res Function(_$ArticleModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of ArticleModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? url = null,
    Object? content = null,
    Object? rawHtml = freezed,
    Object? filePath = null,
    Object? wordCount = null,
    Object? readingTime = null,
    Object? emailDate = null,
    Object? scrapedAt = null,
    Object? lastUpdated = null,
    Object? category = null,
    Object? keywords = null,
    Object? tags = null,
    Object? status = null,
    Object? author = freezed,
    Object? sourceEmail = null,
    Object? urlHash = freezed,
  }) {
    return _then(_$ArticleModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      url: null == url
          ? _value.url
          : url // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      rawHtml: freezed == rawHtml
          ? _value.rawHtml
          : rawHtml // ignore: cast_nullable_to_non_nullable
              as String?,
      filePath: null == filePath
          ? _value.filePath
          : filePath // ignore: cast_nullable_to_non_nullable
              as String,
      wordCount: null == wordCount
          ? _value.wordCount
          : wordCount // ignore: cast_nullable_to_non_nullable
              as int,
      readingTime: null == readingTime
          ? _value.readingTime
          : readingTime // ignore: cast_nullable_to_non_nullable
              as String,
      emailDate: null == emailDate
          ? _value.emailDate
          : emailDate // ignore: cast_nullable_to_non_nullable
              as String,
      scrapedAt: null == scrapedAt
          ? _value.scrapedAt
          : scrapedAt // ignore: cast_nullable_to_non_nullable
              as String,
      lastUpdated: null == lastUpdated
          ? _value.lastUpdated
          : lastUpdated // ignore: cast_nullable_to_non_nullable
              as String,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      keywords: null == keywords
          ? _value._keywords
          : keywords // ignore: cast_nullable_to_non_nullable
              as List<String>,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      author: freezed == author
          ? _value._author
          : author // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
      sourceEmail: null == sourceEmail
          ? _value._sourceEmail
          : sourceEmail // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      urlHash: freezed == urlHash
          ? _value.urlHash
          : urlHash // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ArticleModelImpl implements _ArticleModel {
  const _$ArticleModelImpl(
      {required this.id,
      required this.title,
      required this.url,
      required this.content,
      this.rawHtml,
      required this.filePath,
      required this.wordCount,
      required this.readingTime,
      required this.emailDate,
      required this.scrapedAt,
      required this.lastUpdated,
      required this.category,
      required final List<String> keywords,
      required final List<String> tags,
      required this.status,
      final Map<String, dynamic>? author,
      required final Map<String, dynamic> sourceEmail,
      this.urlHash})
      : _keywords = keywords,
        _tags = tags,
        _author = author,
        _sourceEmail = sourceEmail;

  factory _$ArticleModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$ArticleModelImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String url;
  @override
  final String content;
  @override
  final String? rawHtml;
  @override
  final String filePath;
  @override
  final int wordCount;
  @override
  final String readingTime;
  @override
  final String emailDate;
  @override
  final String scrapedAt;
  @override
  final String lastUpdated;
  @override
  final String category;
  final List<String> _keywords;
  @override
  List<String> get keywords {
    if (_keywords is EqualUnmodifiableListView) return _keywords;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_keywords);
  }

  final List<String> _tags;
  @override
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  final String status;
  final Map<String, dynamic>? _author;
  @override
  Map<String, dynamic>? get author {
    final value = _author;
    if (value == null) return null;
    if (_author is EqualUnmodifiableMapView) return _author;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final Map<String, dynamic> _sourceEmail;
  @override
  Map<String, dynamic> get sourceEmail {
    if (_sourceEmail is EqualUnmodifiableMapView) return _sourceEmail;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_sourceEmail);
  }

  @override
  final String? urlHash;

  @override
  String toString() {
    return 'ArticleModel(id: $id, title: $title, url: $url, content: $content, rawHtml: $rawHtml, filePath: $filePath, wordCount: $wordCount, readingTime: $readingTime, emailDate: $emailDate, scrapedAt: $scrapedAt, lastUpdated: $lastUpdated, category: $category, keywords: $keywords, tags: $tags, status: $status, author: $author, sourceEmail: $sourceEmail, urlHash: $urlHash)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ArticleModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.content, content) || other.content == content) &&
            (identical(other.rawHtml, rawHtml) || other.rawHtml == rawHtml) &&
            (identical(other.filePath, filePath) ||
                other.filePath == filePath) &&
            (identical(other.wordCount, wordCount) ||
                other.wordCount == wordCount) &&
            (identical(other.readingTime, readingTime) ||
                other.readingTime == readingTime) &&
            (identical(other.emailDate, emailDate) ||
                other.emailDate == emailDate) &&
            (identical(other.scrapedAt, scrapedAt) ||
                other.scrapedAt == scrapedAt) &&
            (identical(other.lastUpdated, lastUpdated) ||
                other.lastUpdated == lastUpdated) &&
            (identical(other.category, category) ||
                other.category == category) &&
            const DeepCollectionEquality().equals(other._keywords, _keywords) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.status, status) || other.status == status) &&
            const DeepCollectionEquality().equals(other._author, _author) &&
            const DeepCollectionEquality()
                .equals(other._sourceEmail, _sourceEmail) &&
            (identical(other.urlHash, urlHash) || other.urlHash == urlHash));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      url,
      content,
      rawHtml,
      filePath,
      wordCount,
      readingTime,
      emailDate,
      scrapedAt,
      lastUpdated,
      category,
      const DeepCollectionEquality().hash(_keywords),
      const DeepCollectionEquality().hash(_tags),
      status,
      const DeepCollectionEquality().hash(_author),
      const DeepCollectionEquality().hash(_sourceEmail),
      urlHash);

  /// Create a copy of ArticleModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ArticleModelImplCopyWith<_$ArticleModelImpl> get copyWith =>
      __$$ArticleModelImplCopyWithImpl<_$ArticleModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ArticleModelImplToJson(
      this,
    );
  }
}

abstract class _ArticleModel implements ArticleModel {
  const factory _ArticleModel(
      {required final String id,
      required final String title,
      required final String url,
      required final String content,
      final String? rawHtml,
      required final String filePath,
      required final int wordCount,
      required final String readingTime,
      required final String emailDate,
      required final String scrapedAt,
      required final String lastUpdated,
      required final String category,
      required final List<String> keywords,
      required final List<String> tags,
      required final String status,
      final Map<String, dynamic>? author,
      required final Map<String, dynamic> sourceEmail,
      final String? urlHash}) = _$ArticleModelImpl;

  factory _ArticleModel.fromJson(Map<String, dynamic> json) =
      _$ArticleModelImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get url;
  @override
  String get content;
  @override
  String? get rawHtml;
  @override
  String get filePath;
  @override
  int get wordCount;
  @override
  String get readingTime;
  @override
  String get emailDate;
  @override
  String get scrapedAt;
  @override
  String get lastUpdated;
  @override
  String get category;
  @override
  List<String> get keywords;
  @override
  List<String> get tags;
  @override
  String get status;
  @override
  Map<String, dynamic>? get author;
  @override
  Map<String, dynamic> get sourceEmail;
  @override
  String? get urlHash;

  /// Create a copy of ArticleModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ArticleModelImplCopyWith<_$ArticleModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
