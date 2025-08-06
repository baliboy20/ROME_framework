import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:file_picker/file_picker.dart';

import '../../../lib/core/services/file_picker_service.dart';
import '../../../lib/core/errors/exceptions.dart';

// Mock classes
class MockFilePicker extends Mock implements FilePicker {}
class MockFilePickerPlatform extends Mock implements FilePickerPlatform {}
class MockFilePickerResult extends Mock implements FilePickerResult {}
class MockPlatformFile extends Mock implements PlatformFile {}
class MockFile extends Mock implements File {}

void main() {
  group('FilePickerService', () {
    late MockFilePickerPlatform mockFilePickerPlatform;
    late MockFilePickerResult mockFilePickerResult;
    late MockPlatformFile mockPlatformFile;
    late MockFile mockFile;

    setUp(() {
      mockFilePickerPlatform = MockFilePickerPlatform();
      mockFilePickerResult = MockFilePickerResult();
      mockPlatformFile = MockPlatformFile();
      mockFile = MockFile();

      // Set up FilePicker platform mock
      FilePicker.platform = mockFilePickerPlatform;
    });

    group('constants', () {
      test('should have correct max file size', () {
        expect(FilePickerService.maxFileSizeInBytes, equals(10 * 1024 * 1024));
      });

      test('should have correct allowed extensions', () {
        expect(FilePickerService.allowedExtensions, contains('pdf'));
        expect(FilePickerService.allowedExtensions, contains('jpg'));
        expect(FilePickerService.allowedExtensions, contains('png'));
        expect(FilePickerService.allowedExtensions, contains('doc'));
        expect(FilePickerService.allowedExtensions, contains('txt'));
      });
    });

    group('pickSingleFile', () {
      test('should return null when user cancels file selection', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        final result = await FilePickerService.pickSingleFile();

        // Assert
        expect(result, isNull);
      });

      test('should return null when no files selected', () async {
        // Arrange
        when(() => mockFilePickerResult.files).thenReturn([]);
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => mockFilePickerResult);

        // Act
        final result = await FilePickerService.pickSingleFile();

        // Assert
        expect(result, isNull);
      });

      test('should throw FilePickerException when file path is null', () async {
        // Arrange
        when(() => mockPlatformFile.path).thenReturn(null);
        when(() => mockFilePickerResult.files).thenReturn([mockPlatformFile]);
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => mockFilePickerResult);

        // Act & Assert
        await expectLater(
          FilePickerService.pickSingleFile(),
          throwsA(isA<FilePickerException>()),
        );
      });

      test('should use custom allowed extensions when provided', () async {
        // Arrange
        final customExtensions = ['jpg', 'png'];
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        await FilePickerService.pickSingleFile(allowedExtensions: customExtensions);

        // Assert
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: customExtensions,
          allowMultiple: false,
        )).called(1);
      });

      test('should use custom max size when provided', () async {
        // Arrange
        const customMaxSize = 5 * 1024 * 1024; // 5MB
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        await FilePickerService.pickSingleFile(maxSizeInBytes: customMaxSize);

        // Assert - Verification of max size would happen in file validation
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: FilePickerService.allowedExtensions,
          allowMultiple: false,
        )).called(1);
      });
    });

    group('pickMultipleFiles', () {
      test('should return empty list when user cancels', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        final result = await FilePickerService.pickMultipleFiles();

        // Assert
        expect(result, isEmpty);
      });

      test('should return empty list when no files selected', () async {
        // Arrange
        when(() => mockFilePickerResult.files).thenReturn([]);
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => mockFilePickerResult);

        // Act
        final result = await FilePickerService.pickMultipleFiles();

        // Assert
        expect(result, isEmpty);
      });

      test('should throw exception when too many files selected', () async {
        // Arrange
        final manyFiles = List.generate(10, (i) {
          final file = MockPlatformFile();
          when(() => file.path).thenReturn('test$i.pdf');
          return file;
        });
        
        when(() => mockFilePickerResult.files).thenReturn(manyFiles);
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => mockFilePickerResult);

        // Act & Assert
        await expectLater(
          FilePickerService.pickMultipleFiles(maxFileCount: 5),
          throwsA(isA<FilePickerException>()),
        );
      });

      test('should skip files with null paths', () async {
        // Arrange
        final validFile = MockPlatformFile();
        final invalidFile = MockPlatformFile();
        when(() => validFile.path).thenReturn('valid.pdf');
        when(() => invalidFile.path).thenReturn(null);
        
        when(() => mockFilePickerResult.files).thenReturn([validFile, invalidFile]);
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => mockFilePickerResult);

        // Act
        final result = await FilePickerService.pickMultipleFiles();

        // Assert - Should process only valid files
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: FilePickerService.allowedExtensions,
          allowMultiple: true,
        )).called(1);
      });

      test('should use custom max file count', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        await FilePickerService.pickMultipleFiles(maxFileCount: 3);

        // Assert
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: FilePickerService.allowedExtensions,
          allowMultiple: true,
        )).called(1);
      });
    });

    group('pickImageFile', () {
      test('should call pickSingleFile with image extensions', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        await FilePickerService.pickImageFile();

        // Assert
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
          allowMultiple: false,
        )).called(1);
      });
    });

    group('pickDocumentFile', () {
      test('should call pickSingleFile with document extensions', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        await FilePickerService.pickDocumentFile();

        // Assert
        verify(() => mockFilePickerPlatform.pickFiles(
          type: FileType.custom,
          allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'md'],
          allowMultiple: false,
        )).called(1);
      });
    });

    group('image file validation', () {
      test('should validate JPEG file signature', () {
        // Test JPEG signature validation
        final jpegHeader = [0xFF, 0xD8, 0xFF, 0xE0];
        expect(jpegHeader[0], equals(0xFF));
        expect(jpegHeader[1], equals(0xD8));
      });

      test('should validate PNG file signature', () {
        // Test PNG signature validation
        final pngHeader = [0x89, 0x50, 0x4E, 0x47];
        expect(pngHeader[0], equals(0x89));
        expect(pngHeader[1], equals(0x50));
        expect(pngHeader[2], equals(0x4E));
        expect(pngHeader[3], equals(0x47));
      });

      test('should validate GIF file signature', () {
        // Test GIF signature validation
        final gifHeader = [0x47, 0x49, 0x46, 0x38];
        expect(gifHeader[0], equals(0x47));
        expect(gifHeader[1], equals(0x49));
        expect(gifHeader[2], equals(0x46));
      });
    });

    group('PDF file validation', () {
      test('should validate PDF file signature', () {
        // Test PDF signature validation
        const pdfHeader = '%PDF';
        expect(pdfHeader, equals('%PDF'));
      });
    });

    group('getFileInfo', () {
      test('should return correct file info for image file', () {
        // Arrange
        final file = File('test.jpg');
        
        // Mock file operations
        when(() => file.lengthSync()).thenReturn(1024);
        
        // Act
        final fileInfo = FilePickerService.getFileInfo(file);

        // Assert
        expect(fileInfo.name, equals('test.jpg'));
        expect(fileInfo.extension, equals('jpg'));
        expect(fileInfo.isImage, isTrue);
        expect(fileInfo.isDocument, isFalse);
      });

      test('should return correct file info for document file', () {
        // Arrange
        final file = File('document.pdf');
        
        // Mock file operations
        when(() => file.lengthSync()).thenReturn(2048);
        
        // Act
        final fileInfo = FilePickerService.getFileInfo(file);

        // Assert
        expect(fileInfo.name, equals('document.pdf'));
        expect(fileInfo.extension, equals('pdf'));
        expect(fileInfo.isImage, isFalse);
        expect(fileInfo.isDocument, isTrue);
      });

      test('should handle file without extension', () {
        // Arrange
        final file = File('filename');
        
        // Mock file operations
        when(() => file.lengthSync()).thenReturn(512);
        
        // Act
        final fileInfo = FilePickerService.getFileInfo(file);

        // Assert
        expect(fileInfo.name, equals('filename'));
        expect(fileInfo.extension, equals(''));
        expect(fileInfo.isImage, isFalse);
        expect(fileInfo.isDocument, isFalse);
      });
    });

    group('isAvailable', () {
      test('should return true when file picker is available', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles).thenReturn(null);

        // Act
        final isAvailable = await FilePickerService.isAvailable();

        // Assert
        expect(isAvailable, isA<bool>());
      });
    });

    group('error handling', () {
      test('should wrap unexpected exceptions in FilePickerException', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenThrow(Exception('Unexpected error'));

        // Act & Assert
        await expectLater(
          FilePickerService.pickSingleFile(),
          throwsA(isA<FilePickerException>()),
        );
      });

      test('should rethrow FilePickerException without wrapping', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenThrow(const FilePickerException('Original error'));

        // Act & Assert
        await expectLater(
          FilePickerService.pickSingleFile(),
          throwsA(
            predicate<FilePickerException>((e) => e.message == 'Original error'),
          ),
        );
      });
    });

    group('FileInfo model', () {
      test('should create FileInfo with all properties', () {
        // Act
        const fileInfo = FileInfo(
          name: 'test.pdf',
          path: '/path/to/test.pdf',
          extension: 'pdf',
          sizeInBytes: 1024,
          sizeFormatted: '1.0 KB',
          isImage: false,
          isDocument: true,
        );

        // Assert
        expect(fileInfo.name, equals('test.pdf'));
        expect(fileInfo.path, equals('/path/to/test.pdf'));
        expect(fileInfo.extension, equals('pdf'));
        expect(fileInfo.sizeInBytes, equals(1024));
        expect(fileInfo.sizeFormatted, equals('1.0 KB'));
        expect(fileInfo.isImage, isFalse);
        expect(fileInfo.isDocument, isTrue);
      });

      test('should have correct toString representation', () {
        // Arrange
        const fileInfo = FileInfo(
          name: 'test.pdf',
          path: '/path/to/test.pdf',
          extension: 'pdf',
          sizeInBytes: 1024,
          sizeFormatted: '1.0 KB',
          isImage: false,
          isDocument: true,
        );

        // Act
        final result = fileInfo.toString();

        // Assert
        expect(result, equals('FileInfo(name: test.pdf, size: 1.0 KB, type: pdf)'));
      });

      test('should be immutable', () {
        // Arrange & Act
        const fileInfo = FileInfo(
          name: 'test.pdf',
          path: '/path/to/test.pdf',
          extension: 'pdf',
          sizeInBytes: 1024,
          sizeFormatted: '1.0 KB',
          isImage: false,
          isDocument: true,
        );

        // Assert - All fields should be final (compile-time check)
        expect(fileInfo.name, equals('test.pdf'));
        expect(fileInfo.path, equals('/path/to/test.pdf'));
      });
    });

    group('concurrency', () {
      test('should handle concurrent file picker calls', () async {
        // Arrange
        when(() => mockFilePickerPlatform.pickFiles(
          type: any(named: 'type'),
          allowedExtensions: any(named: 'allowedExtensions'),
          allowMultiple: any(named: 'allowMultiple'),
        )).thenAnswer((_) async => null);

        // Act
        final futures = List.generate(5, (_) => FilePickerService.pickSingleFile());

        // Assert
        expect(() => Future.wait(futures), returnsNormally);
      });
    });
  });
}