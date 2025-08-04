// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'article_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ArticleModelImpl _$$ArticleModelImplFromJson(Map<String, dynamic> json) =>
    _$ArticleModelImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      url: json['url'] as String,
      content: json['content'] as String,
      rawHtml: json['rawHtml'] as String?,
      filePath: json['filePath'] as String,
      wordCount: (json['wordCount'] as num).toInt(),
      readingTime: json['readingTime'] as String,
      emailDate: json['emailDate'] as String,
      scrapedAt: json['scrapedAt'] as String,
      lastUpdated: json['lastUpdated'] as String,
      category: json['category'] as String,
      keywords:
          (json['keywords'] as List<dynamic>).map((e) => e as String).toList(),
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      status: json['status'] as String,
      author: json['author'] as Map<String, dynamic>?,
      sourceEmail: json['sourceEmail'] as Map<String, dynamic>,
      urlHash: json['urlHash'] as String?,
    );

Map<String, dynamic> _$$ArticleModelImplToJson(_$ArticleModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'url': instance.url,
      'content': instance.content,
      'rawHtml': instance.rawHtml,
      'filePath': instance.filePath,
      'wordCount': instance.wordCount,
      'readingTime': instance.readingTime,
      'emailDate': instance.emailDate,
      'scrapedAt': instance.scrapedAt,
      'lastUpdated': instance.lastUpdated,
      'category': instance.category,
      'keywords': instance.keywords,
      'tags': instance.tags,
      'status': instance.status,
      'author': instance.author,
      'sourceEmail': instance.sourceEmail,
      'urlHash': instance.urlHash,
    };
