import 'package:equatable/equatable.dart';

/// Blog entity representing a blog post/journal entry in the domain layer
class Blog extends Equatable {
  const Blog({
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
  final String content; // Markdown content
  final BlogStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? publishedAt;
  final String? authorId;
  final String? projectId; // Optional link to project
  final String? taskId; // Optional link to task
  final String? summary; // Auto-generated or manual summary
  final List<String> tags;
  final List<String> attachments;
  final int? readTime; // Estimated read time in minutes

  /// Create a copy of this blog with some fields replaced
  Blog copyWith({
    String? id,
    String? title,
    String? content,
    BlogStatus? status,
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
    return Blog(
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

  /// Check if blog is published
  bool get isPublished => status == BlogStatus.published;

  /// Check if blog is draft
  bool get isDraft => status == BlogStatus.draft;

  /// Check if blog is archived
  bool get isArchived => status == BlogStatus.archived;

  /// Check if blog is linked to a project
  bool get hasProjectLink => projectId != null;

  /// Check if blog is linked to a task
  bool get hasTaskLink => taskId != null;

  /// Get word count estimate
  int get wordCount {
    return content.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).length;
  }

  /// Get estimated read time (if not provided, calculate from word count)
  int get estimatedReadTime {
    if (readTime != null) return readTime!;
    // Average reading speed: 200 words per minute
    return (wordCount / 200).ceil().clamp(1, double.infinity).toInt();
  }

  /// Get content preview (first 150 characters with ellipsis)
  String get preview {
    if (content.length <= 150) return content;
    return '${content.substring(0, 147)}...';
  }

  /// Get plain text content (strip markdown)
  String get plainTextContent {
    // Basic markdown stripping - in a real app, use a proper markdown parser
    return content
        .replaceAll(RegExp(r'[#*_`~\[\]()]+'), '')
        .replaceAll(RegExp(r'\n+'), ' ')
        .trim();
  }

  @override
  List<Object?> get props => [
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
        tags,
        attachments,
        readTime,
      ];

  @override
  String toString() {
    return 'Blog(id: $id, title: $title, status: $status, wordCount: $wordCount)';
  }
}

/// Enumeration of possible blog statuses
enum BlogStatus {
  draft,
  published,
  archived,
  scheduled;

  /// Display name for the status
  String get displayName {
    switch (this) {
      case BlogStatus.draft:
        return 'Draft';
      case BlogStatus.published:
        return 'Published';
      case BlogStatus.archived:
        return 'Archived';
      case BlogStatus.scheduled:
        return 'Scheduled';
    }
  }

  /// Color representation for UI
  String get colorCode {
    switch (this) {
      case BlogStatus.draft:
        return '#8E8E93'; // Gray
      case BlogStatus.published:
        return '#34C759'; // Green
      case BlogStatus.archived:
        return '#C7C7CC'; // Light Gray
      case BlogStatus.scheduled:
        return '#007AFF'; // Blue
    }
  }

  /// Check if status allows editing
  bool get allowsEditing {
    return this != BlogStatus.archived;
  }

  /// Check if status allows publishing
  bool get allowsPublishing {
    return this == BlogStatus.draft || this == BlogStatus.scheduled;
  }

  /// Parse status from string
  static BlogStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'draft':
        return BlogStatus.draft;
      case 'published':
        return BlogStatus.published;
      case 'archived':
        return BlogStatus.archived;
      case 'scheduled':
        return BlogStatus.scheduled;
      default:
        throw ArgumentError('Unknown blog status: $status');
    }
  }
}

/// Blog entry type for categorization
enum BlogType {
  journal,
  update,
  documentation,
  reflection,
  milestone;

  /// Display name for the type
  String get displayName {
    switch (this) {
      case BlogType.journal:
        return 'Journal Entry';
      case BlogType.update:
        return 'Project Update';
      case BlogType.documentation:
        return 'Documentation';
      case BlogType.reflection:
        return 'Reflection';
      case BlogType.milestone:
        return 'Milestone';
    }
  }

  /// Icon representation for UI
  String get iconName {
    switch (this) {
      case BlogType.journal:
        return 'book.pages';
      case BlogType.update:
        return 'arrow.up.circle';
      case BlogType.documentation:
        return 'doc.text';
      case BlogType.reflection:
        return 'lightbulb';
      case BlogType.milestone:
        return 'flag.checkered';
    }
  }

  /// Parse type from string
  static BlogType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'journal':
        return BlogType.journal;
      case 'update':
        return BlogType.update;
      case 'documentation':
        return BlogType.documentation;
      case 'reflection':
        return BlogType.reflection;
      case 'milestone':
        return BlogType.milestone;
      default:
        throw ArgumentError('Unknown blog type: $type');
    }
  }
}