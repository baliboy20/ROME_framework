import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/text_result.dart';
import '../blocs/text_bloc/text_bloc.dart';
import '../blocs/text_bloc/text_event.dart';
import '../blocs/text_bloc/text_state.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final TextEditingController _textController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Reverse Text App'),
        backgroundColor: CupertinoColors.systemBlue,
        foregroundColor: Colors.white,
      ),
      body: BlocBuilder<TextBloc, TextState>(
        builder: (context, state) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInputSection(context, state),
                const SizedBox(height: 20),
                _buildResultsSection(state),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputSection(BuildContext context, TextState state) {
    final isLoading = state is TextLoading;
    final hasValidationError = state is TextValidation;
    final hasError = state is TextFailure;
    final isInputEmpty = state is TextInitial && state.isInputEmpty;

    int characterCount = 0;
    String? validationMessage;
    String? errorMessage;
    
    if (state is TextInitial) {
      characterCount = state.characterCount;
    } else if (state is TextValidation) {
      characterCount = state.characterCount;
      validationMessage = state.validationMessage;
    } else if (state is TextFailure) {
      errorMessage = state.errorMessage;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _textController,
          maxLength: 100,
          maxLines: 3,
          decoration: InputDecoration(
            labelText: 'Enter text to reverse',
            border: OutlineInputBorder(),
            counterText: '$characterCount/100',
            errorText: hasValidationError 
                ? validationMessage
                : null,
          ),
          onChanged: (text) {
            context.read<TextBloc>().add(TextChanged(text));
          },
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: isLoading || isInputEmpty || hasValidationError
                ? null
                : () {
                    context.read<TextBloc>().add(TextSubmitted(_textController.text));
                    _textController.clear();
                  },
            icon: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Icon(CupertinoIcons.arrow_right_circle_fill),
            label: Text(isLoading ? 'Reversing...' : 'Reverse Text'),
            style: ElevatedButton.styleFrom(
              backgroundColor: CupertinoColors.systemBlue,
              foregroundColor: Colors.white,
            ),
          ),
        ),
        if (hasError) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.red.shade300),
            ),
            child: Row(
              children: [
                Icon(CupertinoIcons.exclamationmark_triangle, 
                     color: Colors.red.shade600, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    errorMessage ?? '',
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildResultsSection(TextState state) {
    final results = _getResults(state);
    
    if (results.isEmpty) {
      return Expanded(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                CupertinoIcons.text_bubble,
                size: 64,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              Text(
                'No results yet',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter some text above to get started',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Results (${results.length})',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: results.length,
              itemBuilder: (context, index) {
                final result = results[index];
                return AnimatedContainer(
                  duration: Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(CupertinoIcons.clock, 
                                   size: 16, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                _formatTimestamp(result.timestamp),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Original: ${result.originalText}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Reversed: ${result.reversedText}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: CupertinoColors.systemBlue,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  List<TextResult> _getResults(TextState state) {
    if (state is TextInitial) return state.results;
    if (state is TextLoading) return state.results;
    if (state is TextSuccess) return state.results;
    if (state is TextFailure) return state.results;
    if (state is TextValidation) return state.results;
    return [];
  }

  String _formatTimestamp(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}:${timestamp.second.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }
}