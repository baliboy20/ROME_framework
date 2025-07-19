import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:frontend/domain/entities/text_result.dart';
import 'package:frontend/domain/repositories/text_repository.dart';
import 'package:frontend/presentation/blocs/text_bloc/text_bloc.dart';
import 'package:frontend/presentation/blocs/text_bloc/text_event.dart';
import 'package:frontend/presentation/blocs/text_bloc/text_state.dart';

class MockTextRepository extends Mock implements TextRepository {}

void main() {
  group('TextBloc', () {
    late TextRepository textRepository;
    late TextBloc textBloc;

    setUp(() {
      textRepository = MockTextRepository();
      textBloc = TextBloc(textRepository: textRepository);
    });

    tearDown(() {
      textBloc.close();
    });

    test('initial state is TextInitial', () {
      expect(textBloc.state, const TextInitial());
    });

    group('TextChanged', () {
      blocTest<TextBloc, TextState>(
        'emits TextInitial with empty input when text is empty',
        build: () => textBloc,
        act: (bloc) => bloc.add(const TextChanged('')),
        expect: () => [
          const TextInitial(
            results: [],
            isInputEmpty: true,
            characterCount: 0,
          ),
        ],
      );

      blocTest<TextBloc, TextState>(
        'emits TextInitial with non-empty input when text is valid',
        build: () => textBloc,
        act: (bloc) => bloc.add(const TextChanged('hello')),
        expect: () => [
          const TextInitial(
            results: [],
            isInputEmpty: false,
            characterCount: 5,
          ),
        ],
      );

      blocTest<TextBloc, TextState>(
        'emits TextValidation when text exceeds 100 characters',
        build: () => textBloc,
        act: (bloc) => bloc.add(TextChanged('a' * 101)),
        expect: () => [
          TextValidation(
            validationMessage: 'Text must be 100 characters or less',
            results: const [],
            characterCount: 101,
          ),
        ],
      );
    });

    group('TextSubmitted', () {
      blocTest<TextBloc, TextState>(
        'emits TextValidation when text is empty',
        build: () => textBloc,
        act: (bloc) => bloc.add(const TextSubmitted('')),
        expect: () => [
          const TextValidation(
            validationMessage: 'Please enter some text',
            results: [],
            characterCount: 0,
          ),
        ],
      );

      blocTest<TextBloc, TextState>(
        'emits TextValidation when text exceeds 100 characters',
        build: () => textBloc,
        act: (bloc) => bloc.add(TextSubmitted('a' * 101)),
        expect: () => [
          TextValidation(
            validationMessage: 'Text must be 100 characters or less',
            results: const [],
            characterCount: 101,
          ),
        ],
      );

      blocTest<TextBloc, TextState>(
        'emits TextLoading then TextSuccess when text is reversed successfully',
        build: () => textBloc,
        setUp: () {
          when(() => textRepository.reverseText('hello'))
              .thenAnswer((_) async => 'olleh');
        },
        act: (bloc) => bloc.add(const TextSubmitted('hello')),
        expect: () => [
          isA<TextLoading>(),
          isA<TextSuccess>().having(
            (state) => state.results.length,
            'results length',
            1,
          ).having(
            (state) => state.results.first.originalText,
            'original text',
            'hello',
          ).having(
            (state) => state.results.first.reversedText,
            'reversed text',
            'olleh',
          ),
        ],
      );

      blocTest<TextBloc, TextState>(
        'emits TextLoading then TextFailure when repository throws exception',
        build: () => textBloc,
        setUp: () {
          when(() => textRepository.reverseText('hello'))
              .thenThrow(Exception('Network error'));
        },
        act: (bloc) => bloc.add(const TextSubmitted('hello')),
        expect: () => [
          isA<TextLoading>(),
          isA<TextFailure>().having(
            (state) => state.errorMessage,
            'error message',
            'Network error',
          ),
        ],
      );

    });
  });
}