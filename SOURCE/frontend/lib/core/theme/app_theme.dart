import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class AppTheme {
  // Grayish Maroon and Muted Straw color palette
  static const CupertinoDynamicColor _primaryColor = CupertinoDynamicColor.withBrightness(
    color: Color(0xFF6B3C4D), // Grayish Maroon
    darkColor: Color(0xFF8B4C5D),
  );
  
  static const CupertinoDynamicColor _secondaryColor = CupertinoDynamicColor.withBrightness(
    color: Color(0xFFDDD2B8), // Muted Straw (less yellow)
    darkColor: Color(0xFFCDC2A8),
  );

  // Comic Sans text theme - playful and distinctive
  static const TextTheme _comicSansTextTheme = TextTheme(
    displayLarge: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 34,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.5,
    ),
    displayMedium: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 28,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.3,
    ),
    displaySmall: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 22,
      fontWeight: FontWeight.bold,
      letterSpacing: 0.2,
    ),
    headlineLarge: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 20,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
    ),
    headlineMedium: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 18,
      fontWeight: FontWeight.w600,
    ),
    headlineSmall: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 16,
      fontWeight: FontWeight.w600,
    ),
    titleLarge: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 17,
      fontWeight: FontWeight.w500,
    ),
    titleMedium: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 16,
      fontWeight: FontWeight.w500,
    ),
    titleSmall: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 15,
      fontWeight: FontWeight.w500,
    ),
    bodyLarge: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 17,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.2,
    ),
    bodyMedium: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 15,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.1,
    ),
    bodySmall: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 13,
      fontWeight: FontWeight.w400,
    ),
    labelLarge: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 15,
      fontWeight: FontWeight.w500,
    ),
    labelMedium: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 13,
      fontWeight: FontWeight.w500,
    ),
    labelSmall: TextStyle(
      fontFamily: 'Comic Sans MS',
      fontSize: 11,
      fontWeight: FontWeight.w500,
    ),
  );

  static ThemeData get lightTheme {
    return ThemeData(
      // Grayish Maroon and Muted Straw color scheme
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF6B3C4D), // Grayish Maroon
        secondary: Color(0xFFDDD2B8), // Muted Straw
        surface: Color(0xFFF8F5F0), // Light muted straw background
        background: Color(0xFFFBF9F6), // Soft warm white
        onPrimary: Colors.white,
        onSecondary: Color(0xFF6B3C4D), // Grayish maroon on muted straw
        onSurface: Color(0xFF4A2832), // Dark grayish maroon
        onBackground: Color(0xFF4A2832), // Dark grayish maroon
        outline: Color(0xFFCDC2A8), // Darker muted straw for borders
      ),
      
      // Comic Sans text theme
      textTheme: _comicSansTextTheme,
      
      // Muted straw and grayish maroon app bar
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFDDD2B8), // Muted straw background
        foregroundColor: Color(0xFF6B3C4D), // Grayish maroon text
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Color(0xFF6B3C4D), // Grayish maroon
        ),
      ),
      
      // Muted straw-themed cards
      cardTheme: CardThemeData(
        color: Color(0xFFF8F5F0), // Light muted straw
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFCDC2A8), width: 0.5), // Darker muted straw border
        ),
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      ),
      
      // Grayish maroon buttons with Comic Sans
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF6B3C4D), // Grayish maroon
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily: 'Comic Sans MS',
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      
      // Muted straw input fields with grayish maroon focus
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFFF8F5F0), // Light muted straw fill
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: Color(0xFF6B3C4D), width: 2), // Grayish maroon focus
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        hintStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          color: Color(0xFF8E8E93),
        ),
      ),
      
      // Muted straw-themed dividers
      dividerTheme: const DividerThemeData(
        color: Color(0xFFCDC2A8), // Darker muted straw
        thickness: 0.5,
        space: 1,
      ),
      
      // Tab bar theme for better visibility
      tabBarTheme: const TabBarThemeData(
        labelColor: Color(0xFF4A2832), // Dark grayish maroon for selected tab
        unselectedLabelColor: Color(0xFF6B3C4D), // Grayish maroon for unselected tabs
        indicatorColor: Color(0xFF6B3C4D), // Grayish maroon indicator
        labelStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        dividerColor: Color(0xFFCDC2A8), // Darker muted straw divider
      ),
      
      useMaterial3: false, // Use Material 2 for more iOS-like feel
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      // Dark grayish maroon and muted straw colors
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF8B4C5D), // Dark grayish maroon
        secondary: Color(0xFFCDC2A8), // Dark muted straw
        surface: Color(0xFF2A1F1B), // Dark brown with gray
        background: Color(0xFF1D1511), // Very dark brown with gray
        onPrimary: Colors.white,
        onSecondary: Color(0xFF1D1511),
        onSurface: Color(0xFFF8F5F0), // Light muted straw text
        onBackground: Color(0xFFF8F5F0), // Light muted straw text
        outline: Color(0xFF5A4842), // Medium grayish brown outline
      ),
      
      // Comic Sans text theme (dark)
      textTheme: _comicSansTextTheme.apply(
        bodyColor: const Color(0xFFFDF8E8),
        displayColor: const Color(0xFFFDF8E8),
      ),
      
      // Dark muted straw and grayish maroon app bar
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF2A1F1B), // Dark grayish brown
        foregroundColor: Color(0xFFF8F5F0), // Light muted straw
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Color(0xFFF8F5F0), // Light muted straw
        ),
      ),
      
      // Dark muted straw-themed cards
      cardTheme: CardThemeData(
        color: const Color(0xFF2A1F1B), // Dark grayish brown
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF5A4842), width: 0.5), // Medium grayish brown border
        ),
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
      ),
      
      // Dark grayish maroon buttons with Comic Sans
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF8B4C5D), // Dark grayish maroon
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily: 'Comic Sans MS',
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      
      // Dark muted straw input fields with grayish maroon focus
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF2A1F1B), // Dark grayish brown fill
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
          borderSide: BorderSide(color: Color(0xFF8B4C5D), width: 2), // Dark grayish maroon focus
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        hintStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          color: Color(0xFF8E8E93),
        ),
      ),
      
      // Dark muted straw-themed dividers
      dividerTheme: const DividerThemeData(
        color: Color(0xFF5A4842), // Medium grayish brown
        thickness: 0.5,
        space: 1,
      ),
      
      // Dark tab bar theme for better visibility
      tabBarTheme: const TabBarThemeData(
        labelColor: Color(0xFFF8F5F0), // Light muted straw for selected tab
        unselectedLabelColor: Color(0xFFCDC2A8), // Dark muted straw for unselected tabs
        indicatorColor: Color(0xFF8B4C5D), // Dark grayish maroon indicator
        labelStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: 'Comic Sans MS',
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        dividerColor: Color(0xFF5A4842), // Medium grayish brown divider
      ),
      
      useMaterial3: false, // Use Material 2 for more iOS-like feel
    );
  }
}