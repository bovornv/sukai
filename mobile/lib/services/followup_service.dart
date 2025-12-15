import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';

/// Follow-up Status Enum
enum FollowupStatus {
  better('better'),
  same('same'),
  worse('worse');
  
  final String value;
  const FollowupStatus(this.value);
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
        baseUrl = baseUrl ?? ApiConfig.baseUrl,
        _ref = ref;
  
  /// Submit a follow-up check-in
  Future<bool> submitCheckin({
    required String sessionId,
    required FollowupStatus status,
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

