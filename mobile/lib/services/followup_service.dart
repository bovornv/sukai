import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';

/// Follow-up Status Enum
enum FollowupStatus {
  better('better'),
  same('same'),
  worse('worse'),
  unsure('unsure');
  
  final String value;
  const FollowupStatus(this.value);
}

/// Follow-up Action Enum
enum FollowupAction {
  homeCare('home_care'),
  medication('medication'),
  doctor('doctor'),
  emergency('emergency'),
  nothing('nothing');
  
  final String value;
  const FollowupAction(this.value);
}

/// Follow-up Next Intent Enum
enum FollowupIntent {
  recheck('recheck'),
  medication('medication'),
  selfcare('selfcare'), // New: ดูคำแนะนำอื่น (self-care guidance)
  previous('previous'),
  nothing('nothing');
  
  final String value;
  const FollowupIntent(this.value);
}

/// Follow-up Service
/// Handles follow-up check-ins for triage sessions
class FollowupService {
  final Dio _dio;
  final String baseUrl;
  final WidgetRef? _ref;
  
  FollowupService({
    Dio? dio,
    String? baseUrl,
    WidgetRef? ref,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.privateBaseUrl,
        _ref = ref;
  
  /// Submit a follow-up check-in
  Future<bool> submitCheckin({
    required String sessionId,
    required FollowupStatus status,
    List<FollowupAction>? actionsTaken,
    FollowupIntent? nextIntent,
    String? notes,
  }) async {
    try {
      final userId = _ref?.read(authProvider).userId;
      
      final headers = <String, String>{};
      if (userId != null) {
        headers['x-user-id'] = userId;
      }
      
      await _dio.post(
        '$baseUrl/followup/checkin',
        data: {
          'session_id': sessionId,
          'status': status.value,
          'actions_taken': actionsTaken?.map((a) => a.value).toList(),
          'next_intent': nextIntent?.value,
          'notes': notes,
        },
        options: Options(headers: headers),
      );
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /// Get follow-up check-ins for a session
  Future<List<Map<String, dynamic>>> getCheckins(String sessionId) async {
    try {
      final userId = _ref?.read(authProvider).userId;
      
      final headers = <String, String>{};
      if (userId != null) {
        headers['x-user-id'] = userId;
      }
      
      final response = await _dio.get(
        '$baseUrl/followup/checkins',
        queryParameters: {'session_id': sessionId},
        options: Options(headers: headers),
      );
      
      return List<Map<String, dynamic>>.from(response.data['checkins'] ?? []);
    } catch (e) {
      return [];
    }
  }
}

