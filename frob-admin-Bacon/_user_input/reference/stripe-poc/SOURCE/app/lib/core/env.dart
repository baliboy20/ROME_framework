/// Compile-time config for the POC, overridable via `--dart-define`.
///
/// Example:
///   flutter run -d chrome \
///     --dart-define=API_BASE_URL=http://localhost:8788 \
///     --dart-define=STRIPE_PUBLISHABLE_KEY=pk_test_xxx
class Env {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8788',
  );

  static const stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const stripeMode = String.fromEnvironment(
    'STRIPE_MODE',
    defaultValue: 'test',
  );

  static bool get isTestMode => stripeMode == 'test';

  /// Admin API key sent as `X-Admin-Key` on admin endpoints.
  ///
  /// POC-only shortcut: baking a static admin key into a Flutter Web build
  /// means it ships to the client and is visible to anyone who inspects the
  /// compiled JS/network requests. That is fine for this throwaway POC
  /// (there's nothing sensitive behind it beyond Stripe test-mode data), but
  /// a production admin surface would need real authentication (e.g. a
  /// login flow issuing short-lived tokens) rather than a client-side
  /// static key.
  static const adminApiKey = String.fromEnvironment(
    'ADMIN_API_KEY',
    defaultValue: '',
  );
}
