import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/data/models/auth_model.dart';
import 'package:medium_flutter_extractor/data/repositories/auth_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref);
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<AuthModel?>>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<AuthModel?>> {
  final Ref ref;
  static const String _authKey = 'auth_data';
  
  AuthNotifier(this.ref) : super(const AsyncValue.loading()) {
    _loadAuthFromStorage();
  }
  
  Future<void> _loadAuthFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final authJson = prefs.getString(_authKey);
      
      if (authJson != null) {
        // TODO: Parse and validate stored auth
        state = const AsyncValue.data(null);
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  
  Future<void> login() async {
    state = const AsyncValue.loading();
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final auth = await authRepo.initiateGoogleAuth();
      
      // Save to storage
      final prefs = await SharedPreferences.getInstance();
      // TODO: Save auth JSON
      
      state = AsyncValue.data(auth);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  
  Future<bool> refreshToken() async {
    final currentAuth = state.valueOrNull;
    if (currentAuth == null) return false;
    
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final newAuth = await authRepo.refreshToken(currentAuth.refreshToken);
      
      state = AsyncValue.data(newAuth);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  Future<void> logout() async {
    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.logout();
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_authKey);
      
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}