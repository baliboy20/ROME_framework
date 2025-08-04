import 'package:freezed_annotation/freezed_annotation.dart';

part 'article_model.freezed.dart';
part 'article_model.g.dart';

@freezed
class ArticleModel with _$ArticleModel {
  const factory ArticleModel({
    required String id,
    required String title,
    required String url,
    required String content,
    String? rawHtml,
    required String filePath,
    required int wordCount,
    required String readingTime,
    required String emailDate,
    required String scrapedAt,
    required String lastUpdated,
    required String category,
    required List<String> keywords,
    required List<String> tags,
    required String status,
    Map<String, dynamic>? author,
    required Map<String, dynamic> sourceEmail,
    String? urlHash,
  }) = _ArticleModel;

  factory ArticleModel.fromJson(Map<String, dynamic> json) =>
      _$ArticleModelFromJson(json);
}