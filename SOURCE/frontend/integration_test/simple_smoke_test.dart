import 'package:flutter/cupertino.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:project_management_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Simple Smoke Test', () {
    testWidgets('App launches and shows basic UI', (WidgetTester tester) async {
      // Launch the app
      app.main();
      await tester.pumpAndSettle();

      // Verify app launches successfully
      expect(find.text('Dashboard'), findsWidgets);
      expect(find.text('Projects'), findsWidgets);
      expect(find.text('Tasks'), findsWidgets);
      expect(find.text('Journal'), findsWidgets);
      
      // Verify main content is visible
      expect(find.text('Welcome to Project Management'), findsOneWidget);
      
      print('✅ App launched successfully');
      print('✅ Basic navigation elements found');
    });
  });
}