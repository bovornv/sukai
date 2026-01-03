import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' show Ref;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';
import '../providers/selected_profile_provider.dart';
import '../models/triage_models.dart';

class TriageService {
  final Dio _dio;
  final String baseUrl;
  final Ref? _ref;

  TriageService({
    Dio? dio,
    String? baseUrl,
    Ref? ref,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.privateBaseUrl,
        _ref = ref;

  /// Get profile ID for assessment (selected profile or fallback to user ID)
  /// This ensures the assessment uses the correct profile's health data
  String? _getProfileId() {
    if (_ref == null) return null;
    
    // First, try to get selected profile ID
    final selectedProfile = _ref!.read(selectedProfileProvider);
    if (selectedProfile != null) {
      return selectedProfile.id;
    }
    
    // Fallback to user ID if no profile selected (for backward compatibility)
    return _ref!.read(authProvider).userId;
  }

  /// Submit symptom and get triage response
  /// Returns TriageResponse with need_more_info, next_question, and triage_level
  /// If symptom is empty, backend will treat this as an answer to a question
  Future<TriageResponse> submitSymptom({
    required String sessionId,
    required String symptom, // Empty string for answers (not first input)
    Map<String, dynamic>? previousAnswers,
  }) async {
    try {
      final headers = <String, String>{};
      final profileId = _getProfileId();
      if (profileId != null) {
        headers['x-user-id'] = profileId; // Backend uses x-user-id for profile lookup
      }

      // Get current language preference
      final prefs = await SharedPreferences.getInstance();
      final language = prefs.getString('app_language') ?? 'th';
      headers['x-language'] = language; // Send language to backend

      final response = await _dio.post(
        '$baseUrl/triage/assess',
        data: {
          'session_id': sessionId,
          'symptom': symptom,
          'previous_answers': previousAnswers ?? {},
          'language': language, // Also include in body for compatibility
        },
        options: Options(headers: headers),
      );

      return TriageResponse.fromJson(response.data);
    } catch (e) {
      // Log error to help debug
      print('❌ TriageService Error: $e');
      print('❌ Error details: ${e.toString()}');
      if (e is DioException) {
        print('❌ DioException - Status: ${e.response?.statusCode}, Message: ${e.message}');
        print('❌ Response data: ${e.response?.data}');
      }
      // Fallback for development - but log that we're using mock
      print('⚠️ Using mock response - backend call failed!');
      return _mockTriageResponse(symptom);
    }
  }

  /// Get final diagnosis with recommendations
  Future<DiagnosisResponse> getDiagnosis({
    required String sessionId,
  }) async {
    try {
      final headers = <String, String>{};
      final profileId = _getProfileId();
      if (profileId != null) {
        headers['x-user-id'] = profileId; // Backend uses x-user-id for profile lookup
      }

      // Get current language preference
      final prefs = await SharedPreferences.getInstance();
      final language = prefs.getString('app_language') ?? 'th';
      headers['x-language'] = language; // Send language to backend

      final response = await _dio.get(
        '$baseUrl/triage/diagnosis',
        queryParameters: {
          'session_id': sessionId,
          'language': language, // Include language in query params
        },
        options: Options(headers: headers),
      );

      return DiagnosisResponse.fromJson(response.data);
    } catch (e) {
      // Fallback for development
      return _mockDiagnosisResponse();
    }
  }

  // Mock responses for development
  // CRITICAL: This should NOT be used if backend is running!
  // If you see this, the backend call failed - check error logs
  TriageResponse _mockTriageResponse(String symptom) {
    print('⚠️⚠️⚠️ USING MOCK RESPONSE - Backend call failed! ⚠️⚠️⚠️');
    print('⚠️ This means the backend at $baseUrl is not responding');
    print('⚠️ Check: 1) Is backend running? 2) Is baseUrl correct? 3) CORS issues?');
    
    // Simple mock logic - in production, this comes from backend
    final lowerSymptom = symptom.toLowerCase();
    
    if (lowerSymptom.contains('เจ็บ') || lowerSymptom.contains('ปวด')) {
      return const TriageResponse(
        needMoreInfo: true,
        nextQuestion: 'อาการปวดเป็นมานานเท่าไหร่แล้วคะ?',
        triageLevel: TriageLevel.uncertain,
      );
    }
    
    return TriageResponse(
      needMoreInfo: false,
      nextQuestion: null,
      triageLevel: TriageLevel.selfCare,
    );
  }

  DiagnosisResponse _mockDiagnosisResponse() {
    return DiagnosisResponse(
      triageLevel: TriageLevel.selfCare,
      summary: 'อาการไม่รุนแรง ดูแลที่บ้านได้',
      recommendations: const Recommendations(
        homeCare: [
          'พักผ่อนให้เพียงพอ',
          'ดื่มน้ำมากๆ',
          'รับประทานอาหารอ่อน',
        ],
        otcMeds: [
          'พาราเซตามอล (ถ้ามีไข้)',
          'ยาลดน้ำมูก (ถ้ามีน้ำมูก)',
        ],
        whenToSeeDoctor: [
          'อาการไม่ดีขึ้นภายใน 2-3 วัน',
          'มีไข้สูงกว่า 38.5 องศา',
        ],
        dangerSigns: [
          'หายใจลำบาก',
          'ปวดมากจนทนไม่ไหว',
        ],
        additionalAdvice: [
          'หลีกเลี่ยงการออกกำลังกายหนัก',
          'สังเกตอาการอย่างใกล้ชิด',
        ],
      ),
    );
  }
}
