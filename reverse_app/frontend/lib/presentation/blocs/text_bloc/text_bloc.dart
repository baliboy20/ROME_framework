import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/entities/text_result.dart';
import '../../../domain/repositories/text_repository.dart';
import 'text_event.dart';
import 'text_state.dart';

class TextBloc extends Bloc<TextEvent, TextState> {
  final TextRepository textRepository;
  final List<TextResult> _results = [];

  TextBloc({required this.textRepository}) : super(const TextInitial()) {
    on<TextSubmitted>(_onTextSubmitted);
    on<TextChanged>(_onTextChanged);
  }

  void _onTextChanged(TextChanged event, Emitter<TextState> emit) {
    final text = event.text;
    final characterCount = text.length;
    
    if (characterCount == 0) {
      emit(TextInitial(
        results: _results,
        isInputEmpty: true,
        characterCount: 0,
      ));
    } else if (characterCount > 100) {
      emit(TextValidation(
        validationMessage: 'Text must be 100 characters or less',
        results: _results,
        characterCount: characterCount,
      ));
    } else {
      emit(TextInitial(
        results: _results,
        isInputEmpty: false,
        characterCount: characterCount,
      ));
    }
  }

  void _onTextSubmitted(TextSubmitted event, Emitter<TextState> emit) async {
    final text = event.text.trim();
    
    if (text.isEmpty) {
      emit(TextValidation(
        validationMessage: 'Please enter some text',
        results: _results,
        characterCount: 0,
      ));
      return;
    }

    if (text.length > 100) {
      emit(TextValidation(
        validationMessage: 'Text must be 100 characters or less',
        results: _results,
        characterCount: text.length,
      ));
      return;
    }

    emit(TextLoading(results: _results));

    try {
      final reversedText = await textRepository.reverseText(text);
      final result = TextResult(
        originalText: text,
        reversedText: reversedText,
        timestamp: DateTime.now(),
      );
      
      _results.insert(0, result);
      emit(TextSuccess(results: List.from(_results)));
    } catch (e) {
      emit(TextFailure(
        errorMessage: e.toString().replaceFirst('Exception: ', ''),
        results: _results,
      ));
    }
  }
}