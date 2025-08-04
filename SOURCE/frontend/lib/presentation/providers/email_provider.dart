import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/email_filter_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/api_provider.dart';

final emailNotifierProvider = StateNotifierProvider<EmailNotifier, AsyncValue<List<Map<String, dynamic>>>>((ref) {
  return EmailNotifier(ref);
});

class EmailNotifier extends StateNotifier<AsyncValue<List<Map<String, dynamic>>>> {
  final Ref ref;
  
  EmailNotifier(this.ref) : super(const AsyncValue.data([]));
  
  Future<void> fetchEmails(EmailFilterModel filter) async {
    state = const AsyncValue.loading();
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final emails = await apiService.fetchEmails(filter.toJson());
      state = AsyncValue.data(emails);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  
  void clearEmails() {
    state = const AsyncValue.data([]);
  }
}