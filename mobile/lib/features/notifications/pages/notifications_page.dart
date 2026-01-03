import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/language_provider.dart';
import '../../../providers/notifications_provider.dart';
import '../../../widgets/notification_card.dart';
import '../../../services/notification_service.dart';

/// Notifications Page
/// Displays all pending notifications for the user
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isThai = ref.watch(languageProvider) == 'th';
    final l10n = AppLocalizations.of(context);
    final notificationsAsync = ref.watch(pendingNotificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          isThai ? 'การแจ้งเตือน' : 'Notifications',
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          if (notifications.isEmpty) {
            return _buildEmptyState(isThai);
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(pendingNotificationsProvider);
              await ref.read(pendingNotificationsProvider.future);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Text(
                    isThai
                      ? 'การแจ้งเตือนติดตามอาการ'
                      : 'Follow-up Notifications',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isThai
                      ? '${notifications.length} รายการ'
                      : '${notifications.length} items',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Notification cards
                  ...notifications.map((notification) {
                    return NotificationCard(
                      notification: notification,
                      onResponded: () {
                        // Refresh list after response
                        ref.invalidate(pendingNotificationsProvider);
                      },
                      onDismissed: () {
                        // Refresh list after dismiss
                        ref.invalidate(pendingNotificationsProvider);
                      },
                    );
                  }).toList(),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 48,
                color: AppTheme.textSecondary,
              ),
              const SizedBox(height: 16),
              Text(
                isThai
                  ? 'เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน'
                  : 'Error loading notifications',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref.invalidate(pendingNotificationsProvider);
                },
                child: Text(
                  isThai ? 'ลองอีกครั้ง' : 'Try again',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isThai) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none_outlined,
            size: 64,
            color: AppTheme.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 24),
          Text(
            isThai
              ? 'ยังไม่มีการแจ้งเตือน'
              : 'No notifications',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isThai
              ? 'เมื่อมีการแจ้งเตือนติดตามอาการ\nจะแสดงที่นี่'
              : 'Follow-up notifications\nwill appear here',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

