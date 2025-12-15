import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' show Ref;
import 'package:uuid/uuid.dart';

import '../../../models/chat_models.dart';
import '../../../models/triage_models.dart';
import '../../../services/triage_service.dart';

class ChatState {
  final String sessionId;
  final List<ChatMessage> messages;
  final TriageResponse? triageResponse;
  final bool isLoading;
  final Map<String, dynamic> previousAnswers;

  ChatState({
    required this.sessionId,
    this.messages = const [],
    this.triageResponse,
    this.isLoading = false,
    this.previousAnswers = const {},
  });

  ChatState copyWith({
    String? sessionId,
    List<ChatMessage>? messages,
    TriageResponse? triageResponse,
    bool? isLoading,
    Map<String, dynamic>? previousAnswers,
  }) {
    return ChatState(
      sessionId: sessionId ?? this.sessionId,
      messages: messages ?? this.messages,
      triageResponse: triageResponse ?? this.triageResponse,
      isLoading: isLoading ?? this.isLoading,
      previousAnswers: previousAnswers ?? this.previousAnswers,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final TriageService _triageService;
  final Ref? _ref;

  ChatNotifier({
    TriageService? triageService,
    Ref? ref,
  })  : _triageService = triageService ?? TriageService(ref: ref),
        _ref = ref,
        super(ChatState(sessionId: ''));

  void initializeSession(String sessionId) {
    final id = sessionId.isEmpty ? const Uuid().v4() : sessionId;
    state = ChatState(
      sessionId: id,
      previousAnswers: {},
    );

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
    // Extract answer from user message BEFORE adding it to state
    // Check if the last message was a question (before we add the new user message)
    Map<String, dynamic> answersToSend = Map.from(state.previousAnswers);
    
    // If last message was a question, treat user input as answer
    if (state.messages.isNotEmpty && 
        !state.messages.last.isFromUser &&
        state.triageResponse?.needMoreInfo == true &&
        state.triageResponse?.nextQuestion != null) {
      // Map question to answer key
      String? questionKey = _extractQuestionKey(state.triageResponse?.nextQuestion);
      if (questionKey != null) {
        answersToSend[questionKey] = text;
      }
    }

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

      // Get triage response with accumulated answers
      final triageResponse = await _triageService.submitSymptom(
        sessionId: state.sessionId,
        symptom: text,
        previousAnswers: answersToSend,
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
        previousAnswers: answersToSend,
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

  /// Extract question key from Thai question text
  /// Maps questions to answer keys used by backend
  String? _extractQuestionKey(String? question) {
    if (question == null) return null;
    
    final lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.contains('นานเท่าไหร่') || lowerQuestion.contains('นาน')) {
      return 'duration';
    }
    if (lowerQuestion.contains('แย่ลง') || lowerQuestion.contains('ดีขึ้น') || lowerQuestion.contains('เหมือนเดิม')) {
      return 'severity_trend';
    }
    if (lowerQuestion.contains('กลุ่มเสี่ยง') || lowerQuestion.contains('เด็ก') || lowerQuestion.contains('ผู้สูงอายุ') || lowerQuestion.contains('ตั้งครรภ์')) {
      return 'risk_group';
    }
    if (lowerQuestion.contains('ดูแลตัวเอง') || lowerQuestion.contains('ใช้ยา') || lowerQuestion.contains('ลอง')) {
      return 'self_care_response';
    }
    if (lowerQuestion.contains('อาการอื่นๆ') || lowerQuestion.contains('อาการอื่น') || lowerQuestion.contains('ร่วมด้วย')) {
      return 'associated_symptoms';
    }
    
    return null;
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref: ref);
});
