import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../models/chat_models.dart';
import '../../../models/triage_models.dart';
import '../../../services/triage_service.dart';

class ChatState {
  final String sessionId;
  final List<ChatMessage> messages;
  final TriageResponse? triageResponse;
  final bool isLoading;

  ChatState({
    required this.sessionId,
    this.messages = const [],
    this.triageResponse,
    this.isLoading = false,
  });

  ChatState copyWith({
    String? sessionId,
    List<ChatMessage>? messages,
    TriageResponse? triageResponse,
    bool? isLoading,
  }) {
    return ChatState(
      sessionId: sessionId ?? this.sessionId,
      messages: messages ?? this.messages,
      triageResponse: triageResponse ?? this.triageResponse,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final TriageService _triageService;

  ChatNotifier({
    TriageService? triageService,
  })  : _triageService = triageService ?? TriageService(),
        super(ChatState(sessionId: ''));

  void initializeSession(String sessionId) {
    final id = sessionId.isEmpty ? const Uuid().v4() : sessionId;
    state = ChatState(sessionId: id);

    // Send welcome message
    final welcomeMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: 'สวัสดีค่ะ หมอจะช่วยประเมินอาการของคุณ\nบอกอาการที่คุณรู้สึกได้เลยนะคะ',
      isFromUser: false,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(messages: [welcomeMessage]);
  }

  Future<void> sendMessage(String text) async {
    // Add user message
    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      isFromUser: true,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isLoading: true,
    );

    try {
      // Get triage response
      final triageResponse = await _triageService.submitSymptom(
        sessionId: state.sessionId,
        symptom: text,
      );

      String? responseText;

      if (triageResponse.needMoreInfo && triageResponse.nextQuestion != null) {
        responseText = triageResponse.nextQuestion;
      } else {
        // Triage complete, get diagnosis
        final diagnosis = await _triageService.getDiagnosis(
          sessionId: state.sessionId,
        );
        responseText = 'ประเมินเสร็จแล้วค่ะ ${diagnosis.summary}';
      }

      final doctorMessage = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: responseText ?? 'เข้าใจแล้วค่ะ',
        isFromUser: false,
        timestamp: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, doctorMessage],
        triageResponse: triageResponse,
        isLoading: false,
      );
    } catch (e) {
      final errorMessage = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        isFromUser: false,
        timestamp: DateTime.now(),
      );

      state = state.copyWith(
        messages: [...state.messages, errorMessage],
        isLoading: false,
      );
    }
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});
