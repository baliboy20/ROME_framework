import '../../../../core/utils/json_verification_service.dart';
import '../../domain/entities/blog.dart';
import '../../domain/repositories/blog_repository.dart';

/// Data model for Blog with JSON serialization
/// Handles conversion between JSON and domain entities
class BlogModel {
  const BlogModel({
    required this.id,
    required this.title,
    required this.content,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.publishedAt,
    this.authorId,
    this.projectId,
    this.taskId,
    this.summary,
    this.tags = const [],
    this.attachments = const [],
    this.readTime,
  });

  final String id;
  final String title;
  final String content;
  final String status; // String representation for JSON
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? publishedAt;
  final String? authorId;
  final String? projectId;
  final String? taskId;
  final String? summary;
  final List<String> tags;
  final List<String> attachments;
  final int? readTime;

  /// Convert from JSON using JsonVerificationService
  factory BlogModel.fromJson(Map<String, dynamic> json) {
    try {
      // Verify required fields
      JsonVerificationService.verifyRequiredFields(
        json,
        {
          'id': String,
          'title': String,
          'content': String,
          'status': String,
          'createdAt': String,
          'updatedAt': String,
        },
        objectName: 'BlogModel',
      );

      // Verify optional fields
      JsonVerificationService.verifyOptionalFields(
        json,
        {
          'publishedAt': String,
          'authorId': String,
          'projectId': String,
          'taskId': String,
          'summary': String,
          'tags': List<dynamic>,
          'attachments': List<dynamic>,
          'readTime': int,
        },
        objectName: 'BlogModel',
      );

      return BlogModel(
        id: JsonVerificationService.getRequiredField<String>(json, 'id'),
        title: JsonVerificationService.getRequiredField<String>(json, 'title'),
        content: JsonVerificationService.getRequiredField<String>(json, 'content'),
        status: JsonVerificationService.getRequiredField<String>(json, 'status'),
        createdAt: JsonVerificationService.getRequiredDateTime(json, 'createdAt'),
        updatedAt: JsonVerificationService.getRequiredDateTime(json, 'updatedAt'),
        publishedAt: JsonVerificationService.getOptionalDateTime(json, 'publishedAt'),
        authorId: JsonVerificationService.getOptionalField<String>(json, 'authorId'),
        projectId: JsonVerificationService.getOptionalField<String>(json, 'projectId'),
        taskId: JsonVerificationService.getOptionalField<String>(json, 'taskId'),
        summary: JsonVerificationService.getOptionalField<String>(json, 'summary'),
        tags: JsonVerificationService.getOptionalList<String>(json, 'tags') ?? [],
        attachments: JsonVerificationService.getOptionalList<String>(json, 'attachments') ?? [],
        readTime: JsonVerificationService.getOptionalField<int>(json, 'readTime'),
      );
    } catch (e) {
      throw FormatException('Failed to parse BlogModel from JSON: $e');
    }
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) 'id': id, // Only include ID if it's not empty (for updates)
      'title': title,
      'content': content,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (publishedAt != null) 'publishedAt': publishedAt!.toIso8601String(),
      if (authorId != null) 'authorId': authorId,
      if (projectId != null) 'projectId': projectId,
      if (taskId != null) 'taskId': taskId,
      if (summary != null) 'summary': summary,
      'tags': tags,
      'attachments': attachments,
      if (readTime != null) 'readTime': readTime,
    };
  }

  /// Convert to JSON for creation (excludes server-managed fields)
  Map<String, dynamic> toCreateJson() {
    return {
      'title': title,
      'content': content,
      'draft': status == 'draft', // Backend uses draft boolean field
      if (authorId != null) 'authorId': authorId,
      if (projectId != null) 'projectId': projectId,
      if (taskId != null) 'taskId': taskId,
      if (summary != null) 'summary': summary,
      'tags': tags,
      if (readTime != null) 'readTime': readTime,
    };
  }

  /// Convert to domain entity
  Blog toEntity() {
    return Blog(
      id: id,
      title: title,
      content: content,
      status: BlogStatus.fromString(status),
      createdAt: createdAt,
      updatedAt: updatedAt,
      publishedAt: publishedAt,
      authorId: authorId,
      projectId: projectId,
      taskId: taskId,
      summary: summary,
      tags: tags,
      attachments: attachments,
      readTime: readTime,
    );
  }

  /// Create from domain entity
  factory BlogModel.fromEntity(Blog blog) {
    return BlogModel(
      id: blog.id,
      title: blog.title,
      content: blog.content,
      status: blog.status.name,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      publishedAt: blog.publishedAt,
      authorId: blog.authorId,
      projectId: blog.projectId,
      taskId: blog.taskId,
      summary: blog.summary,
      tags: blog.tags,
      attachments: blog.attachments,
      readTime: blog.readTime,
    );
  }

  /// Create copy with updated fields
  BlogModel copyWith({
    String? id,
    String? title,
    String? content,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? publishedAt,
    String? authorId,
    String? projectId,
    String? taskId,
    String? summary,
    List<String>? tags,
    List<String>? attachments,
    int? readTime,
  }) {
    return BlogModel(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      publishedAt: publishedAt ?? this.publishedAt,
      authorId: authorId ?? this.authorId,
      projectId: projectId ?? this.projectId,
      taskId: taskId ?? this.taskId,
      summary: summary ?? this.summary,
      tags: tags ?? this.tags,
      attachments: attachments ?? this.attachments,
      readTime: readTime ?? this.readTime,
    );
  }

  @override
  String toString() {
    return 'BlogModel(id: $id, title: $title, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BlogModel &&
        other.id == id &&
        other.title == title &&
        other.content == content &&
        other.status == status &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.publishedAt == publishedAt &&
        other.authorId == authorId &&
        other.projectId == projectId &&
        other.taskId == taskId &&
        other.summary == summary &&
        _listEquals(other.tags, tags) &&
        _listEquals(other.attachments, attachments) &&
        other.readTime == readTime;
  }

  @override
  int get hashCode {
    return Object.hash(
      id,
      title,
      content,
      status,
      createdAt,
      updatedAt,
      publishedAt,
      authorId,
      projectId,
      taskId,
      summary,
      Object.hashAll(tags),
      Object.hashAll(attachments),
      readTime,
    );
  }

  /// Helper method to compare lists
  bool _listEquals<T>(List<T> a, List<T> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

/// Blog statistics data model
class BlogStatisticsModel {
  const BlogStatisticsModel({
    required this.totalBlogs,
    required this.publishedBlogs,
    required this.draftBlogs,
    required this.archivedBlogs,
    required this.scheduledBlogs,
    required this.totalWords,
    required this.averageReadTimeMinutes,
    required this.mostUsedTags,
    required this.blogsPerMonth,
  });

  final int totalBlogs;
  final int publishedBlogs;
  final int draftBlogs;
  final int archivedBlogs;
  final int scheduledBlogs;
  final int totalWords;
  final int averageReadTimeMinutes;
  final Map<String, int> mostUsedTags;
  final Map<String, int> blogsPerMonth; // Month -> count

  factory BlogStatisticsModel.fromJson(Map<String, dynamic> json) {
    JsonVerificationService.verifyRequiredFields(
      json,
      {
        'totalBlogs': int,
        'publishedBlogs': int,
        'draftBlogs': int,
        'archivedBlogs': int,
        'scheduledBlogs': int,
        'totalWords': int,
        'averageReadTimeMinutes': int,
        'mostUsedTags': Map<String, dynamic>,
        'blogsPerMonth': Map<String, dynamic>,
      },
      objectName: 'BlogStatisticsModel',
    );

    final mostUsedTagsMap = JsonVerificationService.getRequiredObject(json, 'mostUsedTags');
    final mostUsedTags = <String, int>{};
    for (final entry in mostUsedTagsMap.entries) {
      mostUsedTags[entry.key] = entry.value as int;
    }

    final blogsPerMonthMap = JsonVerificationService.getRequiredObject(json, 'blogsPerMonth');
    final blogsPerMonth = <String, int>{};
    for (final entry in blogsPerMonthMap.entries) {
      blogsPerMonth[entry.key] = entry.value as int;
    }

    return BlogStatisticsModel(
      totalBlogs: JsonVerificationService.getRequiredField<int>(json, 'totalBlogs'),
      publishedBlogs: JsonVerificationService.getRequiredField<int>(json, 'publishedBlogs'),
      draftBlogs: JsonVerificationService.getRequiredField<int>(json, 'draftBlogs'),
      archivedBlogs: JsonVerificationService.getRequiredField<int>(json, 'archivedBlogs'),
      scheduledBlogs: JsonVerificationService.getRequiredField<int>(json, 'scheduledBlogs'),
      totalWords: JsonVerificationService.getRequiredField<int>(json, 'totalWords'),
      averageReadTimeMinutes: JsonVerificationService.getRequiredField<int>(json, 'averageReadTimeMinutes'),
      mostUsedTags: mostUsedTags,
      blogsPerMonth: blogsPerMonth,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalBlogs': totalBlogs,
      'publishedBlogs': publishedBlogs,
      'draftBlogs': draftBlogs,
      'archivedBlogs': archivedBlogs,
      'scheduledBlogs': scheduledBlogs,
      'totalWords': totalWords,
      'averageReadTimeMinutes': averageReadTimeMinutes,
      'mostUsedTags': mostUsedTags,
      'blogsPerMonth': blogsPerMonth,
    };
  }

  BlogStatistics toEntity() {
    return BlogStatistics(
      totalBlogs: totalBlogs,
      publishedBlogs: publishedBlogs,
      draftBlogs: draftBlogs,
      archivedBlogs: archivedBlogs,
      scheduledBlogs: scheduledBlogs,
      totalWords: totalWords,
      averageReadTime: Duration(minutes: averageReadTimeMinutes),
      mostUsedTags: mostUsedTags,
      blogsPerMonth: blogsPerMonth,
    );
  }
}

/// Blog search filters data model
class BlogSearchFiltersModel {
  const BlogSearchFiltersModel({
    this.status,
    this.projectId,
    this.taskId,
    this.authorId,
    this.tags,
    this.dateFrom,
    this.dateTo,
    this.minReadTime,
    this.maxReadTime,
  });

  final String? status;
  final String? projectId;
  final String? taskId;
  final String? authorId;
  final List<String>? tags;
  final DateTime? dateFrom;
  final DateTime? dateTo;
  final int? minReadTime;
  final int? maxReadTime;

  factory BlogSearchFiltersModel.fromJson(Map<String, dynamic> json) {
    return BlogSearchFiltersModel(
      status: JsonVerificationService.getOptionalField<String>(json, 'status'),
      projectId: JsonVerificationService.getOptionalField<String>(json, 'projectId'),
      taskId: JsonVerificationService.getOptionalField<String>(json, 'taskId'),
      authorId: JsonVerificationService.getOptionalField<String>(json, 'authorId'),
      tags: JsonVerificationService.getOptionalList<String>(json, 'tags'),
      dateFrom: JsonVerificationService.getOptionalDateTime(json, 'dateFrom'),
      dateTo: JsonVerificationService.getOptionalDateTime(json, 'dateTo'),
      minReadTime: JsonVerificationService.getOptionalField<int>(json, 'minReadTime'),
      maxReadTime: JsonVerificationService.getOptionalField<int>(json, 'maxReadTime'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (status != null) 'status': status,
      if (projectId != null) 'projectId': projectId,
      if (taskId != null) 'taskId': taskId,
      if (authorId != null) 'authorId': authorId,
      if (tags != null) 'tags': tags,
      if (dateFrom != null) 'dateFrom': dateFrom!.toIso8601String(),
      if (dateTo != null) 'dateTo': dateTo!.toIso8601String(),
      if (minReadTime != null) 'minReadTime': minReadTime,
      if (maxReadTime != null) 'maxReadTime': maxReadTime,
    };
  }

  BlogSearchFilters toEntity() {
    return BlogSearchFilters(
      status: status != null ? BlogStatus.fromString(status!) : null,
      projectId: projectId,
      taskId: taskId,
      authorId: authorId,
      tags: tags,
      dateFrom: dateFrom,
      dateTo: dateTo,
      minReadTime: minReadTime,
      maxReadTime: maxReadTime,
    );
  }

  factory BlogSearchFiltersModel.fromEntity(BlogSearchFilters filters) {
    return BlogSearchFiltersModel(
      status: filters.status?.name,
      projectId: filters.projectId,
      taskId: filters.taskId,
      authorId: filters.authorId,
      tags: filters.tags,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      minReadTime: filters.minReadTime,
      maxReadTime: filters.maxReadTime,
    );
  }
}