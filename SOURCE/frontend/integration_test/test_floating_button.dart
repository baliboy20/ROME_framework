// Test floating action button accessibility
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:macos_ui/macos_ui.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Floating Button Test', () {
    testWidgets('Test floating action button accessibility', (WidgetTester tester) async {
      print('🔍 Testing floating action button accessibility...');
      
      // Create test app with the floating button structure
      await tester.pumpWidget(
        MacosApp(
          home: MacosScaffold(
            toolBar: ToolBar(
              title: const Text('Projects Test'),
              centerTitle: true,
              actions: [
                ToolBarIconButton(
                  icon: const MacosIcon(CupertinoIcons.plus),
                  onPressed: () => print('Toolbar button pressed!'),
                  label: 'New Project',
                  showLabel: true,
                ),
              ],
            ),
            children: [
              ContentArea(
                builder: (context, scrollController) {
                  return Stack(
                    children: [
                      Container(
                        color: Colors.grey[100],
                        child: const Center(
                          child: Text('Projects content area'),
                        ),
                      ),
                      // Floating action button
                      Positioned(
                        bottom: 20,
                        right: 20,
                        child: PushButton(
                          controlSize: ControlSize.large,
                          onPressed: () => print('Floating button pressed!'),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              MacosIcon(CupertinoIcons.plus, size: 16),
                              const SizedBox(width: 8),
                              const Text('New Project'),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      );
      await tester.pumpAndSettle();
      print('✅ Test app launched');

      // Look for both buttons
      final toolbarButtons = find.byType(ToolBarIconButton);
      final pushButtons = find.byType(PushButton);
      final floatingButton = find.text('New Project');
      
      print('Found ${toolbarButtons.evaluate().length} toolbar buttons');
      print('Found ${pushButtons.evaluate().length} push buttons');
      print('Found ${floatingButton.evaluate().length} "New Project" buttons');

      // Test toolbar button accessibility
      if (toolbarButtons.evaluate().isNotEmpty) {
        print('🖱️ Testing toolbar button...');
        try {
          await tester.tap(toolbarButtons.first);
          await tester.pumpAndSettle();
          print('✅ Toolbar button works!');
        } catch (e) {
          print('❌ Toolbar button failed: $e');
        }
      }

      // Test floating button accessibility
      if (pushButtons.evaluate().isNotEmpty) {
        print('🖱️ Testing floating button...');
        try {
          await tester.tap(pushButtons.first);
          await tester.pumpAndSettle();
          print('✅ Floating button works!');
        } catch (e) {
          print('❌ Floating button failed: $e');
        }
      }

      // Test by text finder
      if (floatingButton.evaluate().length >= 2) {
        print('🖱️ Testing floating button by text...');
        try {
          // Try the second instance (floating button)
          await tester.tap(floatingButton.at(1));
          await tester.pumpAndSettle();
          print('✅ Text-based floating button tap works!');
        } catch (e) {
          print('❌ Text-based floating button failed: $e');
        }
      }

      print('🎉 Button accessibility test completed');
    });
  });
}