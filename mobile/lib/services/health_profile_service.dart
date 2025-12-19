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
    final profile = await getHealthProfile(userId);
    return profile?.isComplete ?? false;
  }
}

