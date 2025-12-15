import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase Configuration
/// Update these values with your Supabase project credentials
class SupabaseConfig {
  // TODO: Replace with your actual Supabase URL
  // Get from: Supabase Dashboard → Project Settings → API → Project URL
  static const String supabaseUrl = 'https://uuuqpiaclmleclsylfqh.supabase.co';
  
  // TODO: Replace with your actual Supabase Anon Key
  // Get from: Supabase Dashboard → Project Settings → API → anon public key
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwaWFjbG1sZWNsc3lsZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDM3MDMsImV4cCI6MjA4MTAwMzcwM30.RrmaQtOxugrSEdYaLchh6-Wk8u1km0LIt2BMZR6UHTw';
  
  /// Initialize Supabase
  /// Call this in main() before runApp()
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }
  
  /// Get Supabase client instance
  static SupabaseClient get client => Supabase.instance.client;
}

