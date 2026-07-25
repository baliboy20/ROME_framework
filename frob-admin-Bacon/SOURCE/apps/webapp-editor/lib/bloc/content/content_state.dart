part of 'content_cubit.dart';

enum ContentStatus { initial, loading, loaded, publishing, error }

class ContentState {
  final ContentStatus status;

  /// Pages from `GET /admin/content` (`pages`). `description` is local-only.
  final List<ContentItem> items;

  /// Advisory items from `GET /admin/content` (`quality`).
  final List<QualityItem> quality;

  final String? errorMessage;
  final String? lastPublishError;
  final PublishResult? lastPublishResult;

  const ContentState({
    this.status = ContentStatus.initial,
    this.items = const [],
    this.quality = const [],
    this.errorMessage,
    this.lastPublishError,
    this.lastPublishResult,
  });

  ContentState copyWith({
    ContentStatus? status,
    List<ContentItem>? items,
    List<QualityItem>? quality,
    String? errorMessage,
    String? lastPublishError,
    PublishResult? lastPublishResult,
    bool clearErrors = false,
    bool clearPublishResult = false,
  }) {
    return ContentState(
      status: status ?? this.status,
      items: items ?? this.items,
      quality: quality ?? this.quality,
      errorMessage: clearErrors ? null : errorMessage ?? this.errorMessage,
      lastPublishError:
          clearErrors ? null : lastPublishError ?? this.lastPublishError,
      lastPublishResult: clearPublishResult
          ? null
          : lastPublishResult ?? this.lastPublishResult,
    );
  }
}
