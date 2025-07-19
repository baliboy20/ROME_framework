import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:frontend/domain/repositories/text_repository.dart';
import 'package:frontend/presentation/blocs/text_bloc/text_bloc.dart';
import 'package:frontend/presentation/pages/home_page.dart';

class MockTextRepository extends Mock implements TextRepository {}

void main() {
  group('HomePage', () {
    late TextRepository textRepository;

    setUp(() {
      textRepository = MockTextRepository();
    });

    Widget createWidgetUnderTest() {
      return MaterialApp(
        home: BlocProvider(
          create: (context) => TextBloc(textRepository: textRepository),
          child: const HomePage(),
        ),
      );
    }

    testWidgets('renders correctly with initial state', (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      expect(find.text('Reverse Text App'), findsOneWidget);
      expect(find.text('Enter text to reverse'), findsOneWidget);
      expect(find.text('Reverse Text'), findsOneWidget);
      expect(find.text('No results yet'), findsOneWidget);
      expect(find.text('0/100'), findsOneWidget);
    });

    testWidgets('shows character count when typing', (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'hello');
      await tester.pump();

      expect(find.text('5/100'), findsOneWidget);
    });

    testWidgets('enables send button when text is entered', (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      final sendButton = find.text('Reverse Text');

      await tester.enterText(textField, 'hello');
      await tester.pump();

      // Button should be enabled after entering text
      expect(find.text('Reverse Text'), findsOneWidget);
    });

    testWidgets('shows validation error for text over 100 characters', (tester) async {
      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'a' * 101);
      await tester.pump();

      expect(find.text('Text must be 100 characters or less'), findsOneWidget);
      expect(find.text('101/100'), findsOneWidget);
    });

    testWidgets('shows loading state when submitting text', (tester) async {
      when(() => textRepository.reverseText('hello'))
          .thenAnswer((_) async => 'olleh');

      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      final sendButton = find.text('Reverse Text');

      await tester.enterText(textField, 'hello');
      await tester.pump();
      await tester.tap(sendButton);
      await tester.pump();

      expect(find.text('Reversing...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows result after successful submission', (tester) async {
      when(() => textRepository.reverseText('hello'))
          .thenAnswer((_) async => 'olleh');

      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      final sendButton = find.text('Reverse Text');

      await tester.enterText(textField, 'hello');
      await tester.pump();
      await tester.tap(sendButton);
      await tester.pump();
      await tester.pump(); // Wait for async operation

      expect(find.text('Original: hello'), findsOneWidget);
      expect(find.text('Reversed: olleh'), findsOneWidget);
      expect(find.text('Results (1)'), findsOneWidget);
    });

    testWidgets('shows error message on failure', (tester) async {
      when(() => textRepository.reverseText('hello'))
          .thenThrow(Exception('Network error'));

      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      final sendButton = find.text('Reverse Text');

      await tester.enterText(textField, 'hello');
      await tester.pump();
      await tester.tap(sendButton);
      await tester.pump();
      await tester.pump(); // Wait for async operation

      expect(find.text('Network error'), findsOneWidget);
      expect(find.byIcon(CupertinoIcons.exclamationmark_triangle), findsOneWidget);
    });

    testWidgets('clears input field after successful submission', (tester) async {
      when(() => textRepository.reverseText('hello'))
          .thenAnswer((_) async => 'olleh');

      await tester.pumpWidget(createWidgetUnderTest());

      final textField = find.byType(TextField);
      final sendButton = find.text('Reverse Text');

      await tester.enterText(textField, 'hello');
      await tester.pump();
      await tester.tap(sendButton);
      await tester.pump();
      await tester.pump(); // Wait for async operation

      expect(find.text('0/100'), findsOneWidget);
    });
  });
}