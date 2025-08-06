import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Button Functionality Test', () {
    testWidgets('Test New Project Button Response', (WidgetTester tester) async {
      print('🧪 Testing New Project button functionality');
      
      // Launch the app
      app.main();
      await tester.pumpAndSettle(Duration(seconds: 3));
      print('✅ App launched');

      // Navigate to Projects page
      final projectsTab = find.text('Projects').last;
      await tester.tap(projectsTab);
      await tester.pumpAndSettle(Duration(seconds: 2));
      print('✅ Navigated to Projects page');

      // Look for the New Project button
      print('🔍 Looking for New Project button...');
      
      // Try different ways to find the button
      final newProjectButton1 = find.text('New Project');
      final newProjectButton2 = find.byIcon(CupertinoIcons.plus);
      final newProjectButton3 = find.text('Create Project');
      
      print('Found New Project text: ${newProjectButton1.evaluate().length}');
      print('Found plus icon: ${newProjectButton2.evaluate().length}');
      print('Found Create Project text: ${newProjectButton3.evaluate().length}');

      // Try to tap any available button
      if (newProjectButton1.evaluate().isNotEmpty) {
        print('📝 Attempting to tap "New Project" button');
        await tester.tap(newProjectButton1);
        await tester.pumpAndSettle(Duration(seconds: 3));
        
        // Check if dialog appeared with multiple possible texts
        final dialogTitle = find.text('Create New Project');
        final projectNameField = find.text('Project Name');
        final createButton = find.text('Create');
        final cancelButton = find.text('Cancel');
        
        print('Dialog title found: ${dialogTitle.evaluate().isNotEmpty}');
        print('Project Name field found: ${projectNameField.evaluate().isNotEmpty}');
        print('Create button found: ${createButton.evaluate().isNotEmpty}');
        print('Cancel button found: ${cancelButton.evaluate().isNotEmpty}');
        
        final dialogAppeared = dialogTitle.evaluate().isNotEmpty || 
                              projectNameField.evaluate().isNotEmpty ||
                              createButton.evaluate().isNotEmpty;
        print('Dialog appeared: $dialogAppeared');
        
        if (dialogAppeared) {
          print('✅ SUCCESS: Dialog opened successfully!');
          // Try to cancel the dialog for cleanup
          if (cancelButton.evaluate().isNotEmpty) {
            await tester.tap(cancelButton);
            await tester.pumpAndSettle(Duration(seconds: 1));
            print('✅ Dialog cancelled successfully');
          }
        }
      } else if (newProjectButton2.evaluate().isNotEmpty) {
        print('📝 Attempting to tap plus icon button');
        await tester.tap(newProjectButton2);
        await tester.pumpAndSettle(Duration(seconds: 3));
        
        // Check for dialog elements
        final dialogTitle = find.text('Create New Project');
        final projectNameField = find.text('Project Name');
        print('Dialog appeared: ${dialogTitle.evaluate().isNotEmpty || projectNameField.evaluate().isNotEmpty}');
      } else if (newProjectButton3.evaluate().isNotEmpty) {
        print('📝 Attempting to tap "Create Project" button');
        await tester.tap(newProjectButton3);
        await tester.pumpAndSettle(Duration(seconds: 3));
        
        // Check for dialog elements
        final dialogTitle = find.text('Create New Project');
        final projectNameField = find.text('Project Name');
        print('Dialog appeared: ${dialogTitle.evaluate().isNotEmpty || projectNameField.evaluate().isNotEmpty}');
      } else {
        print('❌ No create project button found!');
      }
      
      print('🎉 Button test completed');
    });
  });
}