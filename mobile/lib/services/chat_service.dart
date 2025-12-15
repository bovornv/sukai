import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' show Ref;

import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';
import '../models/chat_models.dart';

class ChatService {
  final Dio _dio;
  final String baseUrl;
  final Ref? _ref;

  ChatService({
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

  /// Send chat message to AI doctor
  Future<ChatMessage> sendMessage({
    required String sessionId,
    required String message,
    required List<ChatMessage> history,
  }) async {
    try {
      final headers = <String, String>{};
      final userId = _getUserId();
      if (userId != null) {
        headers['x-user-id'] = userId;
      }

      final response = await _dio.post(
        '$baseUrl/chat/message',
        data: {
          'session_id': sessionId,
          'message': message,
          'history': history.map((m) => m.toJson()).toList(),
        },
        options: Options(headers: headers),
      );

      return ChatMessage.fromJson(response.data);
    } catch (e) {
      // Fallback for development
      return _mockChatResponse(message);
    }
  }

  ChatMessage _mockChatResponse(String userMessage) {
    final lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.contains('วินิจฉัย') || lowerMessage.contains('เป็นอะไร')) {
      return ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: 'หมอขอประเมินระดับความเร่งด่วนก่อนนะคะ',
        isFromUser: false,
        timestamp: DateTime.now(),
      );
    }
    
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: 'เข้าใจแล้วค่ะ ขอถามเพิ่มเติมอีกนิดนะคะ',
      isFromUser: false,
      timestamp: DateTime.now(),
    );
  }
}
