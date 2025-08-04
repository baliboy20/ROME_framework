import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/article_model.dart';
import 'package:medium_flutter_extractor/presentation/providers/api_provider.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';

final articlesProvider = StateNotifierProvider<ArticlesNotifier, AsyncValue<List<ArticleModel>>>((ref) {
  return ArticlesNotifier(ref);
});

class ArticlesNotifier extends StateNotifier<AsyncValue<List<ArticleModel>>> {
  final Ref ref;
  
  ArticlesNotifier(this.ref) : super(const AsyncValue.data([])) {
    // Don't auto-load articles to prevent unnecessary API calls
    // Let user explicitly fetch articles when needed
  }
  
  Future<void> loadArticles({
    int page = 1,
    int limit = 100, // Increased limit but we'll cap display at 50
    String? search,
    String? status,
  }) async {
    if (page == 1) {
      state = const AsyncValue.loading();
    }
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final articlesData = await apiService.getArticles(
        page: page,
        limit: limit,
        search: search,
        status: status,
      );
      
      print('[ArticlesNotifier] Received ${articlesData.length} articles from API');
      
      final articles = articlesData.map((data) {
        try {
          // Log the first article data to debug structure
          if (articlesData.indexOf(data) == 0) {
            print('[ArticlesNotifier] First article data structure: ${data.keys.toList()}');
            print('[ArticlesNotifier] Sample article data: $data');
          }
          final article = ArticleModel.fromJson(data);
          print('[ArticlesNotifier] Successfully parsed article: ${article.title}');
          return article;
        } catch (e, stackTrace) {
          print('Error parsing article: $e');
          print('Stack trace: $stackTrace');
          print('Article data: $data');
          return null;
        }
      }).where((article) => article != null).cast<ArticleModel>().toList();
      
      print('[ArticlesNotifier] Successfully parsed ${articles.length} articles');
      
      if (page == 1) {
        state = AsyncValue.data(articles);
      } else {
        state.whenData((currentArticles) {
          // Limit total articles in memory to prevent crashes
          final combined = [...currentArticles, ...articles];
          final limitedArticles = combined.length > 200 
              ? combined.take(200).toList()
              : combined;
          state = AsyncValue.data(limitedArticles);
        });
      }
    } catch (e, st) {
      print('Error loading articles: $e');
      state = AsyncValue.error(e, st);
    }
  }
  
  Future<void> createArticle(Map<String, dynamic> articleData) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final newArticleData = await apiService.createArticle(articleData);
      final newArticle = ArticleModel.fromJson(newArticleData);
      
      state.whenData((articles) {
        state = AsyncValue.data([newArticle, ...articles]);
      });
    } catch (e) {
      // Handle error - could show snackbar or set error state
    }
  }
  
  Future<void> updateArticle(String id, Map<String, dynamic> updates) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final updatedArticleData = await apiService.updateArticle(id, updates);
      final updatedArticle = ArticleModel.fromJson(updatedArticleData);
      
      state.whenData((articles) {
        final updatedList = articles.map((article) {
          return article.id == id ? updatedArticle : article;
        }).toList();
        state = AsyncValue.data(updatedList);
      });
    } catch (e) {
      // Handle error
    }
  }
  
  Future<void> deleteArticle(String id) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.deleteArticle(id);
      
      state.whenData((articles) {
        final filteredList = articles.where((article) => article.id != id).toList();
        state = AsyncValue.data(filteredList);
      });
    } catch (e) {
      // Handle error
    }
  }
  
  Future<String?> startBatchScraping(List<String> urls) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.startBatchScraping({
        'urls': urls,
        'concurrency': 5,
      });
      
      final batchId = response['batchId'] as String;
      
      // Start tracking progress
      ref.read(scrapingProgressProvider.notifier).startTracking(batchId);
      
      return batchId;
    } catch (e) {
      // Handle error
      return null;
    }
  }
  
  Future<void> cancelScraping(String batchId) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.cancelScraping(batchId);
      
      // Clear progress tracking
      ref.read(scrapingProgressProvider.notifier).clearProgress(batchId);
    } catch (e) {
      // Handle error
    }
  }
  
  void clearArticles() {
    state = const AsyncValue.data([]);
  }
}