import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../utils/timezone_utils.dart';
import 'dart:developer' as developer;

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/language_provider.dart';
import '../../../services/followup_service.dart';
import '../../../services/triage_service.dart';
import '../../../services/sessions_service.dart';
import '../../../models/triage_models.dart';
import '../../../models/session_models.dart';
import '../../../features/home/providers/sessions_provider.dart';

/// Follow-up Confirmation Page
/// Shows confirmation after saving follow-up data from assessment summary
class FollowupConfirmationPage extends ConsumerStatefulWidget {
  final String sessionId;

  const FollowupConfirmationPage({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<FollowupConfirmationPage> createState() => _FollowupConfirmationPageState();
}

class _FollowupConfirmationPageState extends ConsumerState<FollowupConfirmationPage> {
  bool _isLoading = true;
  DiagnosisResponse? _diagnosis;
  TriageSession? _session;
  DateTime? _savedTime;
  FollowupStatus? _savedStatus;
  List<FollowupAction>? _savedActions;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      // Load both diagnosis and session data
      final triageService = TriageService();
      final diagnosis = await triageService.getDiagnosis(
        sessionId: widget.sessionId,
      );
      
      // Load session to get symptom text using provider
      final sessions = await ref.read(sessionsProvider.future);
      final session = sessions.firstWhere(
        (s) => s.sessionId == widget.sessionId,
        orElse: () => TriageSession(
          sessionId: widget.sessionId,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          triageLevel: 'uncertain',
          symptoms: [],
        ),
      );
      
      setState(() {
        _diagnosis = diagnosis;
        _session = session;
        _savedTime = DateTime.now();
        // Default values since we're saving without user input
        _savedStatus = FollowupStatus.same;
        _savedActions = [];
        _isLoading = false;
      });
    } catch (e) {
      developer.log('Error loading confirmation data: $e', name: 'FollowupConfirmation');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        // Show error message to user
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(languageProvider).languageCode == 'th'
                  ? 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
                  : 'Unable to load data. Please try again.',
            ),
            backgroundColor: AppTheme.statusWarning,
          ),
        );
      }
    }
  }

  Future<void> _handleBackToHome() async {
    // Invalidate sessions provider to refresh home page
    ref.invalidate(sessionsProvider);
    
    // Navigate to home
    if (mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isThai = ref.read(languageProvider).languageCode == 'th';

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('followup_confirmation_title')),
        elevation: 0,
      ),
      body: _isLoading || _diagnosis == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Success Icon
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.statusSafe.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle_outline,
                      size: 48,
                      color: AppTheme.statusSafe,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Confirmation Message
                  Text(
                    l10n.translate('followup_confirmation_message'),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.translate('followup_confirmation_submessage'),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.normal,
                      color: AppTheme.textSecondary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  
                  // Summary Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.cardBackground,
                      borderRadius: BorderRadius.circular(16),
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Symptom
                        _buildSummaryRow(
                          icon: Icons.medical_services_outlined,
                          label: l10n.translate('followup_confirmation_symptom'),
                          value: _session != null && _session!.symptoms.isNotEmpty 
                              ? _session!.symptoms.first 
                              : (isThai ? 'ไม่มีอาการ' : 'No symptom'),
                        ),
                        const SizedBox(height: 16),
                        
                        // Current Status
                        _buildSummaryRow(
                          icon: Icons.info_outline,
                          label: l10n.translate('followup_confirmation_status'),
                          value: _getStatusText(_savedStatus!, isThai),
                        ),
                        const SizedBox(height: 16),
                        
                        // Care Taken
                        _buildSummaryRow(
                          icon: Icons.healing_outlined,
                          label: l10n.translate('followup_confirmation_care'),
                          value: _savedActions!.isEmpty 
                              ? (isThai ? 'ยังไม่ได้ทำอะไร' : 'Haven\'t done anything yet')
                              : _getActionsText(_savedActions!, isThai),
                        ),
                        const SizedBox(height: 16),
                        
                        // Saved Time
                        _buildSummaryRow(
                          icon: Icons.access_time_outlined,
                          label: l10n.translate('followup_confirmation_time'),
                          value: _formatTime(_savedTime!, isThai),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Optional Info about Follow-up Timing
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.gray1,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 20,
                          color: AppTheme.textSecondary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            l10n.translate('followup_confirmation_info'),
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.textSecondary,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Primary CTA Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleBackToHome,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        l10n.translate('followup_confirmation_back_home'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: AppTheme.textSecondary,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textTertiary,
                  fontWeight: FontWeight.normal,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getStatusText(FollowupStatus status, bool isThai) {
    switch (status) {
      case FollowupStatus.better:
        return isThai ? 'ดีขึ้นแล้ว' : 'Improved';
      case FollowupStatus.same:
        return isThai ? 'ยังพอเป็นอยู่' : 'About the same';
      case FollowupStatus.worse:
        return isThai ? 'แย่ลง' : 'Worse';
      case FollowupStatus.unsure:
        return isThai ? 'ยังไม่แน่ใจ' : 'Not sure';
    }
  }

  String _getActionsText(List<FollowupAction> actions, bool isThai) {
    if (actions.isEmpty) {
      return isThai ? 'ยังไม่ได้ทำอะไร' : 'Haven\'t done anything yet';
    }
    
    final actionTexts = actions.map((action) {
      switch (action) {
        case FollowupAction.homeCare:
          return isThai ? 'ดูแลตัวเองที่บ้าน' : 'Self-care at home';
        case FollowupAction.medication:
          return isThai ? 'ทานยาที่แนะนำ' : 'Took the recommended medication';
        case FollowupAction.doctor:
          return isThai ? 'ไปพบแพทย์' : 'Saw a doctor';
        case FollowupAction.emergency:
          return isThai ? 'ไปโรงพยาบาลฉุกเฉิน' : 'Went to emergency care';
        case FollowupAction.nothing:
          return isThai ? 'ยังไม่ได้ทำอะไร' : 'Haven\'t done anything yet';
      }
    }).toList();
    
    return actionTexts.join(', ');
  }

  String _formatTime(DateTime time, bool isThai) {
    // Convert UTC to Thailand timezone (UTC+7)
    final thailandTime = TimezoneUtils.toThailandTime(time);
    final now = DateTime.now().add(const Duration(hours: 7)); // Adjust now to Thailand time
    final difference = now.difference(thailandTime);
    
    if (difference.inMinutes < 1) {
      return isThai ? 'เมื่อสักครู่' : 'Just now';
    } else if (difference.inMinutes < 60) {
      return isThai 
          ? '${difference.inMinutes} นาทีที่แล้ว'
          : '${difference.inMinutes} minutes ago';
    } else if (difference.inHours < 24) {
      return isThai
          ? '${difference.inHours} ชั่วโมงที่แล้ว'
          : '${difference.inHours} hours ago';
    } else {
      final formatter = DateFormat(isThai ? 'd MMM yyyy HH:mm น.' : 'MMM d, yyyy HH:mm');
      return formatter.format(thailandTime);
    }
  }
}

