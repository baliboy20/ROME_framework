import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_editor/bloc/auth/auth_cubit.dart';
import 'package:fob_webapp_editor/bloc/content/content_cubit.dart';
import 'package:fob_webapp_editor/core/api_client.dart';
import 'package:fob_webapp_editor/models/content_item.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

const _fixturePw = 'pw'; // test fixture, not a credential

ContentItem _completeItem({String id = 'c1', bool published = false}) {
  return ContentItem(
    tourId: id,
    path: '/tours/$id',
    title: 'Hidden City Tour',
    published: published,
    description: 'A ninety minute guided ride through the hidden alleys.',
  );
}

ContentItem _incompleteItem({String id = 'c2'}) {
  return ContentItem(
    tourId: id,
    path: '/tours/$id',
    title: 'Hidden Gem',
    published: false,
    // No description -> incomplete under the client-side SEO gate.
    description: '',
  );
}

void main() {
  group('ContentItem.isComplete (client-side SEO gate)', () {
    test('page with title + description is complete', () {
      expect(_completeItem().isComplete, isTrue);
      expect(_completeItem().incompleteReasons, isEmpty);
    });

    test('empty description is flagged', () {
      final item = _incompleteItem();
      expect(item.isComplete, isFalse);
      expect(item.incompleteReasons.any((r) => r.contains('Description')), isTrue);
    });
  });

  group('ContentSnapshot.fromJson (object, not list)', () {
    test('parses pages and quality arrays', () {
      final snapshot = ContentSnapshot.fromJson({
        'pages': [
          {'tour_id': 't1', 'path': '/a', 'title': 'A', 'published': true},
        ],
        'quality': [
          {'title': 'Missing image', 'detail': 'Tour A has no image'},
        ],
      });
      expect(snapshot.pages, hasLength(1));
      expect(snapshot.pages.first.tourId, 't1');
      expect(snapshot.pages.first.published, isTrue);
      expect(snapshot.quality, hasLength(1));
      expect(snapshot.quality.first.title, 'Missing image');
    });
  });

  group('ContentCubit.publishAll (owner-only, POSTs /publish)', () {
    test('refuses when not owner, without calling the API', () async {
      var publishCalled = false;
      final api = ApiClient(
        baseUrl: 'https://api.test',
        httpClient: MockClient((req) async {
          if (req.url.path == '/publish') publishCalled = true;
          return http.Response('{}', 200);
        }),
      );
      final auth = AuthCubit(api);
      final content = ContentCubit(api, auth);

      await content.publishAll();

      expect(publishCalled, isFalse);
      expect(content.state.lastPublishError,
          'Only the owner may publish content.');
      auth.close();
      content.close();
    });

    test('owner publish POSTs {tours:[...]} and records the result', () async {
      Map<String, dynamic>? sentBody;
      final api = ApiClient(
        baseUrl: 'https://api.test',
        httpClient: MockClient((req) async {
          if (req.url.path == '/publish') {
            sentBody = jsonDecode(req.body) as Map<String, dynamic>;
            return http.Response(
                jsonEncode({
                  'publishedCount': 1,
                  'flaggedIncomplete': 0,
                  'sitemapUrls': ['https://site/a'],
                }),
                200);
          }
          if (req.url.path == '/admin/content') {
            return http.Response(
                jsonEncode({
                  'pages': [
                    {
                      'tour_id': 'c1',
                      'path': '/tours/c1',
                      'title': 'Hidden City Tour',
                      'published': false,
                    }
                  ],
                  'quality': [],
                }),
                200);
          }
          return http.Response('{"token":"t"}', 200);
        }),
      );
      final auth = AuthCubit(api);
      final content = ContentCubit(api, auth);
      await auth.login(email: 'owner@fob.test', password: _fixturePw);
      await content.loadContent();
      content.stageEdit('c1', description: 'A lovely guided ride.');

      await content.publishAll();

      expect(sentBody, isNotNull);
      final tours = sentBody!['tours'] as List;
      expect(tours, hasLength(1));
      final tour = tours.first as Map<String, dynamic>;
      expect(tour['id'], 'c1');
      expect(tour['name'], 'Hidden City Tour');
      expect(tour['description'], 'A lovely guided ride.');
      expect(tour['urlPath'], '/tours/c1');
      expect(tour['locale'], 'en');
      expect(tour['schemaOrgType'], 'TouristAttraction');

      expect(content.state.lastPublishResult?.publishedCount, 1);
      expect(content.state.lastPublishError, isNull);
      auth.close();
      content.close();
    });
  });
}
