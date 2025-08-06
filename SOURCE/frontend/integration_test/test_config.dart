/// Configuration for E2E tests
class E2ETestConfig {
  // Test Environment
  static const String environment = 'test';
  static const String baseUrl = 'http://localhost:8090/api/v1';
  
  // Test Timeouts
  static const Duration shortTimeout = Duration(seconds: 5);
  static const Duration mediumTimeout = Duration(seconds: 10);
  static const Duration longTimeout = Duration(seconds: 30);
  static const Duration veryLongTimeout = Duration(minutes: 2);
  
  // Test Data Configuration
  static const int maxTestProjects = 10;
  static const int maxTestTasks = 20;
  static const int maxTestBlogs = 15;
  
  // Performance Thresholds
  static const Duration maxNavigationTime = Duration(seconds: 3);
  static const Duration maxApiResponseTime = Duration(seconds: 5);
  static const Duration maxUIUpdateTime = Duration(seconds: 2);
  
  // Test Flags
  static const bool enablePerformanceTests = true;
  static const bool enableErrorSimulation = false;
  static const bool enableVerboseLogging = true;
  static const bool cleanupBetweenTests = true;
  
  // Test Data Prefixes
  static const String testProjectPrefix = 'E2E_TEST_PROJECT_';
  static const String testTaskPrefix = 'E2E_TEST_TASK_';
  static const String testBlogPrefix = 'E2E_TEST_BLOG_';
  
  // UI Test Configuration
  static const Duration pumpSettleTimeout = Duration(seconds: 10);
  static const Duration elementWaitTimeout = Duration(seconds: 15);
  static const Duration userActionDelay = Duration(milliseconds: 500);
  
  /// Check if we're in test mode
  static bool get isTestMode => environment == 'test';
  
  /// Get test-specific configuration
  static Map<String, dynamic> get testConfiguration => {
    'environment': environment,
    'baseUrl': baseUrl,
    'timeouts': {
      'short': shortTimeout.inMilliseconds,
      'medium': mediumTimeout.inMilliseconds,
      'long': longTimeout.inMilliseconds,
      'veryLong': veryLongTimeout.inMilliseconds,
    },
    'limits': {
      'maxProjects': maxTestProjects,
      'maxTasks': maxTestTasks,
      'maxBlogs': maxTestBlogs,
    },
    'performance': {
      'maxNavigationTime': maxNavigationTime.inMilliseconds,
      'maxApiResponseTime': maxApiResponseTime.inMilliseconds,
      'maxUIUpdateTime': maxUIUpdateTime.inMilliseconds,
    },
    'flags': {
      'enablePerformanceTests': enablePerformanceTests,
      'enableErrorSimulation': enableErrorSimulation,
      'enableVerboseLogging': enableVerboseLogging,
      'cleanupBetweenTests': cleanupBetweenTests,
    },
  };
}