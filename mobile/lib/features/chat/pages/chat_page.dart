import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/chat_models.dart';
import '../../../providers/language_provider.dart';
import '../../../services/symptom_suggestion_service.dart';
import '../../../models/symptom_suggestion.dart';
import '../../../widgets/health_profile_gate.dart';
import '../../../widgets/app_bottom_navigation.dart';
import '../../../widgets/profile_selection_gate.dart';
import '../../profile/providers/health_profile_provider.dart';
import '../providers/chat_provider.dart';
import '../../home/providers/sessions_provider.dart';
import '../../../models/session_models.dart';
import 'package:intl/intl.dart';

class ChatPage extends ConsumerStatefulWidget {
  final String? sessionId;

  const ChatPage({
    super.key,
    this.sessionId,
  });

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final TextEditingController _textController = TextEditingController();
  bool _isLoading = false;
  List<SymptomSuggestion> _symptomSuggestions = [];
  bool _showSuggestions = false;
  String _typedWord = ''; // Locked typed word (shown in gray/charcoal)
  Timer? _debounceTimer; // Debounce timer for suggestions
  Set<String> _selectedAnswers = {}; // Master Prompt: Multi-select for Step 5
  bool _isStep5FreeTextMode = false; // Track when user starts typing in Step 5
  String? _lastSessionId; // Track last sessionId to detect changes
  final GlobalKey _suggestionsKey = GlobalKey(); // Key for scrolling to suggestions
  bool _isLoadingBodySystemSuggestions = false; // Flag to prevent _onTextChanged from overwriting body system suggestions
  String _previousText = ''; // Track previous text to detect actual changes

