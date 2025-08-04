import 'dart:html' as html;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/theme/app_theme.dart';
import 'package:medium_flutter_extractor/core/utils/error_boundary.dart';
import 'package:medium_flutter_extractor/presentation/pages/home_page.dart';

class MediumFlutterExtractorApp extends ConsumerWidget {
  const MediumFlutterExtractorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Medium Flutter Link Extractor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: ErrorBoundary(
        fallback: (error, stackTrace) => CupertinoPageScaffold(
          backgroundColor: CupertinoColors.systemBackground,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  CupertinoIcons.exclamationmark_triangle,
                  size: 64,
                  color: CupertinoColors.systemRed,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Application Error',
                  style: TextStyle(
                    fontFamily: 'Comic Sans MS',
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: CupertinoColors.label,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'The application has encountered a critical error.\nPlease refresh the page to try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Comic Sans MS',
                    fontSize: 16,
                    color: CupertinoColors.secondaryLabel,
                  ),
                ),
                const SizedBox(height: 24),
                CupertinoButton.filled(
                  onPressed: () {
                    // In web, this will reload the page
                    html.window.location.reload();
                  },
                  child: const Text(
                    'Reload Page',
                    style: TextStyle(
                      fontFamily: 'Comic Sans MS',
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        child: const HomePage(),
      ),
    );
  }
}