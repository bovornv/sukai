import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../app/theme.dart';
import '../l10n/app_localizations.dart';
import '../providers/language_provider.dart';
import '../services/notification_service.dart';
import '../providers/notifications_provider.dart';

/// Notification Card Widget
/// Displays a single notification with response buttons
class NotificationCard extends ConsumerStatefulWidget {
  final NotificationModel notification;
  final VoidCallback? onResponded;
  final VoidCallback? onDismissed;

  const NotificationCard({
    super.key,
    required this.notification,
    this.onResponded,
    this.onDismissed,
  });

  @override
  ConsumerState<NotificationCard> createState() => _NotificationCardState();
}

class _NotificationCardState extends ConsumerState<NotificationCard> {
  bool _isResponding = false;
  bool _isDismissing = false;

  String _getNotificationTitle(bool isThai, String notificationType, String? userName) {
    final name = userName ?? (isThai ? 'คุณ' : 'User');
    
    switch (notificationType) {
      case '24h':
        return isThai 
          ? 'สวัสดีค่ะ $name 😊'
          : 'Hi $name 😊';
      case '48h':
        return isThai
          ? 'สวัสดีค่ะ $name 💚'
          : 'Hi $name 💚';
      case 'safety':
        return isThai
          ? 'สวัสดีค่ะ $name 🩺'
          : 'Hi $name 🩺';
      default:
        return isThai
          ? 'สวัสดีค่ะ $name'
          : 'Hi $name';
    }
  }

  String _getNotificationBody(bool isThai, String notificationType, String? symptom) {
    final symptomText = symptom ?? (isThai ? 'อาการของคุณ' : 'your symptoms');
    
    switch (notificationType) {
      case '24h':
        return isThai
          ? 'เมื่อวานคุณตรวจอาการ $symptomText กับ Suk AI ไป ตอนนี้อาการเป็นอย่างไรบ้างคะ? แค่ตอบสั้น ๆ ก็ได้ค่ะ'
          : 'You checked your $symptomText with Suk AI yesterday. How are you feeling now? Just a quick update is fine.';
      case '48h':
        return isThai
          ? 'ผ่านไป 2 วันแล้วนะคะ หลังจากที่คุณตรวจอาการ $symptomText กับ Suk AI ไป ตอนนี้อาการเป็นอย่างไรบ้างคะ? ถ้ายังไม่ดีขึ้น หรือมีคำถามเพิ่มเติม Suk AI พร้อมช่วยเสมอนะคะ'
          : 'It\'s been 2 days since you checked your $symptomText with Suk AI. How are you feeling now? If you\'re not feeling better or have questions, Suk AI is here to help.';
      case 'safety':
        return isThai
          ? 'เมื่อวานคุณตรวจอาการ $symptomText กับ Suk AI ไป และมีสัญญาณบางอย่างที่ควรติดตาม ตอนนี้อาการเป็นอย่างไรบ้างคะ? ถ้ายังไม่ดีขึ้น หรือมีอาการใหม่ ควรพบแพทย์นะคะ'
          : 'Yesterday you checked your $symptomText with Suk AI, and there were some signs worth monitoring. How are you feeling now? If you\'re not feeling better or have new symptoms, please see a doctor.';
      default:
        return isThai
          ? 'อาการ $symptomText เป็นอย่างไรบ้างคะ?'
          : 'How is your $symptomText feeling?';
    }
  }

  List<NotificationResponse> _getResponseOptions(String notificationType) {
    switch (notificationType) {
      case '24h':
        return [
          NotificationResponse.improved,
          NotificationResponse.same,
          NotificationResponse.worse,
          NotificationResponse.unsure,
        ];
      case '48h':
        return [
          NotificationResponse.improved,
          NotificationResponse.same,
          NotificationResponse.worse,
          NotificationResponse.reassess,
        ];
      case 'safety':
        return [
          NotificationResponse.improved,
          NotificationResponse.same,
          NotificationResponse.worse,
          NotificationResponse.reassess,
          NotificationResponse.doctor,
        ];
      default:
        return [
          NotificationResponse.improved,
          NotificationResponse.same,
          NotificationResponse.worse,
        ];
    }
  }

