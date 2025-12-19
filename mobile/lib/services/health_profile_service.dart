import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/health_profile.dart';

/// Health Profile Service
/// Handles CRUD operations for user health profiles
class HealthProfileService {
  final SupabaseClient _supabase = SupabaseConfig.client;

  /// Get current user's health profile
  Future<HealthProfile?> getHealthProfile(String userId) async {
    try {
      final response = await _supabase
          .from('user_profiles')
          .select()
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (response == null) return null;
      return HealthProfile.fromJson(response);
    } catch (e) {
      print('Error fetching health profile: $e');
      // Return null if error (profile doesn't exist or can't be fetched)
      return null;
    }
  }

  /// Save or update health profile
  Future<void> saveHealthProfile(String userId, HealthProfile profile) async {
    try {
      final data = profile.toJson();
      data['id'] = userId;
      data['updated_at'] = DateTime.now().toIso8601String();

      // Use upsert to insert or update
      await _supabase.from('user_profiles').upsert(
        data,
        onConflict: 'id',
      );
    } catch (e) {
      print('Error saving health profile: $e');
      rethrow;
    }
  }

  /// Check if health profile is complete
  Future<bool> isHealthProfileComplete(String userId) async {
    try {
      final profile = await getHealthProfile(userId);
      
      // If no profile exists, return false
      if (profile == null) {
        print('Health profile check: No profile found for user $userId - BLOCKING ACCESS');
        return false;
      }
      
      // Check completeness using the model's isComplete property
      final isComplete = profile.isComplete;
      print('Health profile check for $userId: isComplete=$isComplete');
      print('Profile details: fullName="${profile.fullName}", gender=${profile.gender}, birthDate=${profile.birthDate}, weightKg=${profile.weightKg}, heightCm=${profile.heightCm}');
      
      // Double-check: explicitly verify all required fields
      if (profile.fullName == null || profile.fullName!.isEmpty) {
        print('Health profile incomplete: missing fullName - BLOCKING ACCESS');
        return false;
      }
      if (profile.gender == null) {
        print('Health profile incomplete: missing gender - BLOCKING ACCESS');
        return false;
      }
      if (profile.birthDate == null) {
        print('Health profile incomplete: missing birthDate - BLOCKING ACCESS');
        return false;
      }
      if (profile.weightKg == null || profile.weightKg! <= 0) {
        print('Health profile incomplete: missing or invalid weightKg - BLOCKING ACCESS');
        return false;
      }
      if (profile.heightCm == null || profile.heightCm! <= 0) {
        print('Health profile incomplete: missing or invalid heightCm - BLOCKING ACCESS');
        return false;
      }
      
      print('Health profile complete - ALLOWING ACCESS');
      return true;
    } catch (e) {
      print('Error checking health profile completeness: $e - BLOCKING ACCESS');
      return false; // Block access on error (safety first)
    }
  }
}

