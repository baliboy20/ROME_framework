/// A single publishable tour page as returned by `GET /admin/content`
/// (the `pages` array). The worker has no content store, so `description`
/// is a LOCAL-ONLY field — it is staged in the editor and folded into the
/// `POST /publish` payload; it is never persisted server-side.
class ContentItem {
  final String tourId;
  final String path;
  final String title;
  final bool published;

  /// Local-only edited description. Defaults to '' because the worker does
  /// not store or return descriptions. Held in cubit state, sent on publish.
  final String description;

  const ContentItem({
    required this.tourId,
    required this.path,
    required this.title,
    required this.published,
    this.description = '',
  });

  /// Client-side SEO completeness gate: a page is publishable when it has a
  /// non-empty title and a non-empty (locally edited) description.
  bool get isComplete => title.trim().isNotEmpty && description.trim().isNotEmpty;

  List<String> get incompleteReasons {
    final reasons = <String>[];
    if (title.trim().isEmpty) {
      reasons.add('Title is missing');
    }
    if (description.trim().isEmpty) {
      reasons.add('Description is empty (staged locally for publish)');
    }
    return reasons;
  }

  ContentItem copyWith({
    String? path,
    String? title,
    bool? published,
    String? description,
  }) {
    return ContentItem(
      tourId: tourId,
      path: path ?? this.path,
      title: title ?? this.title,
      published: published ?? this.published,
      description: description ?? this.description,
    );
  }

  /// Reads the worker's `pages[]` shape: {tour_id, path, title, published}.
  factory ContentItem.fromJson(Map<String, dynamic> json) {
    return ContentItem(
      tourId: (json['tour_id'] ?? json['tourId'] ?? '').toString(),
      path: (json['path'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      published: (json['published'] ?? false) as bool,
      description: (json['description'] ?? '').toString(),
    );
  }
}

/// A quality/SEO advisory item from `GET /admin/content` (the `quality`
/// array): {title, detail}.
class QualityItem {
  final String title;
  final String detail;

  const QualityItem({required this.title, required this.detail});

  factory QualityItem.fromJson(Map<String, dynamic> json) {
    return QualityItem(
      title: (json['title'] ?? '').toString(),
      detail: (json['detail'] ?? '').toString(),
    );
  }
}

/// Typed result of `GET /admin/content` — an OBJECT with `pages` and
/// `quality` arrays (NOT a bare list).
class ContentSnapshot {
  final List<ContentItem> pages;
  final List<QualityItem> quality;

  const ContentSnapshot({this.pages = const [], this.quality = const []});

  factory ContentSnapshot.fromJson(Map<String, dynamic> json) {
    final rawPages = (json['pages'] as List?) ?? const [];
    final rawQuality = (json['quality'] as List?) ?? const [];
    return ContentSnapshot(
      pages: rawPages
          .map((e) => ContentItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      quality: rawQuality
          .map((e) => QualityItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Result of `POST /publish`.
class PublishResult {
  final int publishedCount;
  final int flaggedIncomplete;
  final List<String> sitemapUrls;

  const PublishResult({
    required this.publishedCount,
    required this.flaggedIncomplete,
    required this.sitemapUrls,
  });

  factory PublishResult.fromJson(Map<String, dynamic> json) {
    return PublishResult(
      publishedCount: (json['publishedCount'] ?? 0) as int,
      flaggedIncomplete: (json['flaggedIncomplete'] ?? 0) as int,
      sitemapUrls: ((json['sitemapUrls'] as List?) ?? const [])
          .map((e) => e.toString())
          .toList(),
    );
  }
}
