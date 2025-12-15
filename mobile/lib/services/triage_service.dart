import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' show Ref;

import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';
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
        baseUrl = baseUrl ?? ApiConfig.baseUrl,
        _ref = ref;

  /// Get user ID from auth provider
  String? _getUserId() {
    if (_ref == null) return null;
    return _ref!.read(authProvider).userId;
  }

  /// Submit symptom and get triage response
  /// Returns TriageResponse with need_more_info, next_question, and triage_level
  Future<TriageResponse> submitSymptom({
    required String sessionId,
    required String symptom,
    Map<String, dynamic>? previousAnswers,
  }) async {
    try {
      final headers = <String, String>{};
      final userId = _getUserId();
      if (userId != null) {
        headers['x-user-id'] = userId;
      }

      final response = await _dio.post(
        '$baseUrl/triage/assess',
        data: {
          'session_id': sessionId,
          'symptom': symptom,
          'previous_answers': previousAnswers ?? {},
        },
        options: Options(headers: headers),
      );

      return TriageResponse.fromJson(response.data);
    } catch (e) {
      // Fallback for development
      return _mockTriageResponse(symptom);
    }
  }

  /// Get final diagnosis with recommendations
  Future<DiagnosisResponse> getDiagnosis({
    required String sessionId,
  }) async {
    try {
      final headers = <String, String>{};
      final userId = _getUserId();
      if (userId != null) {
        headers['x-user-id'] = userId;
      }

      final response = await _dio.get(
        '$baseUrl/triage/diagnosis',
        queryParameters: {'session_id': sessionId},
        options: Options(headers: headers),
      );

      return DiagnosisResponse.fromJson(response.data);
    } catch (e) {
      // Fallback for development
      return _mockDiagnosisResponse();
    }
  }

  // Mock responses for development
  TriageResponse _mockTriageResponse(String symptom) {
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
