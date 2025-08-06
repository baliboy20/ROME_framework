import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as path;
import '../errors/exceptions.dart';
import '../utils/file_utils.dart';

class FilePickerService {
  static const int maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedExtensions = [
    'pdf', 'doc', 'docx', 'txt', 'md',
    'jpg', 'jpeg', 'png', 'gif',
    'xls', 'xlsx', 'csv'
  ];

  /// Pick a single file with validation
  static Future<File?> pickSingleFile({
    List<String>? allowedExtensions,
    int? maxSizeInBytes,
  }) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowedExtensions ?? FilePickerService.allowedExtensions,
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        return null;
      }

      final platformFile = result.files.first;
      if (platformFile.path == null) {
        throw FilePickerException('File path is null');
      }

      final file = File(platformFile.path!);
      await _validateFile(
        file, 
        maxSizeInBytes ?? maxFileSizeInBytes,
        allowedExtensions ?? FilePickerService.allowedExtensions,
      );

      return file;
    } catch (e) {
      if (e is FilePickerException) rethrow;
      throw FilePickerException('Failed to pick file: ${e.toString()}');
    }
  }

  /// Pick multiple files with validation
  static Future<List<File>> pickMultipleFiles({
    List<String>? allowedExtensions,
    int? maxSizeInBytes,
    int maxFileCount = 5,
  }) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowedExtensions ?? FilePickerService.allowedExtensions,
        allowMultiple: true,
      );

      if (result == null || result.files.isEmpty) {
        return [];
      }

      if (result.files.length > maxFileCount) {
        throw FilePickerException('Too many files selected. Maximum allowed: $maxFileCount');
      }

      final files = <File>[];
      for (final platformFile in result.files) {
        if (platformFile.path == null) continue;
        
        final file = File(platformFile.path!);
        await _validateFile(
          file, 
          maxSizeInBytes ?? maxFileSizeInBytes,
          allowedExtensions ?? FilePickerService.allowedExtensions,
        );
        files.add(file);
      }

      return files;
    } catch (e) {
      if (e is FilePickerException) rethrow;
      throw FilePickerException('Failed to pick files: ${e.toString()}');
    }
  }

  /// Pick image files specifically
  static Future<File?> pickImageFile() async {
    return pickSingleFile(
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
      maxSizeInBytes: 5 * 1024 * 1024, // 5MB for images
    );
  }

  /// Pick document files specifically
  static Future<File?> pickDocumentFile() async {
    return pickSingleFile(
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'md'],
      maxSizeInBytes: maxFileSizeInBytes,
    );
  }

  /// Validate file size, extension, and existence
  static Future<void> _validateFile(
    File file, 
    int maxSizeInBytes,
    List<String> allowedExtensions,
  ) async {
    // Check if file exists
    if (!await file.exists()) {
      throw FilePickerException('File does not exist: ${file.path}');
    }

    // Check file extension
    final extension = path.extension(file.path).toLowerCase().replaceFirst('.', '');
    if (!allowedExtensions.contains(extension)) {
      throw FilePickerException(
        'File type not allowed. Allowed types: ${allowedExtensions.join(', ')}'
      );
    }

    // Check file size
    final fileSize = await file.length();
    if (fileSize > maxSizeInBytes) {
      final maxSizeMB = (maxSizeInBytes / (1024 * 1024)).toStringAsFixed(1);
      final fileSizeMB = (fileSize / (1024 * 1024)).toStringAsFixed(1);
      throw FilePickerException(
        'File too large: ${fileSizeMB}MB. Maximum allowed: ${maxSizeMB}MB'
      );
    }

    // Additional validation for specific file types
    await _validateFileContent(file, extension);
  }

  /// Validate file content based on type
  static Future<void> _validateFileContent(File file, String extension) async {
    try {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          await _validateImageFile(file);
          break;
        case 'pdf':
          await _validatePdfFile(file);
          break;
        case 'txt':
        case 'md':
          await _validateTextFile(file);
          break;
        default:
          // No specific validation for other file types
          break;
      }
    } catch (e) {
      throw FilePickerException('File validation failed: ${e.toString()}');
    }
  }

  /// Validate image file by reading header
  static Future<void> _validateImageFile(File file) async {
    final bytes = await file.readAsBytes();
    if (bytes.length < 4) {
      throw FilePickerException('Invalid image file: too small');
    }

    // Check for common image file signatures
    final header = bytes.take(4).toList();
    final isValidImage = _checkImageSignature(header, path.extension(file.path));
    
    if (!isValidImage) {
      throw FilePickerException('Invalid image file format');
    }
  }

  /// Check image file signature
  static bool _checkImageSignature(List<int> header, String extension) {
    switch (extension.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return header[0] == 0xFF && header[1] == 0xD8;
      case '.png':
        return header[0] == 0x89 && header[1] == 0x50 && 
               header[2] == 0x4E && header[3] == 0x47;
      case '.gif':
        return (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46) ||
               (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46);
      default:
        return true; // Allow unknown formats to pass
    }
  }

  /// Validate PDF file
  static Future<void> _validatePdfFile(File file) async {
    final bytes = await file.readAsBytes();
    if (bytes.length < 4) {
      throw FilePickerException('Invalid PDF file: too small');
    }

    // Check PDF signature
    final header = String.fromCharCodes(bytes.take(4));
    if (header != '%PDF') {
      throw FilePickerException('Invalid PDF file format');
    }
  }

  /// Validate text file
  static Future<void> _validateTextFile(File file) async {
    try {
      await file.readAsString();
    } catch (e) {
      throw FilePickerException('Invalid text file: cannot read as text');
    }
  }

  /// Get file info for display
  static FileInfo getFileInfo(File file) {
    final fileName = path.basename(file.path);
    final extension = path.extension(file.path).toLowerCase().replaceFirst('.', '');
    final fileSize = file.lengthSync();
    
    return FileInfo(
      name: fileName,
      path: file.path,
      extension: extension,
      sizeInBytes: fileSize,
      sizeFormatted: FileUtils.formatFileSize(fileSize),
      isImage: ['jpg', 'jpeg', 'png', 'gif'].contains(extension),
      isDocument: ['pdf', 'doc', 'docx', 'txt', 'md'].contains(extension),
    );
  }

  /// Check if file picker is available on platform
  static Future<bool> isAvailable() async {
    try {
      return FilePicker.platform.pickFiles != null;
    } catch (e) {
      return false;
    }
  }
}

/// File information model
class FileInfo {
  final String name;
  final String path;
  final String extension;
  final int sizeInBytes;
  final String sizeFormatted;
  final bool isImage;
  final bool isDocument;

  const FileInfo({
    required this.name,
    required this.path,
    required this.extension,
    required this.sizeInBytes,
    required this.sizeFormatted,
    required this.isImage,
    required this.isDocument,
  });

  @override
  String toString() {
    return 'FileInfo(name: $name, size: $sizeFormatted, type: $extension)';
  }
}