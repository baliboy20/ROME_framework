import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/services/api_service.dart';
import 'package:mocktail/mocktail.dart';

class MockDio extends Mock implements Dio {}

void main() {
  group('ApiService', () {
    late MockDio mockDio;
    late ApiService apiService;

    setUp(() {
      mockDio = MockDio();
      apiService = ApiService(mockDio);
    });

    group('fetchEmails', () {
      test('should extract emails array from response', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'emails': [
              {'id': '1', 'subject': 'Test Email 1'},
              {'id': '2', 'subject': 'Test Email 2'},
            ],
            'total': 2,
            'message': 'Fetched 2 emails successfully',
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/emails/fetch'),
        );

        when(() => mockDio.post(any(), data: any(named: 'data')))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await apiService.fetchEmails({'filter': 'test'});

        // Assert
        expect(result, isA<List<Map<String, dynamic>>>());
        expect(result.length, 2);
        expect(result[0]['id'], '1');
        expect(result[1]['subject'], 'Test Email 2');
      });

      test('should throw exception when response is null', () async {
        // Arrange
        final mockResponse = Response(
          data: null,
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/emails/fetch'),
        );

        when(() => mockDio.post(any(), data: any(named: 'data')))
            .thenAnswer((_) async => mockResponse);

        // Act & Assert
        expect(
          () => apiService.fetchEmails({'filter': 'test'}),
          throwsA(isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Invalid response: null data'),
          )),
        );
      });

      test('should throw exception when emails array is missing', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'total': 0,
            'message': 'No emails found',
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/emails/fetch'),
        );

        when(() => mockDio.post(any(), data: any(named: 'data')))
            .thenAnswer((_) async => mockResponse);

        // Act & Assert
        expect(
          () => apiService.fetchEmails({'filter': 'test'}),
          throwsA(isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Invalid response: missing emails array'),
          )),
        );
      });
    });

    group('getEmails', () {
      test('should extract emails array from response', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'emails': [
              {'id': '1', 'subject': 'Saved Email 1'},
            ],
            'total': 1,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/emails'),
        );

        when(() => mockDio.get(any())).thenAnswer((_) async => mockResponse);

        // Act
        final result = await apiService.getEmails();

        // Assert
        expect(result, isA<List<Map<String, dynamic>>>());
        expect(result.length, 1);
        expect(result[0]['subject'], 'Saved Email 1');
      });
    });

    group('getArticles', () {
      test('should extract articles array from response', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'articles': [
              {'id': '1', 'title': 'Article 1'},
              {'id': '2', 'title': 'Article 2'},
            ],
            'total': 2,
            'pagination': {'limit': 20, 'skip': 0},
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/articles'),
        );

        when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await apiService.getArticles();

        // Assert
        expect(result, isA<List<Map<String, dynamic>>>());
        expect(result.length, 2);
        expect(result[0]['title'], 'Article 1');
        expect(result[1]['title'], 'Article 2');
      });

      test('should handle query parameters correctly', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'articles': [],
            'total': 0,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/articles'),
        );

        when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
            .thenAnswer((_) async => mockResponse);

        // Act
        await apiService.getArticles(
          page: 2,
          limit: 10,
          search: 'flutter',
          status: 'published',
        );

        // Assert
        verify(() => mockDio.get(
          any(),
          queryParameters: {
            'page': 2,
            'limit': 10,
            'search': 'flutter',
            'status': 'published',
          },
        )).called(1);
      });

      test('should throw exception when articles array is missing', () async {
        // Arrange
        final mockResponse = Response(
          data: {
            'success': true,
            'total': 0,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/articles'),
        );

        when(() => mockDio.get(any(), queryParameters: any(named: 'queryParameters')))
            .thenAnswer((_) async => mockResponse);

        // Act & Assert
        expect(
          () => apiService.getArticles(),
          throwsA(isA<Exception>().having(
            (e) => e.toString(),
            'message',
            contains('Invalid response: missing articles array'),
          )),
        );
      });
    });

    group('Single item responses', () {
      test('getEmailById should return single email', () async {
        // Arrange
        final mockResponse = Response(
          data: {'id': '1', 'subject': 'Test Email'},
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/emails/1'),
        );

        when(() => mockDio.get(any())).thenAnswer((_) async => mockResponse);

        // Act
        final result = await apiService.getEmailById('1');

        // Assert
        expect(result, isA<Map<String, dynamic>>());
        expect(result['subject'], 'Test Email');
      });

      test('startBatchScraping should return response data', () async {
        // Arrange
        final mockResponse = Response(
          data: {'jobId': 'job123', 'status': 'started'},
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/scraping/batch'),
        );

        when(() => mockDio.post(any(), data: any(named: 'data')))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await apiService.startBatchScraping({'urls': ['http://example.com']});

        // Assert
        expect(result, isA<Map<String, dynamic>>());
        expect(result['jobId'], 'job123');
      });
    });
  });
}