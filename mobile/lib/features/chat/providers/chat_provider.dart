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
  final bool isFirstInput; // Track if this is the first symptom input
  final String? currentSymptom; // Track the symptom being assessed
  final bool allowMultiSelect; // Master Prompt: Step 5 allows multi-select

  ChatState({
    required this.sessionId,
    this.messages = const [],
    this.triageResponse,
    this.isLoading = false,
    this.previousAnswers = const {},
    this.isFirstInput = true, // Start as true
    this.currentSymptom,
    this.allowMultiSelect = false, // Default to single-select
  });

  ChatState copyWith({
    String? sessionId,
    List<ChatMessage>? messages,
    TriageResponse? triageResponse,
    bool? isLoading,
    Map<String, dynamic>? previousAnswers,
    bool? isFirstInput,
    String? currentSymptom,
    bool? allowMultiSelect,
  }) {
    return ChatState(
      sessionId: sessionId ?? this.sessionId,
      messages: messages ?? this.messages,
      triageResponse: triageResponse ?? this.triageResponse,
      isLoading: isLoading ?? this.isLoading,
      previousAnswers: previousAnswers ?? this.previousAnswers,
      isFirstInput: isFirstInput ?? this.isFirstInput,
      currentSymptom: currentSymptom ?? this.currentSymptom,
      allowMultiSelect: allowMultiSelect ?? this.allowMultiSelect,
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

  void initializeSession(String sessionId, {String? welcomeMessageText}) {
    final id = sessionId.isEmpty ? const Uuid().v4() : sessionId;
    state = ChatState(
      sessionId: id,
      previousAnswers: {},
    );

    // Send welcome message (use provided text or default)
    final welcomeMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: welcomeMessageText ?? 'สวัสดีค่ะ แจ้งอาการของคุณได้เลยนะคะ',
      isFromUser: false,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      messages: [welcomeMessage],
      isFirstInput: true, // Reset to first input for new session
    );
  }

  Future<void> sendMessage(String text) async {
    // Determine if this is the first symptom input (free text)
    final isFirstSymptomInput = state.isFirstInput;
    
    // Extract answer from user message BEFORE adding it to state
    Map<String, dynamic> answersToSend = Map.from(state.previousAnswers);
    String? symptomToSend;
    
    if (isFirstSymptomInput) {
      // First input: treat as symptom
      symptomToSend = text;
      // Store symptom in state for display
      state = state.copyWith(currentSymptom: text);
    } else {
      // Subsequent inputs: treat as answer to last question
      if (state.messages.isNotEmpty && 
          !state.messages.last.isFromUser &&
          state.triageResponse?.needMoreInfo == true &&
          state.triageResponse?.nextQuestion != null) {
        // Map question to answer key
        String? questionKey = _extractQuestionKey(state.triageResponse?.nextQuestion);
        if (questionKey != null) {
          answersToSend[questionKey] = text;
        } else {
          // Fallback: use generic answer key
          answersToSend['last_answer'] = text;
        }
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
      // Get triage response
      // For first input: send symptom
      // For subsequent: send answers (backend will use session to get symptom)
      final triageResponse = await _triageService.submitSymptom(
        sessionId: state.sessionId,
        symptom: (symptomToSend ?? '').toString(), // Ensure it's always a string
        previousAnswers: answersToSend,
      );

      String? responseText;
      List<String>? questionOptions;
      
      if (triageResponse.needMoreInfo && triageResponse.nextQuestion != null) {
        responseText = triageResponse.nextQuestion;
        
        // CRITICAL IMPROVEMENT: Use structured question choices if available (Master Prompt)
        // This ensures UI uses backend-provided answer choices instead of generating its own
        if (triageResponse.structuredQuestion != null) {
          questionOptions = triageResponse.structuredQuestion!.choices;
          print('[CHAT-PROVIDER] Using structured question choices: ${questionOptions.length} options from step ${triageResponse.structuredQuestion!.step}');
        } else {
          // Fallback: Generate multiple choice options from question text (backward compatibility)
          questionOptions = _generateQuestionOptions(triageResponse.nextQuestion!);
          print('[CHAT-PROVIDER] Generated answer choices from question text (fallback)');
        }
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
        options: questionOptions, // Add options for multiple choice
      );

      state = state.copyWith(
        messages: [...state.messages, doctorMessage],
        triageResponse: triageResponse,
        previousAnswers: answersToSend,
        isLoading: false,
        // Disable free text after first question is received (not after first input sent)
        isFirstInput: false, // After receiving first question, disable free text
        // Master Prompt: Enable multi-select for Step 5 (hypothesis-targeted)
        allowMultiSelect: triageResponse.structuredQuestion?.allowMultiSelect ?? false,
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

  /// Generate multiple choice options from question text
  /// Extracts common answer patterns from Thai medical questions
  List<String> _generateQuestionOptions(String question) {
    final lowerQuestion = question.toLowerCase();
    final options = <String>[];

    // Yes/No questions
    if (lowerQuestion.contains('ไหม') || 
        lowerQuestion.contains('หรือไม่') ||
        lowerQuestion.contains('มี') ||
        lowerQuestion.contains('ใช่')) {
      options.addAll(['ใช่', 'ไม่', 'ไม่แน่ใจ']);
    }
    // Duration questions
    else if (lowerQuestion.contains('นาน') || 
             lowerQuestion.contains('เมื่อไหร่') ||
             lowerQuestion.contains('เท่าไหร่')) {
      options.addAll(['ไม่นาน (น้อยกว่า 1 วัน)', '1-3 วัน', '4-7 วัน', 'มากกว่า 1 สัปดาห์']);
    }
    // Severity/Trajectory questions
    else if (lowerQuestion.contains('แย่ลง') || 
             lowerQuestion.contains('ดีขึ้น') ||
             lowerQuestion.contains('เหมือนเดิม') ||
             lowerQuestion.contains('รุนแรง')) {
      options.addAll(['ดีขึ้น', 'เหมือนเดิม', 'แย่ลง', 'ไม่แน่ใจ']);
    }
    // Severity level questions
    else if (lowerQuestion.contains('รุนแรง') || 
             lowerQuestion.contains('มาก') ||
             lowerQuestion.contains('น้อย')) {
      options.addAll(['ไม่มาก', 'ปานกลาง', 'ค่อนข้างรุนแรง', 'รุนแรงมาก']);
    }
    // Age/Risk group questions
    else if (lowerQuestion.contains('อายุ') || 
             lowerQuestion.contains('เด็ก') ||
             lowerQuestion.contains('ผู้สูงอายุ')) {
      options.addAll(['เด็ก (< 12 ปี)', 'วัยรุ่น (13-18 ปี)', 'ผู้ใหญ่ (19-64 ปี)', 'ผู้สูงอายุ (65+ ปี)']);
    }
    // Frequency questions
    else if (lowerQuestion.contains('บ่อย') || 
             lowerQuestion.contains('ครั้ง')) {
      options.addAll(['ครั้งเดียว', '2-3 ครั้ง', 'หลายครั้งต่อวัน', 'ตลอดเวลา']);
    }
    // Default: Yes/No/Not sure
    else {
      options.addAll(['ใช่', 'ไม่', 'ไม่แน่ใจ']);
    }

    return options;
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref: ref);
});
