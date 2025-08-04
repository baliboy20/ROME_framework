import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';

final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  
  // Auto-connect when provider is created (disabled for development)
  // service.connect();
  
  // Dispose when provider is disposed
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});

final connectionStatusProvider = StreamProvider<ConnectionStatus>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.connectionStream;
});

final scrapingProgressProvider = StateNotifierProvider<ScrapingProgressNotifier, Map<String, ProgressUpdate>>((ref) {
  return ScrapingProgressNotifier(ref);
});

class ScrapingProgressNotifier extends StateNotifier<Map<String, ProgressUpdate>> {
  final Ref ref;
  
  ScrapingProgressNotifier(this.ref) : super({}) {
    _listenToProgress();
  }
  
  void _listenToProgress() {
    final service = ref.read(webSocketServiceProvider);
    
    service.progressStream.listen(
      (progress) {
        // Limit the number of progress items to prevent memory leaks
        final currentState = Map<String, ProgressUpdate>.from(state);
        
        // Remove old completed items if we have too many
        if (currentState.length > 10) {
          final completedKeys = currentState.entries
              .where((entry) => entry.value.status == ProgressStatus.completed || 
                              entry.value.status == ProgressStatus.failed)
              .map((entry) => entry.key)
              .toList();
          
          // Keep only the 5 most recent completed items
          if (completedKeys.length > 5) {
            completedKeys.take(completedKeys.length - 5).forEach((key) {
              currentState.remove(key);
            });
          }
        }
        
        currentState[progress.batchId] = progress;
        state = currentState;
      },
      onError: (error) {
        print('WebSocket progress stream error: $error');
      },
    );
  }
  
  void startTracking(String batchId) {
    final service = ref.read(webSocketServiceProvider);
    service.listenToProgress(batchId, (progress) {
      // Progress is automatically handled by the stream listener above
    });
  }
  
  void clearProgress(String batchId) {
    final newState = Map<String, ProgressUpdate>.from(state);
    newState.remove(batchId);
    state = newState;
  }
  
  void clearAllProgress() {
    state = {};
  }
  
  ProgressUpdate? getProgress(String batchId) {
    return state[batchId];
  }
  
  bool isInProgress(String batchId) {
    final progress = state[batchId];
    return progress?.status == ProgressStatus.running;
  }
  
  double getProgressPercentage(String batchId) {
    final progress = state[batchId];
    if (progress == null || progress.total == 0) return 0.0;
    
    final completed = progress.completed + progress.failed;
    return completed / progress.total;
  }
}