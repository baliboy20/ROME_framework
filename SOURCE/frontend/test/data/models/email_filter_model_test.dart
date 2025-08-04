import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/email_filter_model.dart';

void main() {
  group('EmailFilterModel', () {
    final startDate = DateTime(2025, 7, 1);
    final endDate = DateTime(2025, 7, 31);

    final sampleFilterData = {
      'startDate': '2025-07-01T00:00:00.000Z',
      'endDate': '2025-07-31T00:00:00.000Z',
      'subjects': ['Medium Daily Digest'],
      'keywords': ['flutter', 'dart'],
    };

    final sampleFilter = EmailFilterModel(
      startDate: startDate,
      endDate: endDate,
      subjects: ['Medium Daily Digest'],
      keywords: ['flutter', 'dart'],
    );

    test('should create EmailFilterModel from JSON', () {
      final result = EmailFilterModel.fromJson(sampleFilterData);

      expect(result.startDate, equals(startDate));
      expect(result.endDate, equals(endDate));
      expect(result.subjects, equals(['Medium Daily Digest']));
      expect(result.keywords, equals(['flutter', 'dart']));
    });

    test('should convert EmailFilterModel to JSON', () {
      final result = sampleFilter.toJson();

      expect(result['startDate'], equals('2025-07-01T00:00:00.000Z'));
      expect(result['endDate'], equals('2025-07-31T00:00:00.000Z'));
      expect(result['subjects'], equals(['Medium Daily Digest']));
      expect(result['keywords'], equals(['flutter', 'dart']));
    });

    test('should create with default values', () {
      final filter = EmailFilterModel(
        startDate: startDate,
        endDate: endDate,
      );

      expect(filter.subjects, equals(['Medium Daily Digest']));
      expect(filter.keywords, equals(['flutter']));
    });

    test('should support equality comparison', () {
      final filter1 = EmailFilterModel(
        startDate: startDate,
        endDate: endDate,
        subjects: ['Subject 1'],
        keywords: ['keyword1'],
      );

      final filter2 = EmailFilterModel(
        startDate: startDate,
        endDate: endDate,
        subjects: ['Subject 1'],
        keywords: ['keyword1'],
      );

      final filter3 = EmailFilterModel(
        startDate: startDate,
        endDate: endDate,
        subjects: ['Different Subject'],
        keywords: ['keyword1'],
      );

      expect(filter1, equals(filter2));
      expect(filter1, isNot(equals(filter3)));
    });

    test('should support copyWith functionality', () {
      final original = sampleFilter;
      final updated = original.copyWith(
        keywords: ['flutter', 'mobile'],
      );

      expect(updated.keywords, equals(['flutter', 'mobile']));
      expect(updated.startDate, equals(original.startDate));
      expect(updated.endDate, equals(original.endDate));
      expect(updated.subjects, equals(original.subjects));
    });

    test('should handle empty lists', () {
      final filter = EmailFilterModel(
        startDate: startDate,
        endDate: endDate,
        subjects: [],
        keywords: [],
      );

      expect(filter.subjects, isEmpty);
      expect(filter.keywords, isEmpty);
    });
  });
}