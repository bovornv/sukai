import 'package:flutter/material.dart';

class AppTheme {
  // Kakao-inspired colors
  static const Color primaryYellow = Color(0xFFFFE812);
  static const Color green = Color(0xFF34C759);
  static const Color yellow = Color(0xFFFFCC00);
  static const Color red = Color(0xFFFF3B30);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF000000);
  static const Color textSecondary = Color(0xFF666666);

  // Triage level colors
  static Color getTriageColor(String triageLevel) {
    switch (triageLevel) {
      case 'self_care':
        return green;
      case 'pharmacy':
        return yellow;
      case 'gp':
        return yellow;
      case 'emergency':
        return red;
      case 'uncertain':
        return Colors.orange;
      default:
        return primaryYellow;
    }
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: primaryYellow,
        secondary: green,
        error: red,
        surface: cardBackground,
      ),
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryYellow,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: cardBackground,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displayMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 18,
          color: textPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 16,
          color: textPrimary,
        ),
        bodySmall: TextStyle(
          fontSize: 14,
          color: textSecondary,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryYellow,
          foregroundColor: textPrimary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
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
