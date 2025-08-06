import '../services/app_logger.dart';

/// Service for validating project-specific fields like paths and URLs
class ProjectValidationService {
  ProjectValidationService._();
  static final ProjectValidationService instance = ProjectValidationService._();

  /// Validate local source folder path
  ValidationResult validateLocalSourceFolder(String? path) {
    if (path == null || path.trim().isEmpty) {
      return const ValidationResult.valid();
    }

    final trimmedPath = path.trim();
    
    // Check length limits
    if (trimmedPath.length > 500) {
      return const ValidationResult.invalid('Local source folder path must be less than 500 characters');
    }

    // Basic path validation - allow common path characters
    final pathRegex = RegExp(r'^[a-zA-Z0-9\\\\/\\\\_\\-\\.\\s:]+$');
    if (!pathRegex.hasMatch(trimmedPath)) {
      return const ValidationResult.invalid('Path contains invalid characters. Only letters, numbers, spaces, and common path characters are allowed');
    }

    // Check for dangerous patterns
    if (trimmedPath.contains('..') || 
        trimmedPath.contains('//') ||
        trimmedPath.startsWith('/') && trimmedPath.length == 1) {
      return const ValidationResult.invalid('Path contains potentially unsafe patterns');
    }

    AppLogger.instance.debug('Local source folder path validation passed: $trimmedPath');
    return const ValidationResult.valid();
  }

  /// Validate GitHub repository URL
  ValidationResult validateGithubRepo(String? url) {
    if (url == null || url.trim().isEmpty) {
      return const ValidationResult.valid();
    }

    final trimmedUrl = url.trim();
    
    // Check length limits
    if (trimmedUrl.length > 200) {
      return const ValidationResult.invalid('GitHub repository URL must be less than 200 characters');
    }

    // GitHub URL validation - must be valid GitHub repository URL
    final githubRegex = RegExp(
      r'^https:\/\/github\.com\/[a-zA-Z0-9\-_\.]+\/[a-zA-Z0-9\-_\.]+\/?$',
      caseSensitive: false,
    );
    
    if (!githubRegex.hasMatch(trimmedUrl)) {
      return const ValidationResult.invalid('Must be a valid GitHub repository URL (e.g., https://github.com/username/repository)');
    }

    // Additional checks for valid GitHub username/repository patterns
    final parts = trimmedUrl.replaceFirst('https://github.com/', '').split('/');
    if (parts.length < 2) {
      return const ValidationResult.invalid('GitHub URL must include both username and repository name');
    }

    final username = parts[0];
    final repository = parts[1].replaceAll('/', ''); // Remove trailing slash if present

    // Validate username format
    if (username.isEmpty || username.length > 39 || 
        username.startsWith('-') || username.endsWith('-') ||
        username.startsWith('.') || username.endsWith('.')) {
      return const ValidationResult.invalid('Invalid GitHub username format');
    }

    // Validate repository name format
    if (repository.isEmpty || repository.length > 100 ||
        repository.startsWith('.') || repository.endsWith('.')) {
      return const ValidationResult.invalid('Invalid GitHub repository name format');
    }

    AppLogger.instance.debug('GitHub repository URL validation passed: $trimmedUrl');
    return const ValidationResult.valid();
  }

  /// Validate both fields together for a project
  ProjectFieldsValidationResult validateProjectFields({
    String? localSourceFolder,
    String? githubRepo,
  }) {
    final pathResult = validateLocalSourceFolder(localSourceFolder);
    final urlResult = validateGithubRepo(githubRepo);
    
    final errors = <String>[];
    if (!pathResult.isValid) {
      errors.add('Local Source Folder: ${pathResult.errorMessage}');
    }
    if (!urlResult.isValid) {
      errors.add('GitHub Repository: ${urlResult.errorMessage}');
    }

    return ProjectFieldsValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
      localSourceFolderValid: pathResult.isValid,
      githubRepoValid: urlResult.isValid,
    );
  }
}

/// Result of a single field validation
class ValidationResult {
  const ValidationResult._({
    required this.isValid,
    this.errorMessage,
  });

  const ValidationResult.valid() : this._(isValid: true);
  const ValidationResult.invalid(String message) : this._(isValid: false, errorMessage: message);

  final bool isValid;
  final String? errorMessage;
}

/// Result of validating multiple project fields
class ProjectFieldsValidationResult {
  const ProjectFieldsValidationResult({
    required this.isValid,
    required this.errors,
    required this.localSourceFolderValid,
    required this.githubRepoValid,
  });

  final bool isValid;
  final List<String> errors;
  final bool localSourceFolderValid;
  final bool githubRepoValid;

  /// Get concatenated error message
  String get errorMessage => errors.join('\n');

  /// Check if there are any validation errors
  bool get hasErrors => errors.isNotEmpty;
}