import 'package:equatable/equatable.dart';

/// FR-001 workstream 5 — what the server made of an imported HTML document.
///
/// Every field here exists because the sponsor's own reference file had a
/// problem that would otherwise have reached a customer silently: images that
/// most mail clients cannot display, a message too large for Gmail to show in
/// full, and merge fields that resolve to nothing.
class HtmlImportReport extends Equatable {
  final int originalBytes;
  final int processedBytes;
  final int imagesHosted;

  /// Fields the document uses that this email does NOT supply. These are the
  /// dangerous ones: at send time an unknown field becomes an empty string, so
  /// the customer sees a blank gap and nothing reports a fault.
  final List<String> unknownFields;

  /// Fields that will fill correctly — shown so coverage is visible, not just
  /// problems.
  final List<String> knownFields;

  final List<String> notes;

  const HtmlImportReport({
    required this.originalBytes,
    required this.processedBytes,
    required this.imagesHosted,
    required this.unknownFields,
    required this.knownFields,
    required this.notes,
  });

  factory HtmlImportReport.fromJson(Map<String, dynamic> j) => HtmlImportReport(
        originalBytes: (j['originalBytes'] as num?)?.toInt() ?? 0,
        processedBytes: (j['processedBytes'] as num?)?.toInt() ?? 0,
        imagesHosted: (j['imagesHosted'] as num?)?.toInt() ?? 0,
        unknownFields: ((j['unknownFields'] as List?) ?? const []).map((e) => '$e').toList(),
        knownFields: ((j['knownFields'] as List?) ?? const []).map((e) => '$e').toList(),
        notes: ((j['notes'] as List?) ?? const []).map((e) => '$e').toList(),
      );

  bool get hasProblems => unknownFields.isNotEmpty;
  int get bytesSaved => (originalBytes - processedBytes).clamp(0, originalBytes);

  /// Percentage the document shrank by. Useful because the headline result of
  /// an import is usually the size collapse (707KB → 14KB on the reference
  /// file), which is what keeps Gmail from truncating the email.
  int get percentSmaller =>
      originalBytes == 0 ? 0 : ((bytesSaved / originalBytes) * 100).round();

  @override
  List<Object?> get props =>
      [originalBytes, processedBytes, imagesHosted, unknownFields, knownFields, notes];
}

String formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
