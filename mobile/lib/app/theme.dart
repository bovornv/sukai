import 'package:flutter/material.dart';

class AppTheme {
  // Kakao-inspired colors (Medical-grade, high-contrast)
  // Yellow = accent only (CTA, highlight) - NOT for text on white
  static const Color primaryYellow = Color(0xFFFFE812);
  static const Color green = Color(0xFF34C759); // 🟢 Safe
  static const Color amber = Color(0xFFFF9500); // 🟡 Caution
  static const Color red = Color(0xFFFF3B30); // 🔴 Emergency
  static const Color yellow = Color(0xFFFFCC00);
  
  // Background: off-white / warm gray
  static const Color backgroundColor = Color(0xFFFAFAFA);
  static const Color cardBackground = Color(0xFFFFFFFF);
  
  // Primary text: dark gray / near black (not pure black for readability)
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textTertiary = Color(0xFF999999);
  
  // Navigation colors (high contrast)
  static const Color navInactive = Color(0xFF999999);
  static const Color navActive = Color(0xFF1A1A1A);

  // Triage level colors (Medical states)
  static Color getTriageColor(String triageLevel) {
    switch (triageLevel) {
      case 'self_care':
        return green; // 🟢 Safe
      case 'pharmacy':
        return amber; // 🟡 Caution
      case 'gp':
        return amber; // 🟡 Caution
      case 'emergency':
        return red; // 🔴 Emergency
      case 'uncertain':
        return amber; // 🟡 Caution (default to caution for safety)
      default:
        return amber;
    }
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'NotoSansThai',
      fontFamilyFallback: const ['sans-serif'], // Fallback for missing characters
      colorScheme: ColorScheme.light(
        primary: primaryYellow,
        secondary: green,
        error: red,
        surface: cardBackground,
      ),
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: cardBackground, // White background (not yellow)
        foregroundColor: textPrimary, // Dark text
        elevation: 1, // Subtle shadow
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: cardBackground,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      textTheme: TextTheme(
        displayLarge: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          height: 1.3, // Better line height for Thai
        ),
        displayMedium: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          height: 1.4,
        ),
        titleLarge: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          height: 1.4,
        ),
        titleMedium: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
          height: 1.5,
        ),
        bodyLarge: const TextStyle(
          fontSize: 18,
          color: textPrimary,
          height: 1.6, // Increased for readability
        ),
        bodyMedium: const TextStyle(
          fontSize: 16,
          color: textPrimary,
          height: 1.6,
        ),
        bodySmall: const TextStyle(
          fontSize: 14,
          color: textSecondary,
          height: 1.5,
        ),
        labelMedium: const TextStyle(
          fontSize: 12,
          color: textTertiary,
          height: 1.4,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryYellow,
          foregroundColor: textPrimary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14), // More padding
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600, // Medium-bold for better readability
          ),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardBackground,
        selectedItemColor: navActive,
        unselectedItemColor: navInactive,
        selectedLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
        ),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}
