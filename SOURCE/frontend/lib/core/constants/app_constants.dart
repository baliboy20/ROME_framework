import 'dart:ui';

/// Application-wide constants
class AppConstants {
  // Prevent instantiation
  AppConstants._();

  // API Configuration
  static const String baseUrl = 'http://localhost:8090/api/v1';
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds

  // API Endpoints
  static const String projectsEndpoint = '/projects';
  static const String tasksEndpoint = '/tasks';
  static const String blogsEndpoint = '/blogs';
  static const String authEndpoint = '/auth';
  static const String loginEndpoint = '$authEndpoint/login';
  static const String registerEndpoint = '$authEndpoint/register';
  static const String refreshEndpoint = '$authEndpoint/refresh';

  // Storage Keys
  static const String authTokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';

  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double defaultBorderRadius = 8.0;
  static const double cardElevation = 2.0;
  
  // Animation Durations
  static const Duration defaultAnimationDuration = Duration(milliseconds: 300);
  static const Duration fastAnimationDuration = Duration(milliseconds: 150);
  static const Duration slowAnimationDuration = Duration(milliseconds: 500);

  // File Upload (to be implemented with file_picker in future phase)
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  static const List<String> allowedFileExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'md'
  ];

  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 50;
  static const int maxProjectNameLength = 100;
  static const int maxTaskNameLength = 200;
  static const int maxDescriptionLength = 1000;

  // Date Formats
  static const String defaultDateFormat = 'yyyy-MM-dd';
  static const String displayDateFormat = 'MMM dd, yyyy';
  static const String displayDateTimeFormat = 'MMM dd, yyyy HH:mm';
  static const String apiDateTimeFormat = 'yyyy-MM-ddTHH:mm:ss.SSSZ';

  // Error Messages
  static const String networkErrorMessage = 'Network connection failed. Please check your internet connection.';
  static const String serverErrorMessage = 'Server error occurred. Please try again later.';
  static const String unauthorizedErrorMessage = 'You are not authorized to perform this action.';
  static const String validationErrorMessage = 'Please check your input and try again.';
  static const String fileUploadErrorMessage = 'File upload failed. Please try again.';
  static const String jsonValidationErrorMessage = 'Invalid data format received from server.';

  // Success Messages
  static const String loginSuccessMessage = 'Login successful!';
  static const String logoutSuccessMessage = 'Logout successful!';
  static const String saveSuccessMessage = 'Changes saved successfully!';
  static const String deleteSuccessMessage = 'Item deleted successfully!';
  static const String uploadSuccessMessage = 'File uploaded successfully!';

  // Feature Flags
  static const bool enableLogging = true;
  static const bool enableCrashReporting = false;
  static const bool enableAnalytics = false;
  static const bool enableOfflineMode = true;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}

/// Application color constants
class AppColors {
  AppColors._();

  // macOS Cupertino Colors
  static const primaryBlue = Color(0xFF007AFF);
  static const systemGray = Color(0xFF8E8E93);
  static const systemGray2 = Color(0xFFAEAEB2);
  static const systemGray3 = Color(0xFFC7C7CC);
  static const systemGray4 = Color(0xFFD1D1D6);
  static const systemGray5 = Color(0xFFE5E5EA);
  static const systemGray6 = Color(0xFFF2F2F7);
  
  // Status Colors
  static const successGreen = Color(0xFF34C759);
  static const warningOrange = Color(0xFFFF9500);
  static const errorRed = Color(0xFFFF3B30);
  
  // Text Colors
  static const primaryText = Color(0xFF000000);
  static const secondaryText = Color(0xFF3C3C43);
  static const tertiaryText = Color(0xFF48484A);
  
  // Background Colors
  static const primaryBackground = Color(0xFFFFFFFF);
  static const secondaryBackground = Color(0xFFF2F2F7);
  static const groupedBackground = Color(0xFFF2F2F7);
  static const cardBackground = Color(0xFFFFFFFF);
}