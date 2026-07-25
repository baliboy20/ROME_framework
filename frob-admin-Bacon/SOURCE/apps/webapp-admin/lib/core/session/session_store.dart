/// Holds the bearer token for the signed-in owner/operator. A single instance
/// is shared by every remote data source (via [ApiHttp]) and written by the
/// auth feature on sign-in / sign-out. Kept deliberately tiny — no Flutter,
/// no persistence (the SPA re-authenticates on reload).
class SessionStore {
  String? _token;

  String? get token => _token;
  bool get isSignedIn => _token != null;

  void set(String? token) => _token = token;
  void clear() => _token = null;
}
