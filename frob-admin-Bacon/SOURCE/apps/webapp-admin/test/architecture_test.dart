import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

/// Import-boundary guard (DDD Phase 4). Fails the build if the domain layer
/// leaks framework or outer-layer dependencies. The enduring rule: the domain
/// depends on nothing — not Flutter, not data, not presentation.
void main() {
  final domainFiles = Directory('lib/features')
      .listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart') && f.path.contains('/domain/'))
      .toList();

  test('domain files exist to guard', () {
    expect(domainFiles, isNotEmpty, reason: 'expected feature domain files under lib/features/*/domain');
  });

  test('no domain file imports Flutter, data, or presentation', () {
    final violations = <String>[];
    final banned = [
      RegExp(r'''import\s+['"]package:flutter/'''),
      RegExp(r'''import\s+['"]package:flutter_bloc/'''),
      RegExp(r'''import\s+['"][^'"]*/data/'''),
      RegExp(r'''import\s+['"][^'"]*/presentation/'''),
    ];
    for (final f in domainFiles) {
      final src = f.readAsStringSync();
      for (final rule in banned) {
        if (rule.hasMatch(src)) {
          violations.add('${f.path} matches ${rule.pattern}');
        }
      }
    }
    expect(violations, isEmpty, reason: 'domain layer must not depend on outer layers:\n${violations.join('\n')}');
  });
}
