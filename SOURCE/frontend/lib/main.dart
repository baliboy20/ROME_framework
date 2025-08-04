import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Handle Flutter Web trackpad scrolling assertion errors
  if (kIsWeb) {
    FlutterError.onError = (FlutterErrorDetails details) {
      if (details.exception.toString().contains('!identical(kind, PointerDeviceKind.trackpad)')) {
        // Ignore trackpad scrolling assertion errors in Flutter Web
        if (kDebugMode) {
          print('Ignoring Flutter Web trackpad scrolling assertion error');
        }
        return;
      }
      FlutterError.presentError(details);
    };
  }
  
  runApp(
    const ProviderScope(
      child: MediumFlutterExtractorApp(),
    ),
  );
}
