import 'dart:io';
import 'package:path/path.dart' as path;
import '../constants/app_constants.dart';
import '../errors/exceptions.dart';

/// Utility functions for file operations
/// Note: file_picker integration will be added in future phase
class FileUtils {
  FileUtils._();

  /// Validates file size
  static bool isValidFileSize(int fileSize) {
    return fileSize <= AppConstants.maxFileSize;
  }

  /// Validates file extension
  static bool isValidFileExtension(String filePath) {
    final extension = path.extension(filePath).toLowerCase().replaceFirst('.', '');
    return AppConstants.allowedFileExtensions.contains(extension);
  }

  /// Gets file extension from path
  static String getFileExtension(String filePath) {
    return path.extension(filePath).toLowerCase().replaceFirst('.', '');
  }

  /// Gets file name from path
  static String getFileName(String filePath) {
    return path.basename(filePath);
  }

  /// Gets file size in bytes
  static Future<int> getFileSize(String filePath) async {
    try {
      final file = File(filePath);
      return await file.length();
    } catch (e) {
      throw FileException('Failed to get file size: ${e.toString()}', path: filePath);
    }
  }

  /// Formats file size for display
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  /// Validates file before upload
  static Future<void> validateFile(String filePath) async {
    // Check if file exists
    final file = File(filePath);
    if (!await file.exists()) {
      throw FileException('File does not exist', path: filePath);
    }

    // Check file extension
    if (!isValidFileExtension(filePath)) {
      throw FileException(
        'File type not allowed. Allowed types: ${AppConstants.allowedFileExtensions.join(', ')}',
        path: filePath,
      );
    }

    // Check file size
    final fileSize = await getFileSize(filePath);
    if (!isValidFileSize(fileSize)) {
      throw FileException(
        'File size exceeds maximum allowed size of ${formatFileSize(AppConstants.maxFileSize)}',
        path: filePath,
      );
    }
  }

  /// Gets MIME type from file extension
  static String getMimeType(String filePath) {
    final extension = getFileExtension(filePath);
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      default:
        return 'application/octet-stream';
    }
  }
}