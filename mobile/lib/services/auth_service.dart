import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

/// Authentication Service
/// Handles user authentication using Supabase Auth
class AuthService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  
  /// Get current authenticated user
  User? get currentUser => _supabase.auth.currentUser;
  
  /// Check if user is authenticated
  bool get isAuthenticated => currentUser != null;
  
  /// Get current user ID
  String? get userId => currentUser?.id;
  
  /// Sign up with email and password
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    return await _supabase.auth.signUp(
      email: email,
      password: password,
      data: {
        if (fullName != null) 'full_name': fullName,
      },
    );
  }
  
  /// Sign in with email and password
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }
  
  /// Sign out current user
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
  
  /// Listen to authentication state changes
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;
}

