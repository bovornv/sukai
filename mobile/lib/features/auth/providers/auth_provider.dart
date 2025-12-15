import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../services/auth_service.dart';

/// Authentication State
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  
  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });
  
  /// Check if user is authenticated
  bool get isAuthenticated => user != null;
  
  /// Get user ID
  String? get userId => user?.id;
  
  /// Get user email
  String? get userEmail => user?.email;
}

/// Authentication Notifier
/// Manages authentication state and operations
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  
  AuthNotifier(this._authService) : super(AuthState()) {
    _init();
  }
  
  /// Initialize auth state and listen to changes
  void _init() {
    // Set initial user
    state = AuthState(user: _authService.currentUser);
    
    // Listen to auth state changes
    _authService.authStateChanges.listen((authState) {
      state = AuthState(user: authState.session?.user);
    });
  }
  
  /// Sign up with email and password
  Future<void> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    state = AuthState(isLoading: true);
    try {
      final response = await _authService.signUp(
        email: email,
        password: password,
        fullName: fullName,
      );
      
      // Check if email confirmation is required
      if (response.user != null) {
        // User created successfully
        state = AuthState(user: response.user);
      } else {
        // Email confirmation required
        state = AuthState(
          error: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี',
        );
      }
    } catch (e) {
      // Parse error message for better UX
      String errorMessage = _parseError(e.toString());
      state = AuthState(error: errorMessage);
    }
  }
  
  /// Parse error messages to show user-friendly Thai messages
  String _parseError(String error) {
    final lowerError = error.toLowerCase();
    
    if (lowerError.contains('email') && lowerError.contains('already')) {
      return 'อีเมลนี้ถูกใช้งานแล้ว';
    }
    if (lowerError.contains('password') && lowerError.contains('weak')) {
      return 'รหัสผ่านอ่อนเกินไป กรุณาใช้รหัสผ่านที่แข็งแรงกว่า';
    }
    if (lowerError.contains('invalid') && lowerError.contains('email')) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (lowerError.contains('401') || lowerError.contains('unauthorized')) {
      return 'ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบการตั้งค่า Supabase Auth';
    }
    if (lowerError.contains('network') || lowerError.contains('connection')) {
      return 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    
    // Return original error if no match
    return error;
  }
  
  /// Sign in with email and password
  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    state = AuthState(isLoading: true);
    try {
      final response = await _authService.signIn(
        email: email,
        password: password,
      );
      state = AuthState(user: response.user);
    } catch (e) {
      // Parse error message for better UX
      String errorMessage = _parseSignInError(e.toString());
      state = AuthState(error: errorMessage);
    }
  }
  
  /// Parse sign-in error messages
  String _parseSignInError(String error) {
    final lowerError = error.toLowerCase();
    
    if (lowerError.contains('invalid') && lowerError.contains('credentials')) {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    }
    if (lowerError.contains('email') && lowerError.contains('not confirmed')) {
      return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
    }
    if (lowerError.contains('user') && lowerError.contains('not found')) {
      return 'ไม่พบผู้ใช้ กรุณาสมัครสมาชิกก่อน';
    }
    if (lowerError.contains('network') || lowerError.contains('connection')) {
      return 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    
    return error;
  }
  
  /// Sign out current user
  Future<void> signOut() async {
    await _authService.signOut();
    state = AuthState();
  }
}

/// Auth Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(AuthService());
});

