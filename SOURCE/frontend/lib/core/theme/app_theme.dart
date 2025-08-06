import 'package:flutter/cupertino.dart';
import 'package:macos_ui/macos_ui.dart';

class AppTheme {
  // Custom color palette - Pale Straw and Grey Maroon
  static const Color paleStraw = Color(0xFFF5F4E8);      // Light cream/pale straw
  static const Color paleStrawDark = Color(0xFFEAE8D8);  // Slightly darker straw
  static const Color greyMaroon = Color(0xFF6B4C57);     // Grey maroon primary
  static const Color greyMaroonLight = Color(0xFF8B6C77); // Lighter grey maroon
  static const Color greyMaroonDark = Color(0xFF4B2C37);  // Darker grey maroon
  
  // Additional supporting colors
  static const Color strawAccent = Color(0xFFF0EDD4);    // Accent straw
  static const Color softGrey = Color(0xFFE5E5E5);       // Soft grey for borders
  static const Color darkText = Color(0xFF2C2C2C);       // Dark text
  static const Color lightText = Color(0xFF7A7A7A);      // Light text

  static MacosThemeData get lightTheme {
    return MacosThemeData.light().copyWith(
      // Primary colors
      primaryColor: greyMaroon,
      canvasColor: paleStraw,
      
      // Background and surface colors
      brightness: Brightness.light,
      
      // Push button theme with custom colors
      pushButtonTheme: PushButtonThemeData(
        color: greyMaroon,
        disabledColor: greyMaroonLight.withValues(alpha: 0.3),
        secondaryColor: paleStrawDark,
      ),
      
      // Help button theme
      helpButtonTheme: HelpButtonThemeData(
        color: greyMaroon,
        disabledColor: greyMaroonLight.withValues(alpha: 0.3),
      ),
      
      // Divider color
      dividerColor: greyMaroonLight.withValues(alpha: 0.2),
    );
  }

  static MacosThemeData get darkTheme {
    return MacosThemeData.dark().copyWith(
      // Primary colors for dark theme
      primaryColor: greyMaroonLight,
      canvasColor: greyMaroonDark,
      
      // Push button theme for dark mode
      pushButtonTheme: PushButtonThemeData(
        color: greyMaroonLight,
        disabledColor: greyMaroon.withValues(alpha: 0.3),
        secondaryColor: greyMaroon,
      ),
      
      // Help button theme for dark mode
      helpButtonTheme: HelpButtonThemeData(
        color: greyMaroonLight,
        disabledColor: greyMaroon.withValues(alpha: 0.3),
      ),
      
      // Divider color for dark mode
      dividerColor: paleStraw.withValues(alpha: 0.2),
    );
  }

  // Status colors using the theme palette
  static const Color successColor = Color(0xFF8B9D6B);   // Muted green that complements the palette
  static const Color warningColor = Color(0xFFD4A574);   // Warm amber
  static const Color errorColor = Color(0xFFB85450);     // Muted red
  static const Color infoColor = Color(0xFF6B7D8B);      // Muted blue-grey

  // Priority colors for tasks
  static const Color lowPriorityColor = Color(0xFF8B9D6B);    // Soft green
  static const Color mediumPriorityColor = Color(0xFFD4A574); // Warm amber
  static const Color highPriorityColor = Color(0xFFB85450);   // Muted red
  static const Color criticalPriorityColor = Color(0xFF8B4C57); // Deep maroon

  // Status colors for projects/tasks
  static const Color planningColor = Color(0xFFD4A574);   // Warm amber
  static const Color activeColor = Color(0xFF6B7D8B);     // Blue-grey
  static const Color completedColor = Color(0xFF8B9D6B);  // Soft green
  static const Color onHoldColor = Color(0xFFB85450);     // Muted red
  static const Color cancelledColor = Color(0xFF7A7A7A);  // Grey
}