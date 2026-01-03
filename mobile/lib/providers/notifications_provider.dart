import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/notification_service.dart';

/// Notification Service Provider
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref: ref);
});

/// Pending Notifications Provider
final pendingNotificationsProvider = FutureProvider<List<NotificationModel>>((ref) async {
  final service = ref.read(notificationServiceProvider);
  return await service.getPendingNotifications();
});

/// Refresh notifications provider
final refreshNotificationsProvider = Provider<void Function()>((ref) {
  return () {
    ref.invalidate(pendingNotificationsProvider);
  };
});