  @override
  void initState() {
    super.initState();
    _textController.addListener(_onTextChanged);
    _lastSessionId = widget.sessionId;
    // Show default suggestions when page loads (empty input)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadDefaultSuggestions();
      }
    });
  }

  @override
  void didUpdateWidget(ChatPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If sessionId changed, reset everything for new assessment
    if (oldWidget.sessionId != widget.sessionId && widget.sessionId != null) {
      _lastSessionId = widget.sessionId;
      // Reset UI state
      setState(() {
        _typedWord = '';
        _showSuggestions = false;
        _symptomSuggestions = [];
        _isStep5FreeTextMode = false;
        _selectedAnswers.clear();
        _textController.clear();
        _previousText = ''; // Reset previous text
      });
      // Reinitialize with new sessionId
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(chatProvider.notifier).initializeSession(widget.sessionId ?? '');
          _loadDefaultSuggestions();
        }
      });
    }
  }

  void _initializeChat(AppLocalizations l10n) {
    // No welcome message needed - Page 1 shows title and helper text directly
    ref.read(chatProvider.notifier).initializeSession(
      widget.sessionId ?? '',
      welcomeMessageText: '', // Empty - we'll show title/helper text in UI instead
    );
  }

  Future<void> _loadDefaultSuggestions() async {
    final currentLocale = ref.read(languageProvider);
    final language = currentLocale.languageCode;
    final suggestions = await SymptomSuggestionService.getSuggestions('', language: language);
    if (mounted) {
      setState(() {
        _symptomSuggestions = suggestions;
        _showSuggestions = suggestions.isNotEmpty;
      });
    }
  }

  void _onTextChanged() {
    // CRITICAL: Don't overwrite suggestions if we're loading from body system click
    if (_isLoadingBodySystemSuggestions) {
      return; // Ignore text changes while loading body system suggestions
    }
    
    final currentText = _textController.text;
    
    // CRITICAL: Only process if text actually changed (not just focus/click)
    if (currentText == _previousText) {
      return; // Text hasn't changed, just focus/click event - don't update suggestions
    }
    
    // Update previous text
    _previousText = currentText;
    
    final chatState = ref.read(chatProvider);
    
    // Cancel previous debounce timer
    _debounceTimer?.cancel();
    
    // Check if we're in Step 5 (hypothesis-targeted) and user starts typing
    final isStep5 = chatState.allowMultiSelect && 
                     chatState.triageResponse?.structuredQuestion?.step == 5;
    
    // Enable Step 5 free text mode when user starts typing
    if (isStep5 && currentText.isNotEmpty && !_isStep5FreeTextMode) {
      setState(() {
        _isStep5FreeTextMode = true;
      });
    }
    
    // Show suggestions during first input OR Step 5 free text mode
    final shouldShowSuggestions = chatState.isFirstInput || _isStep5FreeTextMode;
    
    if (shouldShowSuggestions && currentText.isNotEmpty) {
      final inputText = currentText.trim();
      
      // Lock the typed word (show in gray/charcoal)
      setState(() {
        _typedWord = inputText;
        _showSuggestions = false; // Hide suggestions while typing
      });
      
      // Debounce: Wait 600ms after user stops typing before showing suggestions (doctor-like pause)
      // CRITICAL: Each keystroke cancels previous timer and starts new one
      // This ensures suggestions only appear after user pauses typing
      _debounceTimer = Timer(const Duration(milliseconds: 600), () async {
        if (!mounted || _isLoadingBodySystemSuggestions) return; // Don't overwrite if body system is loading
        
        // Check 1: Verify text hasn't changed during debounce delay (user might have typed again)
        final currentTextAfterDebounce = _textController.text.trim();
        if (currentTextAfterDebounce != inputText) {
          // User typed again during debounce - ignore this timer, let next one handle it
          return;
        }
        
        final currentLocale = ref.read(languageProvider);
        final language = currentLocale.languageCode;
        
        // Generate clinical-grade suggestions (8-12 items with context)
        final suggestions = await SymptomSuggestionService.getSuggestions(inputText, language: language);
        
        // Check 2: Verify text still matches after async API call (user might have typed during API call)
        if (mounted && !_isLoadingBodySystemSuggestions) {
          final finalTextCheck = _textController.text.trim();
          if (finalTextCheck == inputText) {
            // Text matches at all checkpoints - safe to update suggestions
            setState(() {
              _symptomSuggestions = suggestions;
              _showSuggestions = suggestions.isNotEmpty;
            });
          }
          // If text changed during API call, don't update - let next debounce handle it
        }
      });
    } else if (shouldShowSuggestions && currentText.isEmpty) {
      // Show default suggestions when input is empty
      if (chatState.isFirstInput) {
        _loadDefaultSuggestions();
      } else {
        // Step 5: Clear suggestions when input is cleared
        setState(() {
          _showSuggestions = false;
          _typedWord = '';
        });
      }
    } else {
      setState(() {
        _typedWord = '';
        _showSuggestions = false;
      });
    }
  }

  void _selectSuggestion(SymptomSuggestion suggestion) {
    if (_isLoading) return;
    
    final symptomText = suggestion.displayText;
    final chatState = ref.read(chatProvider);
    final isStep5Mode = _isStep5FreeTextMode;
    
    setState(() {
      _showSuggestions = false;
      _typedWord = '';
      _textController.clear();
      _previousText = ''; // Reset previous text
      _isStep5FreeTextMode = false; // Exit Step 5 free text mode
    });

    // Send selected suggestion
    // If Step 5 mode, treat as answer; otherwise treat as symptom
    ref.read(chatProvider.notifier).sendMessage(symptomText).then((_) {
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
      });
      if (!isStep5Mode) {
        _checkTriageComplete();
      }
    }).catchError((error) {
    if (!mounted) return;
      
      setState(() {
        _isLoading = false;
      });
    });
  }

  void _selectAnswer(String answer) {
    if (_isLoading) return;
    
    final chatState = ref.read(chatProvider);
    final allowMultiSelect = chatState.allowMultiSelect;
    
    // Master Prompt: Step 5 allows multi-select
    if (allowMultiSelect) {
      setState(() {
        if (_selectedAnswers.contains(answer)) {
          _selectedAnswers.remove(answer); // Deselect if already selected
        } else {
          _selectedAnswers.add(answer); // Select
        }
      });
      
      // Don't send immediately - wait for user to confirm selection
      // Show "Submit" button when at least one option is selected
      return;
    }
    
    // Single-select: Send immediately
    setState(() {
      _isLoading = true;
      _selectedAnswers.clear(); // Clear multi-select state
      _isStep5FreeTextMode = false; // Reset Step 5 free text mode
    });

    ref.read(chatProvider.notifier).sendMessage(answer).then((_) {
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
        _selectedAnswers.clear(); // Clear after sending
      });
      _checkTriageComplete();
    }).catchError((error) {
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
      });
    });
  }
  
  /// Submit multi-select answers (Master Prompt Step 5)
  void _submitMultiSelectAnswers() {
    // Reset Step 5 free text mode when submitting answers
    setState(() {
      _isStep5FreeTextMode = false;
    });
    if (_selectedAnswers.isEmpty || _isLoading) return;
    
    // Join selected answers with comma (backend will parse)
    final answerText = _selectedAnswers.join(', ');
    
    setState(() {
      _isLoading = true;
    });

    ref.read(chatProvider.notifier).sendMessage(answerText).then((_) {
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
        _selectedAnswers.clear(); // Clear after sending
      });
      _checkTriageComplete();
    }).catchError((error) {
      if (!mounted) return;
      
      setState(() {
        _isLoading = false;
      });
    });
  }

  void _checkTriageComplete() {
    // Check if triage is complete after a delay to allow state to update
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      
      final state = ref.read(chatProvider);
      // Check if triage is complete (no more questions needed)
      if (state.triageResponse != null && 
          state.triageResponse!.needMoreInfo == false &&
          state.triageResponse!.nextQuestion == null) {
        // Navigate to summary
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            final sessionId = widget.sessionId ?? state.sessionId;
            context.push('/summary?sessionId=$sessionId');
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _textController.removeListener(_onTextChanged);
    _textController.dispose();
    super.dispose();
  }

  Widget _buildEmergencyBanner(AppLocalizations l10n, bool isThai) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.statusEmergency.withValues(alpha: 0.1),
        border: Border(
          bottom: BorderSide(
            color: AppTheme.statusEmergency.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning_amber_rounded,
            color: AppTheme.statusEmergency,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isThai
                  ? 'หากมีอาการฉุกเฉิน กรุณาโทร 1669 หรือไปโรงพยาบาลทันที'
                  : 'For emergencies, please call 1669 or go to the hospital immediately',
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.statusEmergency,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final chatState = ref.watch(chatProvider);
    final isCompleteAsync = ref.watch(healthProfileCompleteProvider);
    
    // Gate: Check health profile and profile selection before allowing chat
    return isCompleteAsync.when(
      data: (isComplete) {
        if (isComplete != true) {
          return HealthProfileGate(
            featureName: 'แชทแพทย์ AI',
            child: ProfileSelectionGate(
              featureName: 'แชทแพทย์ AI',
              child: _buildChatContent(context, chatState, l10n),
            ),
          );
        }
        return ProfileSelectionGate(
          featureName: 'แชทแพทย์ AI',
          child: _buildChatContent(context, chatState, l10n),
        );
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) {
        return HealthProfileGate(
          featureName: 'แชทแพทย์ AI',
          child: ProfileSelectionGate(
            featureName: 'แชทแพทย์ AI',
            child: _buildChatContent(context, chatState, l10n),
          ),
        );
      },
    );
  }
  
  Widget _buildChatContent(BuildContext context, ChatState chatState, AppLocalizations l10n) {
    // Initialize chat session if needed
    // CRITICAL: Always reinitialize if sessionId changed (new assessment)
    final providedSessionId = widget.sessionId ?? '';
    final sessionIdChanged = providedSessionId.isNotEmpty && chatState.sessionId != providedSessionId;
    final needsReinit = chatState.sessionId.isEmpty || 
        sessionIdChanged ||
        (chatState.messages.isEmpty && chatState.sessionId.isNotEmpty && !_isLoading);
    
    if (needsReinit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          // If sessionId changed, force reinitialize with new sessionId
          if (sessionIdChanged) {
            // Reset state and initialize with new sessionId
            ref.read(chatProvider.notifier).initializeSession(providedSessionId);
            // Reset UI state
            setState(() {
              _typedWord = '';
              _showSuggestions = false;
              _symptomSuggestions = [];
              _isStep5FreeTextMode = false;
              _selectedAnswers.clear();
              _textController.clear();
            });
            // Load default suggestions for new session
            _loadDefaultSuggestions();
          } else if (chatState.messages.isEmpty) {
            _initializeChat(l10n);
          }
        }
      });
    }
    
    // Listen for emergency detection - immediate transition
    ref.listen<ChatState>(chatProvider, (previous, next) {
      final triageResponse = next.triageResponse;
      
      // Reset Step 5 free text mode when new question arrives (not Step 5)
      if (triageResponse?.structuredQuestion != null) {
        final currentStep = triageResponse?.structuredQuestion?.step;
        if (currentStep != null && currentStep != 5 && _isStep5FreeTextMode) {
          setState(() {
            _isStep5FreeTextMode = false;
            _textController.clear();
            _typedWord = '';
            _showSuggestions = false;
          });
        }
      }
      
      // Emergency detected - transition immediately
      if (triageResponse != null && 
          triageResponse.triageLevel.value == 'emergency' &&
          previous?.triageResponse?.triageLevel.value != 'emergency' &&
          !next.isFirstInput) {
        // Emergency screen will be shown in build method
        setState(() {
          _isStep5FreeTextMode = false;
        });
        return;
      }
      
      // Triage completed (non-emergency) - navigate to summary
      if (triageResponse != null && 
          triageResponse.needMoreInfo == false && 
          triageResponse.nextQuestion == null &&
          triageResponse.triageLevel.value != 'emergency' &&
          previous?.triageResponse?.needMoreInfo == true) {
        setState(() {
          _isStep5FreeTextMode = false;
        });
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted && !_isLoading) {
            final sessionId = widget.sessionId ?? next.sessionId;
            context.push('/summary?sessionId=$sessionId');
          }
        });
      }
    });

    final currentLocale = ref.watch(languageProvider);
    final isThai = currentLocale.languageCode == 'th';

    // Check for emergency - show emergency screen immediately
    if (chatState.triageResponse != null && 
        chatState.triageResponse!.triageLevel.value == 'emergency' &&
        !chatState.isFirstInput) {
      return _buildEmergencyScreen(isThai);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          // Page 1: "ตรวจอาการ", Page 2+: "กำลังประเมินอาการ"
          chatState.isFirstInput 
              ? (isThai ? 'ตรวจอาการ' : 'Symptom Assessment')
              : (isThai ? 'กำลังประเมินอาการ' : 'Assessing Symptoms'),
        ),
        leading: chatState.isFirstInput 
            ? IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
              )
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  // Confirm exit during assessment
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Text(isThai ? 'ยืนยันการออก' : 'Confirm Exit'),
                      content: Text(
                        isThai 
                            ? 'การประเมินจะไม่ถูกบันทึก หากต้องการออกกรุณายืนยัน'
                            : 'Assessment will not be saved. Do you want to exit?',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: Text(isThai ? 'ยกเลิก' : 'Cancel'),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                            context.pop();
                          },
                          child: Text(isThai ? 'ออก' : 'Exit'),
                        ),
                      ],
                    ),
                  );
                },
        ),
        actions: [
          // Language toggle button
          IconButton(
            icon: Text(
              isThai ? 'EN' : 'TH',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.primary, // Primary color (calm blue-green)
              ),
            ),
            onPressed: () {
              ref.read(languageProvider.notifier).toggleLanguage();
            },
            tooltip: isThai ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย',
          ),
        ],
      ),
      body: Column(
        children: [
          // Emergency Disclaimer Banner (Always visible during assessment)
          _buildEmergencyBanner(l10n, isThai),
          // Page 1: Redesigned Assessment Entry with Hero Search + Smart Suggestions
          if (chatState.isFirstInput) ...[
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Hero Search Section
                    _buildHeroSearchSection(l10n, isThai),
                    const SizedBox(height: 24),
                    // Common Symptoms Chips
                    _buildCommonSymptomsSection(l10n, isThai),
                    const SizedBox(height: 32),
                    // Body Systems Grid
                    _buildBodySystemsSection(l10n, isThai),
                    const SizedBox(height: 24),
                    // Typed word (if user started typing)
                    if (_typedWord.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: _buildTypedWord(_typedWord, isThai),
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Smart suggestions (when typing)
                    if (_showSuggestions && _symptomSuggestions.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: _buildSymptomSuggestions(key: _suggestionsKey),
                      ),
                      const SizedBox(height: 16),
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            // Input area (fixed at bottom)
            _buildInputArea(l10n),
          ] else if (_isStep5FreeTextMode) ...[
            // Step 5 Free Text Mode: Show input area and suggestions
            // Helper text (top)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              alignment: Alignment.centerLeft,
              child: Text(
                isThai 
                    ? 'พิมพ์อาการเพิ่มเติม เช่น ปวดหัว ไข้ เจ็บคอ'
                    : 'Type additional symptoms, e.g., headache, fever, sore throat',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
            // Input area
            _buildInputArea(l10n),
            // Typed word (locked, shown in gray/charcoal - non-clickable)
            if (_typedWord.isNotEmpty)
              _buildTypedWord(_typedWord, isThai),
            // Vertical suggestions list
            Expanded(
              child: _showSuggestions && _symptomSuggestions.isNotEmpty
                ? SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                    child: _buildSymptomSuggestions(),
                  )
                : const SizedBox.shrink(),
            ),
          ] else if (_isStep5FreeTextMode && !chatState.isLoading) ...[
            // Step 5 Free Text Mode: Show input area and suggestions
            // Helper text (top)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              alignment: Alignment.centerLeft,
              child: Text(
                isThai 
                    ? 'พิมพ์อาการเพิ่มเติม เช่น ปวดหัว ไข้ เจ็บคอ'
                    : 'Type additional symptoms, e.g., headache, fever, sore throat',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ),
            // Input area
            _buildInputArea(l10n),
            // Typed word (locked, shown in gray/charcoal - non-clickable)
            if (_typedWord.isNotEmpty)
              _buildTypedWord(_typedWord, isThai),
            // Vertical suggestions list
            Expanded(
              child: _showSuggestions && _symptomSuggestions.isNotEmpty
                ? SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                    child: _buildSymptomSuggestions(),
                  )
                : const SizedBox.shrink(),
            ),
          ] else if (chatState.isLoading) ...[
            // Loading state: Show symptom context and loading indicator
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (chatState.currentSymptom != null)
                      _buildSymptomContext(chatState.currentSymptom!, isThai),
                    const SizedBox(height: 40),
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      isThai ? 'กำลังประเมิน...' : 'Assessing...',
                      style: TextStyle(
                        fontSize: 15,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            // Single question view: Symptom context + Current question + Answer choices
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Symptom context (top, subtle)
                    if (chatState.currentSymptom != null)
                      _buildSymptomContext(chatState.currentSymptom!, isThai),
                    
                    const SizedBox(height: 32),
                    
                    // Current question (center, clear)
                    if (chatState.triageResponse?.nextQuestion != null)
                      _buildCurrentQuestion(chatState.triageResponse!.nextQuestion!, isThai),
                    
                    const SizedBox(height: 32),
                    
                    // Answer choices (below question)
                    if (chatState.messages.isNotEmpty && 
                        chatState.messages.last.options != null &&
                        chatState.messages.last.options!.isNotEmpty)
                      _buildAnswerChoices(chatState.messages.last.options!, isThai),
                    
                    // Footer hint (optional, based on question step)
                    if (chatState.triageResponse?.structuredQuestion != null)
                      _buildFooterHint(chatState.triageResponse!.structuredQuestion!.step, isThai),
                    
                    // Step 5: Show input area if user hasn't started typing yet
                    if (chatState.allowMultiSelect && 
                        chatState.triageResponse?.structuredQuestion?.step == 5 &&
                        !_isStep5FreeTextMode &&
                        !chatState.isLoading) ...[
                      const SizedBox(height: 32),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.cardBackground,
                          borderRadius: BorderRadius.circular(6), // Notion-style: 6px
                          border: Border.all(
                            color: AppTheme.borderLight,
                            width: 1, // Consistent border width
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              isThai 
                                  ? 'หรือพิมพ์อาการเพิ่มเติม'
                                  : 'Or type additional symptoms',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _textController,
                              decoration: InputDecoration(
                                hintText: isThai 
                                    ? 'เช่น ปวดหัว ไข้ เจ็บคอ'
                                    : 'e.g., headache, fever, sore throat',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(6), // Notion-style: 6px
                                  borderSide: BorderSide(color: AppTheme.borderLight, width: 1),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(6), // Notion-style: 6px
                                  borderSide: BorderSide(color: AppTheme.borderLight, width: 1),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(6), // Notion-style: 6px
                                  borderSide: BorderSide(color: AppTheme.primary, width: 2), // Primary color when focused
                                ),
                                filled: true,
                                fillColor: AppTheme.gray1,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 14,
                                ),
                                hintStyle: TextStyle(
                                  color: AppTheme.textTertiary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w400,
                                  height: 1.5,
                                ),
                              ),
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppTheme.textPrimary,
                                height: 1.5,
                              ),
                              maxLines: null,
                            ),
                          ],
                        ),
                      ),
                    ],
                    
                    // No footer - no progress bar, no question count, no timer
                    // (Progress must feel natural, not pressured)
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
      // No bottom navigation during assessment (per wireframe spec)
      bottomNavigationBar: null,
    );
  }

  // Welcome message removed - Page 1 now shows title and helper text directly

  /// Symptom context (top, subtle)
  Widget _buildSymptomContext(String symptom, bool isThai) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA), // Muted background per wireframe
        borderRadius: BorderRadius.circular(8), // 8px radius per wireframe
      ),
      child: Text(
        isThai ? 'อาการ: $symptom' : 'Symptom: $symptom',
        style: TextStyle(
          fontSize: 13, // 13px per wireframe
          color: AppTheme.textTertiary, // Tertiary color for muted style
          fontWeight: FontWeight.w400, // Regular weight
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  /// Current question (center, clear) - Large, readable text
  Widget _buildCurrentQuestion(String question, bool isThai) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.circular(16), // Rounded corners (14-16px)
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04), // Soft shadow
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        question,
        style: const TextStyle(
          fontSize: 22, // 22px per wireframe (increased from 20px)
          color: AppTheme.textPrimary,
          height: 1.4, // Tighter line height for headings
          fontWeight: FontWeight.w600, // Semibold for headings
          letterSpacing: -0.2, // Notion-style tighter spacing
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  /// Answer choices (below question) - Full-width buttons
  /// Master Prompt: Supports multi-select for Step 5 (hypothesis-targeted)
  Widget _buildAnswerChoices(List<String> options, bool isThai) {
    final chatState = ref.read(chatProvider);
    final allowMultiSelect = chatState.allowMultiSelect;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...options.map((option) {
          final isSelected = _selectedAnswers.contains(option);
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: SizedBox(
              width: double.infinity, // Full-width
              height: 64, // 64px minimum height per wireframe
              child: OutlinedButton(
                onPressed: _isLoading ? null : () => _selectAnswer(option),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: isSelected ? AppTheme.navActive : AppTheme.borderLight,
                    width: isSelected ? 1.5 : 1,
                  ),
                  foregroundColor: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                  backgroundColor: isSelected ? const Color(0xFFE8F5E9) : AppTheme.cardBackground, // Light mint for selected per wireframe
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12), // Rounded corners
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (allowMultiSelect)
                      Icon(
                        isSelected ? Icons.check_circle : Icons.circle_outlined,
                        size: 20,
                        color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                      ),
                    if (allowMultiSelect) const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        option,
                        style: TextStyle(
                          fontSize: 16, // 16px per wireframe (reduced from 17px)
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          height: 1.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
        
        // Master Prompt: Submit button for multi-select (Step 5)
        if (allowMultiSelect && _selectedAnswers.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitMultiSelectAnswers,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.navActive, // Dark gray (Notion-style, no blue)
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12), // Rounded corners
                  ),
                ),
                child: Text(
                  isThai ? 'ต่อไป' : 'Continue',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  // Reassurance message removed per wireframe - no reassurance shown during questions

  /// Footer hint - Optional explanatory text to help user decide
  Widget _buildFooterHint(int step, bool isThai) {
    final l10n = AppLocalizations.of(context);
    String? hintText;
    
    // Map step numbers to appropriate hints based on wireframe
    switch (step) {
      case 2: // Body part localization
        hintText = l10n.translate('assessment_hint_body_part');
        break;
      case 3: // Onset / Time course
        hintText = l10n.translate('assessment_hint_onset');
        break;
      case 4: // Severity
        hintText = l10n.translate('assessment_hint_severity');
        break;
      case 5: // Trajectory
        hintText = l10n.translate('assessment_hint_trajectory');
        break;
      case 6: // Associated symptoms
        hintText = l10n.translate('assessment_hint_associated');
        break;
      case 7: // Red-flag confirmation
        hintText = l10n.translate('assessment_hint_redflag');
        break;
      case 8: // Functional impact
        hintText = l10n.translate('assessment_hint_functional');
        break;
      case 9: // Triggers / Relief
        hintText = l10n.translate('assessment_hint_triggers');
        break;
      case 10: // Prior self-care
        hintText = l10n.translate('assessment_hint_selfcare');
        break;
      case 11: // Health context
        hintText = l10n.translate('assessment_hint_health_context');
        break;
      case 12: // Confirm understanding
        hintText = l10n.translate('assessment_hint_confirm');
        break;
      default:
        return const SizedBox.shrink();
    }
    
    if (hintText == null || hintText.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Text(
        hintText,
        style: TextStyle(
          fontSize: 13,
          color: AppTheme.textTertiary,
          fontWeight: FontWeight.w400,
          fontStyle: FontStyle.italic,
          height: 1.5,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildInputArea(AppLocalizations l10n) {
    final chatState = ref.read(chatProvider);
    final isFirstInput = chatState.isFirstInput;
    final isStep5Mode = _isStep5FreeTextMode;
    final isThai = ref.read(languageProvider).languageCode == 'th';
    
    if (!isFirstInput && !isStep5Mode) {
      return const SizedBox.shrink();
    }
    
    final hintText = isThai 
        ? 'เช่น ปวดหัวตุบ ๆ ตั้งแต่เมื่อวาน'
        : 'e.g., throbbing headache since yesterday';
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        border: Border(
          top: BorderSide(color: AppTheme.borderLight, width: 0.5),
        ),
      ),
      child: TextField(
        controller: _textController,
        decoration: InputDecoration(
          hintText: hintText,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6), // Notion-style: 6px
            borderSide: BorderSide(color: AppTheme.borderLight, width: 1),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6), // Notion-style: 6px
            borderSide: BorderSide(color: AppTheme.borderLight, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6), // Notion-style: 6px
            borderSide: BorderSide(color: AppTheme.primary, width: 2), // Primary color when focused
          ),
          filled: true,
          fillColor: AppTheme.gray1,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
          hintStyle: TextStyle(
            color: AppTheme.textTertiary,
            fontSize: 16,
            fontWeight: FontWeight.w400,
            height: 1.5,
          ),
        ),
        style: const TextStyle(
          fontSize: 16,
          color: AppTheme.textPrimary,
          height: 1.5,
        ),
        maxLines: null,
      ),
    );
  }

  Widget _buildTypedWord(String typedWord, bool isThai) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.gray1,
          borderRadius: BorderRadius.circular(12), // Rounded corners
          border: Border.all(
            color: AppTheme.borderLight,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.lock_outline,
              size: 16,
              color: AppTheme.textTertiary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                typedWord,
                style: TextStyle(
                  fontSize: 15,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w400,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSymptomSuggestions({Key? key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...List.generate(_symptomSuggestions.length, (index) {
          final suggestion = _symptomSuggestions[index];
          return Padding(
            padding: EdgeInsets.only(bottom: index < _symptomSuggestions.length - 1 ? 12 : 0),
            child: _buildSuggestionItem(suggestion),
          );
        }),
      ],
    );
  }

  Widget _buildSuggestionItem(SymptomSuggestion suggestion) {
    final chatState = ref.read(chatProvider);
    final isThai = ref.read(languageProvider).languageCode == 'th';
    
    // Extract typed phrase and expansion
    final displayText = suggestion.displayText;
    final typedWord = _typedWord.isNotEmpty ? _typedWord : '';
    
    // Find where typed phrase appears in suggestion
    String? anchorPhrase;
    String? expansionText;
    
    if (typedWord.isNotEmpty && displayText.toLowerCase().startsWith(typedWord.toLowerCase())) {
      anchorPhrase = typedWord;
      expansionText = displayText.substring(typedWord.length).trim();
    } else if (typedWord.isNotEmpty && displayText.toLowerCase().contains(typedWord.toLowerCase())) {
      // Typed phrase appears somewhere in the suggestion
      final index = displayText.toLowerCase().indexOf(typedWord.toLowerCase());
      anchorPhrase = displayText.substring(index, index + typedWord.length);
      expansionText = displayText.replaceAll(anchorPhrase, '').trim();
    } else {
      // No typed phrase match - show full text normally
      anchorPhrase = null;
      expansionText = displayText;
    }
    
    // Determine icon based on suggestion content (doctor-like visual cues)
    IconData suggestionIcon = Icons.medical_services_outlined;
    Color iconColor = AppTheme.primary;
    
    final textLower = displayText.toLowerCase();
    if (textLower.contains('ตา') || textLower.contains('eye')) {
      suggestionIcon = Icons.visibility_outlined;
    } else if (textLower.contains('ไอ') || textLower.contains('cough') || 
               textLower.contains('หายใจ') || textLower.contains('breath')) {
      suggestionIcon = Icons.air_outlined;
    } else if (textLower.contains('ปวด') || textLower.contains('pain') || 
               textLower.contains('เจ็บ') || textLower.contains('ache')) {
      suggestionIcon = Icons.healing_outlined;
    } else if (textLower.contains('ไข้') || textLower.contains('fever')) {
      suggestionIcon = Icons.thermostat_outlined;
    } else if (textLower.contains('รุนแรง') || textLower.contains('severe') ||
               textLower.contains('ร่วมกับ') || textLower.contains('with')) {
      suggestionIcon = Icons.warning_amber_outlined;
      iconColor = AppTheme.statusWarning;
    }
    
    return Material(
      color: Colors.transparent,
      child: GestureDetector(
        onTap: () => _selectSuggestion(suggestion),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18), // More generous padding for chip feel
          decoration: BoxDecoration(
            color: Colors.white, // Pure white for cleaner chip appearance
            borderRadius: BorderRadius.circular(20), // More rounded (pill-shaped chip)
            border: Border.all(
              color: AppTheme.borderLight.withValues(alpha: 0.3), // Softer border
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03), // Slightly more visible shadow for depth
                blurRadius: 6,
                offset: const Offset(0, 2),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Row(
            children: [
              // Subtle icon (doctor-like visual cue) - in a soft background circle
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1), // Soft colored background
                  borderRadius: BorderRadius.circular(18), // Circular icon container
                ),
                child: Icon(
                  suggestionIcon,
                  size: 18,
                  color: iconColor.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: anchorPhrase != null && expansionText != null && expansionText.isNotEmpty
                    ? RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 15,
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w400,
                            height: 1.5,
                          ),
                          children: [
                            // User's exact words - emphasized (bold, darker)
                            TextSpan(
                              text: anchorPhrase,
                              style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.w600, // Semibold for user's words
                              ),
                            ),
                            // Clinical expansion - normal text (secondary color)
                            TextSpan(
                              text: ' $expansionText',
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      )
                    : Text(
                        displayText,
                        style: const TextStyle(
                          fontSize: 15,
                          color: AppTheme.textPrimary,
                          fontWeight: FontWeight.w400,
                          height: 1.5,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Emergency Screen - Immediate transition when emergency detected
  Widget _buildEmergencyScreen(bool isThai) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isThai ? 'อาการฉุกเฉิน' : 'Emergency'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Emergency alert icon
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.statusEmergency.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.warning_amber_rounded,
                  size: 64,
                  color: AppTheme.statusEmergency,
                ),
              ),
              const SizedBox(height: 32),
              
              // Alert title
              Text(
                isThai ? '⚠️ อาการเข้าข่ายฉุกเฉิน' : '⚠️ Emergency Symptoms Detected',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              
              // One-sentence explanation
              Text(
                isThai 
                    ? 'จากข้อมูลที่คุณให้มา พบสัญญาณที่อาจเป็นอันตราย'
                    : 'Based on your information, potentially dangerous signs were detected',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textSecondary,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              // Strong instruction
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.cardBackground, // White background (Notion-style)
                  borderRadius: BorderRadius.circular(6), // Notion-style: 6px
                  border: Border.all(
                    color: AppTheme.borderLight, // Subtle gray border (Notion-style)
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.local_hospital,
                      size: 32,
                      color: AppTheme.statusEmergency,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isThai 
                          ? 'กรุณาไปโรงพยาบาลหรือโทร 1669 ทันที'
                          : 'Please go to the hospital or call 1669 immediately',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.statusEmergency,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // No OTC, No self-care, No further questions
              Text(
                isThai 
                    ? 'กรุณาไม่ใช้ยาหรือดูแลตัวเองเองในกรณีนี้'
                    : 'Please do not self-medicate or self-care in this case',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================
  // HERO SEARCH SECTION
  // ============================================
  Widget _buildHeroSearchSection(AppLocalizations l10n, bool isThai) {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E9), // Light mint/teal background
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero Question
          Text(
            l10n.translate('symptom_hero_question'),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 16),
          // Helper Text
          Text(
            l10n.translate('symptom_hero_helper'),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: AppTheme.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          // Micro-copy
          Text(
            l10n.translate('symptom_micro_copy'),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: AppTheme.textTertiary,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // COMMON SYMPTOMS SECTION
  // ============================================
  Widget _buildCommonSymptomsSection(AppLocalizations l10n, bool isThai) {
    final commonSymptoms = [
      {'emoji': '🤕', 'th': 'ปวดหัว', 'en': 'Headache'},
      {'emoji': '🤧', 'th': 'ไอแห้ง', 'en': 'Dry cough'},
      {'emoji': '🤢', 'th': 'คลื่นไส้', 'en': 'Nausea'},
      {'emoji': '🫀', 'th': 'ใจสั่น', 'en': 'Heart palpitations'},
      {'emoji': '🤒', 'th': 'ไข้', 'en': 'Fever'},
      {'emoji': '😷', 'th': 'เจ็บคอ', 'en': 'Sore throat'},
      {'emoji': '🤢', 'th': 'ท้องเสีย', 'en': 'Diarrhea'},
      {'emoji': '😵', 'th': 'เวียนหัว', 'en': 'Dizziness'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            l10n.translate('symptom_common_title'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Horizontal Scrollable Chips
        SizedBox(
          height: 48,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemCount: commonSymptoms.length,
            itemBuilder: (context, index) {
              final symptom = commonSymptoms[index];
              return Padding(
                padding: EdgeInsets.only(right: index < commonSymptoms.length - 1 ? 8 : 24),
                child: _buildSymptomChip(
                  symptom['emoji']!,
                  isThai ? symptom['th']! : symptom['en']!,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSymptomChip(String emoji, String text) {
    return GestureDetector(
      onTap: () {
        if (_isLoading) return; // Prevent multiple taps
        
        // Cancel any pending debounce timer
        _debounceTimer?.cancel();
        
        // Clear suggestions and typed word immediately
        setState(() {
          _showSuggestions = false;
          _typedWord = '';
          _previousText = '';
        });
        
        // Submit the symptom directly without triggering text change handlers
        _submitSymptom(text);
      },
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: AppTheme.borderLight,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              emoji,
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(width: 8),
            Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================
  // BODY SYSTEMS SECTION
  // ============================================
  Widget _buildBodySystemsSection(AppLocalizations l10n, bool isThai) {
    final bodySystems = [
      {
        'emoji': '🧠',
        'th': 'ระบบประสาท',
        'en': 'Nervous system',
        'primarySymptoms': ['ปวดหัว', 'เวียนหัว', 'หน้ามืด', 'ชา', 'ชัก']
      },
      {
        'emoji': '🫁',
        'th': 'ระบบหายใจ',
        'en': 'Respiratory',
        'primarySymptoms': ['ไอ', 'หายใจลำบาก', 'เจ็บคอ', 'น้ำมูกไหล', 'คัดจมูก']
      },
      {
        'emoji': '❤️',
        'th': 'หัวใจ',
        'en': 'Heart',
        'primarySymptoms': ['เจ็บหน้าอก', 'ใจสั่น', 'หายใจลำบาก', 'หน้ามืด']
      },
      {
        'emoji': '🦠',
        'th': 'ทางเดินอาหาร',
        'en': 'Digestive',
        'primarySymptoms': ['ปวดท้อง', 'ท้องเสีย', 'คลื่นไส้', 'อาเจียน', 'ท้องผูก']
      },
      {
        'emoji': '🦵',
        'th': 'กล้ามเนื้อ / ข้อ',
        'en': 'Muscles / Joints',
        'primarySymptoms': ['ปวดหลัง', 'ปวดคอ', 'ปวดบ่า', 'ปวดข้อ', 'ปวดเมื่อย']
      },
      {
        'emoji': '👁️',
        'th': 'ตา / หู / จมูก',
        'en': 'Eyes / Ears / Nose',
        'primarySymptoms': ['ตาแดง', 'ปวดตา', 'ตาพร่า', 'หูอื้อ', 'น้ำมูกไหล']
      },
      {
        'emoji': '🦷',
        'th': 'ปาก / ฟัน',
        'en': 'Mouth / Teeth',
        'primarySymptoms': ['ปวดฟัน', 'เจ็บคอ', 'แผลในปาก']
      },
      {
        'emoji': '🩸',
        'th': 'เลือด / ภูมิคุ้มกัน',
        'en': 'Blood / Immune',
        'primarySymptoms': ['ไข้', 'ผื่น', 'บวม', 'อ่อนเพลีย', 'เลือดออก']
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            l10n.translate('symptom_body_systems_title'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        // 2-Column Grid
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 1.5,
            ),
            itemCount: bodySystems.length,
            itemBuilder: (context, index) {
              final system = bodySystems[index];
              return _buildBodySystemCard(
                system['emoji'] as String,
                isThai ? (system['th'] as String) : (system['en'] as String),
                (system['primarySymptoms'] as List<String>?) ?? [],
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBodySystemCard(String emoji, String text, List<String> primarySymptoms) {
    return GestureDetector(
      onTap: () async {
        // CRITICAL: Set flag to prevent _onTextChanged from overwriting our clinical suggestions
        setState(() {
          _isLoadingBodySystemSuggestions = true;
          _typedWord = text;
          _showSuggestions = false; // Hide while loading
          _previousText = text; // Update previous text to prevent _onTextChanged from triggering
        });
        
        // Cancel any pending debounce timer
        _debounceTimer?.cancel();
        
        // Set the text in search field (body system name)
        // NOTE: This will trigger _onTextChanged, but it will return early due to _isLoadingBodySystemSuggestions flag
        _textController.text = text;
        _previousText = text; // Update again after setting text
        
        // Focus the text field to show it's active
        FocusScope.of(context).requestFocus(FocusNode());
        
        // Load clinical-grade suggestions for this body system
        // Use primary symptoms to get 8-12 clinical variations
        final currentLocale = ref.read(languageProvider);
        final language = currentLocale.languageCode;
        
        debugPrint('🔍 Loading clinical suggestions for body system: $text');
        debugPrint('   Primary symptoms: $primarySymptoms');
        
        // Get suggestions for each primary symptom and combine
        final allSuggestions = <SymptomSuggestion>[];
        final seenTexts = <String>{};
        
        for (final primarySymptom in primarySymptoms) {
          final suggestions = await SymptomSuggestionService.getSuggestions(
            primarySymptom,
            language: language,
          );
          
          // Add unique suggestions (avoid duplicates)
          for (final suggestion in suggestions) {
            if (!seenTexts.contains(suggestion.displayText) && allSuggestions.length < 12) {
              allSuggestions.add(suggestion);
              seenTexts.add(suggestion.displayText);
            }
          }
          
          // Stop if we have enough (8-12 suggestions)
          if (allSuggestions.length >= 12) break;
        }
        
        // If we don't have enough, try searching with body system name
        if (allSuggestions.length < 8) {
          final fallbackSuggestions = await SymptomSuggestionService.getSuggestions(
            text,
            language: language,
          );
          
          for (final suggestion in fallbackSuggestions) {
            if (!seenTexts.contains(suggestion.displayText) && allSuggestions.length < 12) {
              allSuggestions.add(suggestion);
              seenTexts.add(suggestion.displayText);
            }
          }
        }
        
        if (mounted) {
          setState(() {
            _symptomSuggestions = allSuggestions;
            _showSuggestions = allSuggestions.isNotEmpty;
            _isLoadingBodySystemSuggestions = false; // Clear flag after loading complete
          });
          
          debugPrint('✅ Loaded ${allSuggestions.length} clinical suggestions for $text');
          
          // Scroll to suggestions if they exist
          if (allSuggestions.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              // Try to scroll to suggestions section
              final context = _suggestionsKey.currentContext;
              if (context != null) {
                Scrollable.ensureVisible(
                  context,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  alignment: 0.1,
                );
              }
            });
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.borderLight,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Adapt to available space - reduce sizes if constrained
            final isVerySmall = constraints.maxHeight < 50;
            final emojiSize = isVerySmall ? 20.0 : 32.0;
            final textSize = isVerySmall ? 11.0 : 14.0;
            final spacing = isVerySmall ? 4.0 : 8.0;
            
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  flex: 1,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      emoji,
                      style: TextStyle(fontSize: emojiSize),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                SizedBox(height: spacing),
                Flexible(
                  flex: 2,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      text,
                      style: TextStyle(
                        fontSize: textSize,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  // ============================================

  void _submitSymptom(String symptom) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final chatNotifier = ref.read(chatProvider.notifier);
      await chatNotifier.sendMessage(symptom);
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