  String _getResponseButtonText(bool isThai, NotificationResponse response) {
    switch (response) {
      case NotificationResponse.improved:
        return isThai ? 'ดีขึ้นแล้ว' : 'Improved';
      case NotificationResponse.same:
        return isThai ? 'ยังเหมือนเดิม' : 'About the same';
      case NotificationResponse.worse:
        return isThai ? 'แย่ลง' : 'Worse';
      case NotificationResponse.unsure:
        return isThai ? 'ยังไม่แน่ใจ' : 'Not sure';
      case NotificationResponse.reassess:
        return isThai ? 'ตรวจอาการใหม่' : 'Re-assess';
      case NotificationResponse.doctor:
        return isThai ? 'ไปพบแพทย์' : 'See doctor';
      case NotificationResponse.skip:
        return isThai ? 'ข้าม' : 'Skip';
    }
  }

  Future<void> _handleResponse(NotificationResponse response) async {
    if (_isResponding) return;
    
    setState(() {
      _isResponding = true;
    });

    try {
      final service = ref.read(notificationServiceProvider);
      final success = await service.respondToNotification(
        widget.notification.id,
        response,
      );

      if (success && mounted) {
        // Refresh notifications
        ref.invalidate(pendingNotificationsProvider);
        
        // Handle navigation based on response
        if (response == NotificationResponse.reassess) {
          // Navigate to new assessment
          context.push('/chat');
        } else if (response == NotificationResponse.doctor) {
          // Could navigate to doctor finder or show info
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                ref.read(languageProvider) == 'th'
                  ? 'กรุณาไปพบแพทย์เพื่อรับการดูแลที่เหมาะสม'
                  : 'Please see a doctor for appropriate care',
              ),
            ),
          );
        } else if (response == NotificationResponse.worse) {
          // Navigate to reassessment
          context.push('/chat');
        }
        
        widget.onResponded?.call();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(languageProvider) == 'th'
                ? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
                : 'An error occurred. Please try again',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref.read(languageProvider) == 'th'
                ? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
                : 'An error occurred. Please try again',
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isResponding = false;
        });
      }
    }
  }

  Future<void> _handleDismiss() async {
    if (_isDismissing) return;
    
    setState(() {
      _isDismissing = true;
    });

    try {
      final service = ref.read(notificationServiceProvider);
      final success = await service.dismissNotification(widget.notification.id);

      if (success && mounted) {
        ref.invalidate(pendingNotificationsProvider);
        widget.onDismissed?.call();
      }
    } catch (e) {
      // Silent fail for dismiss
    } finally {
      if (mounted) {
        setState(() {
          _isDismissing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isThai = ref.watch(languageProvider) == 'th';
    final l10n = AppLocalizations.of(context);
    
    // If already responded, show a simple confirmation card
    if (widget.notification.isResponded) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppTheme.borderLight.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.check_circle_outline,
              color: AppTheme.statusSafe,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isThai
                  ? 'คุณได้ตอบคำถามแล้ว'
                  : 'You have already responded',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final responseOptions = _getResponseOptions(widget.notification.notificationType);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Text(
              _getNotificationTitle(isThai, widget.notification.notificationType, null),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            
            // Body
            Text(
              _getNotificationBody(isThai, widget.notification.notificationType, widget.notification.symptom),
              style: TextStyle(
                fontSize: 15,
                height: 1.5,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            
            // Response buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: responseOptions.map((response) {
                return OutlinedButton(
                  onPressed: _isResponding ? null : () => _handleResponse(response),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    side: BorderSide(
                      color: AppTheme.primary.withValues(alpha: 0.3),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: Text(
                    _getResponseButtonText(isThai, response),
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.primary,
                    ),
                  ),
                );
              }).toList(),
            ),
            
            const SizedBox(height: 12),
            
            // Skip button
            TextButton(
              onPressed: _isDismissing ? null : _handleDismiss,
              child: Text(
                isThai ? 'ข้าม' : 'Skip',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

