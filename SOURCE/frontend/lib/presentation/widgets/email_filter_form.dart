import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:medium_flutter_extractor/data/models/email_filter_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/email_provider.dart';

class EmailFilterForm extends ConsumerStatefulWidget {
  const EmailFilterForm({super.key});

  @override
  ConsumerState<EmailFilterForm> createState() => _EmailFilterFormState();
}

class _EmailFilterFormState extends ConsumerState<EmailFilterForm> {
  DateTimeRange _dateRange = DateTimeRange(
    start: DateTime.now().subtract(const Duration(days: 2)),
    end: DateTime.now(),
  );
  final _keywordsController = TextEditingController(text: 'flutter');
  final _subjectController = TextEditingController(text: 'Medium Daily Digest');
  
  @override
  void dispose() {
    _keywordsController.dispose();
    _subjectController.dispose();
    super.dispose();
  }
  
  Future<void> _selectDateRange(BuildContext context) async {
    print('DEBUG: Opening date range picker');
    
    final picked = await showDateRangePicker(
      context: context,
      initialDateRange: _dateRange,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: const Color(0xFF6B3C4D), // Grayish maroon
              onPrimary: Colors.white,
              surface: const Color(0xFFF8F5F0), // Light muted straw
              onSurface: const Color(0xFF4A2832), // Dark grayish maroon
            ),
          ),
          child: child!,
        );
      },
    );
    
    print('DEBUG: Date range picker result: $picked');
    
    if (picked != null) {
      setState(() {
        _dateRange = picked;
        print('DEBUG: Updated date range to: ${_dateRange.start.toIso8601String()} - ${_dateRange.end.toIso8601String()}');
      });
    }
  }
  
  void _fetchEmails() async {
    // Ensure start date is at beginning of day and end date is at end of day
    final adjustedStartDate = DateTime(_dateRange.start.year, _dateRange.start.month, _dateRange.start.day, 0, 0, 0);
    final adjustedEndDate = DateTime(_dateRange.end.year, _dateRange.end.month, _dateRange.end.day, 23, 59, 59);
    
    final filter = EmailFilterModel(
      startDate: adjustedStartDate,
      endDate: adjustedEndDate,
      keywords: _keywordsController.text.split(',').map((e) => e.trim()).toList(),
      subjects: _subjectController.text.split(',').map((e) => e.trim()).toList(),
    );
    
    // Debug: Print filter data
    print('DEBUG: Email filter data:');
    print('Original Start Date: ${_dateRange.start.toIso8601String()}');
    print('Original End Date: ${_dateRange.end.toIso8601String()}');
    print('Adjusted Start Date: ${adjustedStartDate.toIso8601String()}');
    print('Adjusted End Date: ${adjustedEndDate.toIso8601String()}');
    print('Keywords: ${_keywordsController.text}');
    print('Subjects: ${_subjectController.text}');
    print('Filter JSON: ${filter.toJson()}');
    
    await ref.read(emailNotifierProvider.notifier).fetchEmails(filter);
    
    // After successful fetch, notify parent to switch to emails tab
    if (mounted && ref.read(emailNotifierProvider).hasValue) {
      // Find and switch to emails tab
      final scaffoldMessenger = ScaffoldMessenger.of(context);
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Emails fetched! Check the Emails tab.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final emailState = ref.watch(emailNotifierProvider);
    final dateFormat = DateFormat('MMM dd, yyyy');
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Email Filter',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        
        // Date Range Selector
        Card(
          elevation: 2,
          child: InkWell(
            onTap: () => _selectDateRange(context),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(CupertinoIcons.calendar, 
                           color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 8),
                      const Text(
                        'Date Range', 
                        style: TextStyle(
                          fontFamily: 'Comic Sans MS',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'From',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                                fontFamily: 'Comic Sans MS',
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              dateFormat.format(_dateRange.start),
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontFamily: 'Comic Sans MS',
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(
                          CupertinoIcons.arrow_right,
                          color: Theme.of(context).colorScheme.primary,
                          size: 18,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'To',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                                fontFamily: 'Comic Sans MS',
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              dateFormat.format(_dateRange.end),
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontFamily: 'Comic Sans MS',
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${_dateRange.duration.inDays + 1} days selected',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontFamily: 'Comic Sans MS',
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Subject Filter
        TextField(
          controller: _subjectController,
          style: const TextStyle(
            fontFamily: 'Comic Sans MS',
          ),
          decoration: const InputDecoration(
            labelText: 'Email Subjects',
            labelStyle: TextStyle(
              fontFamily: 'Comic Sans MS',
              fontWeight: FontWeight.w500,
            ),
            hintText: 'Comma-separated subjects',
            prefixIcon: Icon(CupertinoIcons.textformat),
          ),
        ),
        const SizedBox(height: 16),
        
        // Keywords
        TextField(
          controller: _keywordsController,
          style: const TextStyle(
            fontFamily: 'Comic Sans MS',
          ),
          decoration: const InputDecoration(
            labelText: 'Keywords',
            labelStyle: TextStyle(
              fontFamily: 'Comic Sans MS',
              fontWeight: FontWeight.w500,
            ),
            hintText: 'Comma-separated keywords',
            prefixIcon: Icon(CupertinoIcons.search),
          ),
        ),
        const SizedBox(height: 24),
        
        // Fetch Button
        SizedBox(
          width: double.infinity,
          child: CupertinoButton.filled(
            onPressed: emailState.isLoading ? null : _fetchEmails,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (emailState.isLoading)
                  const CupertinoActivityIndicator(
                    color: Colors.white,
                    radius: 10,
                  )
                else
                  const Icon(
                    CupertinoIcons.mail,
                    size: 18,
                    color: Colors.white,
                  ),
                const SizedBox(width: 8),
                Text(
                  emailState.isLoading ? 'Fetching...' : 'Fetch Emails',
                  style: const TextStyle(
                    fontFamily: 'Comic Sans MS',
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        
        if (emailState.hasError) ...[
          const SizedBox(height: 16),
          Card(
            color: Theme.of(context).colorScheme.errorContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    CupertinoIcons.exclamationmark_triangle,
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Error: ${emailState.error}',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onErrorContainer,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        
        if (emailState.hasValue) ...[
          const SizedBox(height: 16),
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(
                    CupertinoIcons.checkmark_circle,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Found ${emailState.value?.length ?? 0} emails',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}