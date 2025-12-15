import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' show Ref;
import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';
import '../models/session_models.dart';

/// Sessions Service
/// Handles fetching past triage sessions
class SessionsService {
  final Dio _dio;
  final String baseUrl;
  final Ref? _ref;
  
  SessionsService({
    Dio? dio,
    String? baseUrl,
    Ref? ref,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.baseUrl,
        _ref = ref;
  
  /// Get user's past triage sessions
  Future<List<TriageSession>> getSessions() async {
    try {
      final userId = _ref?.read(authProvider).userId;
      if (userId == null) return [];
      
      final headers = <String, String>{
        'x-user-id': userId,
      };
      
      final response = await _dio.get(
        '$baseUrl/triage/sessions',
        options: Options(headers: headers),
      );
      
      final sessions = (response.data['sessions'] as List? ?? [])
          .map((json) => TriageSession.fromJson(json))
          .toList();
      
      return sessions;
    } catch (e) {
      // Return empty list on error
      return [];
    }
  }
}

