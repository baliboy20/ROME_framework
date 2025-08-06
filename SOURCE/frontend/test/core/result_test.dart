import 'package:flutter_test/flutter_test.dart';
import '../lib/core/utils/result.dart';
import '../lib/core/errors/failures.dart';

void main() {
  group('Result', () {
    group('Success', () {
      test('should create success result', () {
        const data = 'test data';
        final result = Result.success(data);

        expect(result.isSuccess, isTrue);
        expect(result.isFailure, isFalse);
        expect(result.data, equals(data));
      });

      test('should handle success operations', () {
        final result = Result.success(5);

        expect(result.getOrElse(0), equals(5));
        expect(result.getOrNull(), equals(5));
      });
    });

    group('Error', () {
      test('should create error result', () {
        const failure = NetworkFailure('Network error');
        final result = Result<String>.failure(failure);

        expect(result.isSuccess, isFalse);
        expect(result.isFailure, isTrue);
        expect(result.failure, equals(failure));
      });

      test('should handle error operations', () {
        const failure = NetworkFailure('Network error');
        final result = Result<int>.failure(failure);

        expect(result.getOrElse(10), equals(10));
        expect(result.getOrNull(), isNull);
      });

      test('should throw when accessing data on error', () {
        const failure = NetworkFailure('Network error');
        final result = Result<String>.failure(failure);

        expect(() => result.data, throwsStateError);
      });

      test('should throw when accessing failure on success', () {
        final result = Result.success('data');

        expect(() => result.failure, throwsStateError);
      });
    });

    group('map', () {
      test('should transform success value', () {
        final result = Result.success(5);
        final mapped = result.map((value) => value * 2);

        expect(mapped.isSuccess, isTrue);
        expect(mapped.data, equals(10));
      });

      test('should preserve failure in map', () {
        const failure = NetworkFailure('Network error');
        final result = Result<int>.failure(failure);
        final mapped = result.map((value) => value * 2);

        expect(mapped.isFailure, isTrue);
        expect(mapped.failure, equals(failure));
      });

      test('should handle exceptions in map transform', () {
        final result = Result.success(5);
        final mapped = result.map<int>((value) => throw Exception('Transform error'));

        expect(mapped.isFailure, isTrue);
        expect(mapped.failure, isA<UnexpectedFailure>());
      });
    });

    group('flatMap', () {
      test('should chain successful operations', () {
        final result = Result.success(5);
        final chained = result.flatMap((value) => Result.success(value * 2));

        expect(chained.isSuccess, isTrue);
        expect(chained.data, equals(10));
      });

      test('should chain with failure', () {
        final result = Result.success(5);
        const failure = ValidationFailure('Invalid value');
        final chained = result.flatMap<int>((value) => Result.failure(failure));

        expect(chained.isFailure, isTrue);
        expect(chained.failure, equals(failure));
      });

      test('should preserve original failure', () {
        const failure = NetworkFailure('Network error');
        final result = Result<int>.failure(failure);
        final chained = result.flatMap((value) => Result.success(value * 2));

        expect(chained.isFailure, isTrue);
        expect(chained.failure, equals(failure));
      });

      test('should handle exceptions in flatMap transform', () {
        final result = Result.success(5);
        final chained = result.flatMap<int>((value) => throw Exception('Transform error'));

        expect(chained.isFailure, isTrue);
        expect(chained.failure, isA<UnexpectedFailure>());
      });
    });

    group('fold', () {
      test('should handle success case', () {
        final result = Result.success(42);
        final folded = result.fold(
          (failure) => 'Error: ${failure.message}',
          (data) => 'Success: $data',
        );

        expect(folded, equals('Success: 42'));
      });

      test('should handle failure case', () {
        const failure = NetworkFailure('Connection failed');
        final result = Result<int>.failure(failure);
        final folded = result.fold(
          (failure) => 'Error: ${failure.message}',
          (data) => 'Success: $data',
        );

        expect(folded, equals('Error: Connection failed'));
      });
    });

    group('Equality', () {
      test('should compare Success results correctly', () {
        final result1 = Result.success(5);
        final result2 = Result.success(5);
        final result3 = Result.success(10);

        expect(result1, equals(result2));
        expect(result1, isNot(equals(result3)));
      });

      test('should compare Error results correctly', () {
        const failure1 = NetworkFailure('Error');
        const failure2 = NetworkFailure('Error');
        const failure3 = ValidationFailure('Different error');

        final result1 = Result<int>.failure(failure1);
        final result2 = Result<int>.failure(failure2);
        final result3 = Result<int>.failure(failure3);

        expect(result1, equals(result2));
        expect(result1, isNot(equals(result3)));
      });

      test('should not equal Success and Error', () {
        final success = Result.success(5);
        final error = Result<int>.failure(const NetworkFailure('Error'));

        expect(success, isNot(equals(error)));
      });
    });

    group('Extensions', () {
      test('should convert nullable to Result', () {
        const failure = ValidationFailure('Value is null');
        
        final nullResult = null.toResult(failure);
        final valueResult = 'test'.toResult(failure);

        expect(nullResult.isFailure, isTrue);
        expect(nullResult.failure, equals(failure));
        
        expect(valueResult.isSuccess, isTrue);
        expect(valueResult.data, equals('test'));
      });

      test('should convert Future to Result', () async {
        final successFuture = Future.value(42);
        final errorFuture = Future<int>.error(Exception('Test error'));

        final successResult = await successFuture.toResult();
        final errorResult = await errorFuture.toResult();

        expect(successResult.isSuccess, isTrue);
        expect(successResult.data, equals(42));

        expect(errorResult.isFailure, isTrue);
        expect(errorResult.failure, isA<UnexpectedFailure>());
      });
    });

    group('Complex Scenarios', () {
      test('should handle chaining multiple operations', () {
        final result = Result.success(10)
            .map((value) => value / 2)
            .flatMap((value) => Result.success(value.toInt()))
            .map((value) => 'Result: $value');

        expect(result.isSuccess, isTrue);
        expect(result.data, equals('Result: 5'));
      });

      test('should short-circuit on first failure', () {
        const failure = ValidationFailure('Invalid input');
        final result = Result<int>.failure(failure)
            .map((value) => value * 2)
            .flatMap((value) => Result.success(value + 1))
            .map((value) => 'Final: $value');

        expect(result.isFailure, isTrue);
        expect(result.failure, equals(failure));
      });

      test('should handle mixed success and failure scenarios', () {
        final results = [
          Result.success(1),
          Result.success(2),
          Result<int>.failure(const NetworkFailure('Error')),
          Result.success(4),
        ];

        final successes = results.where((r) => r.isSuccess).map((r) => r.data).toList();
        final failures = results.where((r) => r.isFailure).map((r) => r.failure).toList();

        expect(successes, equals([1, 2, 4]));
        expect(failures, hasLength(1));
        expect(failures.first, isA<NetworkFailure>());
      });
    });
  });
}