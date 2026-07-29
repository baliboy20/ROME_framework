import 'package:flutter_bloc/flutter_bloc.dart';

import '../../core/api_client.dart';
import '../../models/content_item.dart';
import '../auth/auth_cubit.dart';

part 'content_state.dart';

/// Publish console. The worker has NO content store: pages come from
/// `GET /admin/content`, edits to title/description are LOCAL ONLY (held
/// here in state) and are folded into the single `POST /publish` payload.
/// Publish is manual per TDR-14 — nothing auto-publishes.
class ContentCubit extends Cubit<ContentState> {
  final ApiClient _api;
  final AuthCubit _auth;

  ContentCubit(this._api, this._auth) : super(const ContentState());

  Future<void> loadContent() async {
    emit(state.copyWith(status: ContentStatus.loading, clearErrors: true));
    try {
      final snapshot = await _api.fetchContent();
      emit(state.copyWith(
        status: ContentStatus.loaded,
        items: snapshot.pages,
        quality: snapshot.quality,
      ));
    } on ApiException catch (e) {
      _handleApiException(e);
    } catch (_) {
      emit(state.copyWith(
          status: ContentStatus.error,
          errorMessage: 'Could not load content.'));
    }
  }

  /// Stage a LOCAL-ONLY edit to a page's title/description. Not persisted
  /// server-side (no content store) — it only affects the publish payload.
  void stageEdit(String tourId, {String? title, String? description}) {
    final items = [
      for (final item in state.items)
        if (item.tourId == tourId)
          item.copyWith(title: title, description: description)
        else
          item,
    ];
    emit(state.copyWith(items: items));
  }

  /// Client-side SEO completeness gate (REQ-SEO01). Note: publishAll still
  /// sends every page — the worker re-validates and reports flagged items.
  bool isPublishable(ContentItem item) => item.isComplete;

  /// POST /publish with all pages. Surfaces success (PublishResult) or error.
  Future<void> publishAll() async {
    if (!_auth.state.isOwner) {
      emit(state.copyWith(
          lastPublishError: 'Only the owner may publish content.'));
      return;
    }
    emit(state.copyWith(
        status: ContentStatus.publishing,
        clearErrors: true,
        clearPublishResult: true));
    try {
      final result = await _api.publish(state.items);
      emit(state.copyWith(
        status: ContentStatus.loaded,
        lastPublishResult: result,
      ));
    } on ApiException catch (e) {
      _handleApiException(e);
    } catch (_) {
      emit(state.copyWith(
          status: ContentStatus.error, errorMessage: 'Publish failed.'));
    }
  }

  void _handleApiException(ApiException e) {
    if (e.isUnauthorized) {
      _auth.sessionExpired();
    }
    emit(state.copyWith(status: ContentStatus.error, errorMessage: e.message));
  }
}
