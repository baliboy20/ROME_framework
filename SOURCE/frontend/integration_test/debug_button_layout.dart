// Quick debug script to check button accessibility
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:macos_ui/macos_ui.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  group('Button Layout Debug', () {
    testWidgets('Check New Project button position and clickability', (WidgetTester tester) async {
      print('🔍 Debugging New Project button layout...');
      
      // Create a simple test app to debug the layout issue
      await tester.pumpWidget(
        MacosApp(
          home: MacosScaffold(
            toolBar: ToolBar(
              title: const Text('Projects'),
              centerTitle: true,
              actions: [
                ToolBarIconButton(
                  icon: const MacosIcon(CupertinoIcons.plus),
                  onPressed: () => print('Button pressed!'),
                  label: 'New Project',
                  showLabel: true,
                ),
              ],
            ),
            children: [
              ContentArea(
                builder: (context, scrollController) {
                  return const Center(
                    child: Text('Test Content'),
                  );
                },
              ),
            ],
          ),
        ),
      );
      await tester.pumpAndSettle();
      print('✅ Test app launched');

      // Check for the button directly
      print('✅ Looking for button elements...');

      // Print all available widgets for debugging
      print('🔍 Available widgets:');
      final allWidgets = find.byType(Widget);
      for (var i = 0; i < allWidgets.evaluate().length && i < 20; i++) {
        final widget = allWidgets.evaluate().elementAt(i).widget;
        print('  - ${widget.runtimeType}');
      }

      // Look for toolbar buttons specifically
      print('🔍 Looking for toolbar elements...');
      final toolbarButtons = find.byType(ToolBarIconButton);
      print('Found ${toolbarButtons.evaluate().length} toolbar buttons');
      
      // Look for various button types
      final cupertinoIcons = find.byIcon(CupertinoIcons.plus);
      final textButtons = find.text('New Project');
      
      // Try to tap the toolbar button
      if (toolbarButtons.evaluate().isNotEmpty) {
        print('🖱️ Attempting to tap toolbar button...');
        try {
          await tester.tap(toolbarButtons.first);
          await tester.pumpAndSettle();
          print('✅ Toolbar button tapped successfully!');
        } catch (e) {
          print('❌ Failed to tap toolbar button: $e');
        }
      }
      
      // Try to tap by icon
      if (cupertinoIcons.evaluate().isNotEmpty) {
        print('🖱️ Attempting to tap plus icon...');
        try {
          await tester.tap(cupertinoIcons.first);
          await tester.pumpAndSettle();
          print('✅ Plus icon tapped successfully!');
        } catch (e) {
          print('❌ Failed to tap plus icon: $e');
        }
      }
      
      // Try to tap by text
      if (textButtons.evaluate().isNotEmpty) {
        print('🖱️ Attempting to tap New Project text...');
        try {
          await tester.tap(textButtons.first);
          await tester.pumpAndSettle();
          print('✅ New Project text tapped successfully!');
        } catch (e) {
          print('❌ Failed to tap New Project text: $e');
        }
      }
      
      print('Found ${cupertinoIcons.evaluate().length} Cupertino plus icons');
      print('Found ${textButtons.evaluate().length} "New Project" text');
      
      print('🎉 Layout debugging completed');
    });
  });
}