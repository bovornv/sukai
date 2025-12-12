import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../models/chat_models.dart';

class ChatService {
  final Dio _dio;
  final String baseUrl;

  ChatService({
    Dio? dio,
    String? baseUrl,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.baseUrl;

  /// Send chat message to AI doctor
  Future<ChatMessage> sendMessage({
    required String sessionId,
    required String message,
    required List<ChatMessage> history,
  }) async {
    try {
      final response = await _dio.post(
        '$baseUrl/chat/message',
        data: {
          'session_id': sessionId,
          'message': message,
          'history': history.map((m) => m.toJson()).toList(),
        },
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
